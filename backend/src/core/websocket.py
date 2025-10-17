"""
WebSocket configuration and handlers for FusionAI Enterprise Suite
"""

import json
import logging
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter

logger = logging.getLogger(__name__)

# WebSocket router
websocket_router = APIRouter()

# Active connections
active_connections: Dict[str, WebSocket] = {}


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket connected: {client_id}")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket disconnected: {client_id}")
    
    async def send_personal_message(self, message: str, client_id: str):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients."""
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def send_json(self, data: Dict[str, Any], client_id: str = None):
        """Send JSON data to a client or broadcast."""
        message = json.dumps(data)
        if client_id:
            await self.send_personal_message(message, client_id)
        else:
            await self.broadcast(message)


# Global connection manager
manager = ConnectionManager()


@websocket_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint."""
    client_id = f"client_{id(websocket)}"
    
    try:
        await manager.connect(websocket, client_id)
        
        # Send welcome message
        await manager.send_json({
            "type": "connection",
            "message": "Connected to FusionAI Enterprise Suite",
            "client_id": client_id
        }, client_id)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            await handle_websocket_message(client_id, message_data)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


async def handle_websocket_message(client_id: str, message_data: Dict[str, Any]):
    """Handle incoming WebSocket messages."""
    message_type = message_data.get("type")
    
    try:
        if message_type == "ping":
            # Respond to ping with pong
            await manager.send_json({
                "type": "pong",
                "timestamp": message_data.get("timestamp")
            }, client_id)
        
        elif message_type == "subscribe":
            # Subscribe to specific events
            event_type = message_data.get("event_type")
            await manager.send_json({
                "type": "subscription",
                "event_type": event_type,
                "status": "subscribed"
            }, client_id)
        
        elif message_type == "unsubscribe":
            # Unsubscribe from events
            event_type = message_data.get("event_type")
            await manager.send_json({
                "type": "unsubscription",
                "event_type": event_type,
                "status": "unsubscribed"
            }, client_id)
        
        elif message_type == "ai_chat":
            # Handle AI chat messages
            message = message_data.get("message", "")
            await handle_ai_chat_message(client_id, message)
        
        else:
            # Unknown message type
            await manager.send_json({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }, client_id)
    
    except Exception as e:
        logger.error(f"Error handling message from {client_id}: {e}")
        await manager.send_json({
            "type": "error",
            "message": "Error processing message"
        }, client_id)


async def handle_ai_chat_message(client_id: str, message: str):
    """Handle AI chat messages."""
    try:
        # TODO: Integrate with AI agent orchestrator
        # For now, send a mock response
        
        response = {
            "type": "ai_response",
            "message": f"AI Response to: {message}",
            "timestamp": "2024-01-15T12:00:00Z",
            "agent": "GeneralAgent"
        }
        
        await manager.send_json(response, client_id)
        
    except Exception as e:
        logger.error(f"Error handling AI chat message: {e}")
        await manager.send_json({
            "type": "error",
            "message": "Error processing AI chat message"
        }, client_id)


async def broadcast_notification(notification: Dict[str, Any]):
    """Broadcast a notification to all connected clients."""
    message = {
        "type": "notification",
        "data": notification
    }
    await manager.broadcast(json.dumps(message))


async def broadcast_module_update(module_name: str, data: Dict[str, Any]):
    """Broadcast a module update to all connected clients."""
    message = {
        "type": "module_update",
        "module": module_name,
        "data": data
    }
    await manager.broadcast(json.dumps(message))


async def broadcast_ai_agent_status(agent_name: str, status: str):
    """Broadcast AI agent status update."""
    message = {
        "type": "agent_status",
        "agent": agent_name,
        "status": status
    }
    await manager.broadcast(json.dumps(message))




