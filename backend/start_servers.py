#!/usr/bin/env python3
"""
Startup script for FusionAI Enterprise Suite
Runs both the main API server and WebSocket server
"""

import subprocess
import time
import signal
import sys
import os
from pathlib import Path

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n🛑 Shutting down servers...')
    sys.exit(0)

def start_websocket_server():
    """Start WebSocket server on port 8080"""
    print("🚀 Starting WebSocket server on port 8080...")
    return subprocess.Popen([
        sys.executable, "-m", "src.core.websocket_server"
    ], cwd=Path(__file__).parent)

def start_api_server():
    """Start main API server on port 3001"""
    print("🚀 Starting API server on port 3001...")
    return subprocess.Popen([
        sys.executable, "-m", "uvicorn", "simple_main:app",
        "--host", "0.0.0.0",
        "--port", "3001",
        "--reload"
    ], cwd=Path(__file__).parent)

def main():
    """Main startup function"""
    signal.signal(signal.SIGINT, signal_handler)
    
    print("🎯 FusionAI Enterprise Suite - Starting Services")
    print("=" * 50)
    
    # Start WebSocket server
    ws_process = start_websocket_server()
    time.sleep(2)  # Give WebSocket server time to start
    
    # Start API server
    api_process = start_api_server()
    
    print("\n✅ All services started!")
    print("📡 API Server: http://localhost:3001")
    print("🔌 WebSocket: http://localhost:8080")
    print("📚 API Docs: http://localhost:3001/docs")
    print("❤️  Health Check: http://localhost:3001/health")
    print("\nPress Ctrl+C to stop all services")
    
    try:
        # Wait for both processes
        while True:
            time.sleep(1)
            # Check if processes are still running
            if ws_process.poll() is not None:
                print("❌ WebSocket server stopped unexpectedly")
                break
            if api_process.poll() is not None:
                print("❌ API server stopped unexpectedly")
                break
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    
    # Clean up processes
    ws_process.terminate()
    api_process.terminate()
    
    # Wait for graceful shutdown
    try:
        ws_process.wait(timeout=5)
        api_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        print("⚠️  Force killing processes...")
        ws_process.kill()
        api_process.kill()
    
    print("✅ All services stopped")

if __name__ == "__main__":
    main()




