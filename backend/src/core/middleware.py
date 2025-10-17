"""
Custom middleware for FusionAI Enterprise Suite
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)


class LoggingMiddleware:
    """Middleware for request/response logging."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        start_time = time.time()
        
        # Log request
        logger.info(
            "Request started",
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        # Process request
        response_sent = False
        
        async def send_wrapper(message):
            nonlocal response_sent
            if message["type"] == "http.response.start" and not response_sent:
                response_sent = True
                process_time = time.time() - start_time
                
                # Log response
                logger.info(
                    "Request completed",
                    method=request.method,
                    path=request.url.path,
                    status_code=message["status"],
                    process_time=process_time,
                )
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


class RateLimitMiddleware:
    """Middleware for rate limiting."""
    
    def __init__(self, app, requests_per_minute: int = 100):
        self.app = app
        self.requests_per_minute = requests_per_minute
        self.requests = {}
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        self.requests = {
            ip: timestamps for ip, timestamps in self.requests.items()
            if any(t > current_time - 60 for t in timestamps)
        }
        
        # Check rate limit
        if client_ip in self.requests:
            recent_requests = [t for t in self.requests[client_ip] if t > current_time - 60]
            if len(recent_requests) >= self.requests_per_minute:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"}
                )
                await response(scope, receive, send)
                return
        
        # Add current request
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append(current_time)
        
        await self.app(scope, receive, send)


class SecurityHeadersMiddleware:
    """Middleware for adding security headers."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                
                # Add security headers
                security_headers = {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "X-XSS-Protection": "1; mode=block",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
                }
                
                for header, value in security_headers.items():
                    if header not in headers:
                        headers[header] = value
                
                message["headers"] = list(headers.items())
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)




