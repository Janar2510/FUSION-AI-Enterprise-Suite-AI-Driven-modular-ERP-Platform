"""
WebSocket Server for FusionAI Enterprise Suite
Handles real-time communication between frontend and backend
"""

import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import asyncio
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Configure for your domain in production
    logger=True,
    engineio_logger=True
)

# Create FastAPI app
app = FastAPI(title="FusionAI WebSocket Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path='/socket.io'
)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[str]] = {}  # user_id: [session_ids]
        self.session_to_user: Dict[str, str] = {}  # session_id: user_id
    
    async def connect(self, session_id: str, user_id: str):
        """Register a new connection"""
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(session_id)
        self.session_to_user[session_id] = user_id
        logger.info(f"User {user_id} connected with session {session_id}")
    
    def disconnect(self, session_id: str):
        """Remove a connection"""
        if session_id in self.session_to_user:
            user_id = self.session_to_user[session_id]
            if user_id in self.active_connections:
                self.active_connections[user_id].remove(session_id)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            del self.session_to_user[session_id]
            logger.info(f"User {user_id} disconnected session {session_id}")
    
    async def send_to_user(self, user_id: str, event: str, data: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            for session_id in self.active_connections[user_id]:
                await sio.emit(event, data, room=session_id)
    
    async def broadcast(self, event: str, data: dict):
        """Broadcast to all connected users"""
        await sio.emit(event, data)

manager = ConnectionManager()

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    # Get user_id from query params or auth
    query_params = environ.get('QUERY_STRING', '')
    user_id = "default_user"  # Extract from auth token in production
    
    await manager.connect(sid, user_id)
    await sio.emit('connection_established', {'status': 'connected'}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")
    manager.disconnect(sid)

@sio.event
async def ping(sid, data):
    """Health check endpoint"""
    await sio.emit('pong', {'timestamp': data.get('timestamp')}, room=sid)

# REST endpoint for testing
@app.get("/health")
async def health_check():
    return {"status": "healthy", "websocket": "ready", "connections": len(manager.session_to_user)}

# Function to emit events from other parts of the application
async def emit_to_user(user_id: str, event: str, data: dict):
    """Emit event to specific user from anywhere in the app"""
    await manager.send_to_user(user_id, event, data)

async def emit_to_all(event: str, data: dict):
    """Broadcast event to all connected users"""
    await manager.broadcast(event, data)

# Export for use in other modules
websocket_server = {
    'app': socket_app,
    'emit_to_user': emit_to_user,
    'emit_to_all': emit_to_all,
    'manager': manager
}

# Run server if executed directly
if __name__ == "__main__":
    logger.info("Starting WebSocket server on port 8080...")
    uvicorn.run(
        socket_app,
        host="0.0.0.0",
        port=8080,
        log_level="info"
    )




