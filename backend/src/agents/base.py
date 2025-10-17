"""
Base AI Agent class for FusionAI Enterprise Suite
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json

from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain.memory import ConversationBufferMemory
from langchain.tools import BaseTool
from langchain.agents import AgentExecutor
from langchain.callbacks import AsyncIteratorCallbackHandler

from src.core.redis import get_redis, CacheManager

logger = logging.getLogger(__name__)


class AgentCallbackHandler(AsyncIteratorCallbackHandler):
    """Custom callback handler for agent operations."""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"agent.{agent_name}")
    
    async def on_agent_action(self, action: Dict[str, Any], **kwargs) -> None:
        """Called when agent takes an action."""
        self.logger.info(f"Agent action: {action}")
    
    async def on_agent_finish(self, finish: Dict[str, Any], **kwargs) -> None:
        """Called when agent finishes."""
        self.logger.info(f"Agent finished: {finish}")


class BaseAgent(ABC):
    """Base class for all AI agents in the system."""
    
    def __init__(
        self,
        llm,
        memory: ConversationBufferMemory,
        redis,
        cache: CacheManager,
        name: Optional[str] = None
    ):
        self.llm = llm
        self.memory = memory
        self.redis = redis
        self.cache = cache
        self.name = name or self.__class__.__name__
        self.tools: List[BaseTool] = []
        self.callback_handler = AgentCallbackHandler(self.name)
        self.is_initialized = False
        self.capabilities: List[str] = []
        self.max_decision_amount = 10000
        self.response_timeout = 30
        
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the agent with tools and capabilities."""
        pass
    
    @abstractmethod
    async def process_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a user request."""
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """Get list of agent capabilities."""
        pass
    
    async def handle_message(self, message) -> None:
        """Handle inter-agent messages."""
        try:
            if message.message_type == "request":
                await self._handle_request_message(message)
            elif message.message_type == "response":
                await self._handle_response_message(message)
            elif message.message_type == "event":
                await self._handle_event_message(message)
            else:
                logger.warning(f"Unknown message type: {message.message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message in {self.name}: {e}")
    
    async def _handle_request_message(self, message) -> None:
        """Handle request messages from other agents."""
        # Override in subclasses for specific handling
        pass
    
    async def _handle_response_message(self, message) -> None:
        """Handle response messages from other agents."""
        # Override in subclasses for specific handling
        pass
    
    async def _handle_event_message(self, message) -> None:
        """Handle event messages from other agents."""
        # Override in subclasses for specific handling
        pass
    
    async def send_message(
        self, 
        target: str, 
        message_type: str, 
        payload: Dict[str, Any],
        priority: str = "medium"
    ) -> None:
        """Send a message to another agent."""
        try:
            message = {
                "message_type": message_type,
                "source": self.name,
                "target": target,
                "payload": payload,
                "priority": priority,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Publish to Redis for inter-agent communication
            await self.redis.publish(f"agent_messages:{target}", json.dumps(message))
            
        except Exception as e:
            logger.error(f"Error sending message from {self.name}: {e}")
    
    async def get_memory_context(self, query: str) -> str:
        """Get relevant context from memory."""
        try:
            # Get recent conversation history
            recent_messages = self.memory.chat_memory.messages[-10:]  # Last 10 messages
            
            context = ""
            for message in recent_messages:
                if isinstance(message, HumanMessage):
                    context += f"Human: {message.content}\n"
                elif isinstance(message, AIMessage):
                    context += f"Assistant: {message.content}\n"
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting memory context: {e}")
            return ""
    
    async def store_interaction(
        self, 
        request: str, 
        response: str, 
        user_id: Optional[str] = None
    ) -> None:
        """Store interaction in memory and cache."""
        try:
            # Add to conversation memory
            self.memory.chat_memory.add_user_message(request)
            self.memory.chat_memory.add_ai_message(response)
            
            # Store in cache for quick retrieval
            interaction = {
                "request": request,
                "response": response,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "agent": self.name
            }
            
            cache_key = f"interaction:{self.name}:{hash(request)}"
            await self.cache.set(cache_key, interaction, ttl=86400)  # 24 hours
            
        except Exception as e:
            logger.error(f"Error storing interaction: {e}")
    
    async def validate_request(self, request: str) -> bool:
        """Validate if the request is appropriate for this agent."""
        try:
            # Basic validation - can be overridden in subclasses
            if not request or len(request.strip()) == 0:
                return False
            
            # Check for harmful content (basic implementation)
            harmful_keywords = ["hack", "exploit", "malware", "virus"]
            request_lower = request.lower()
            
            for keyword in harmful_keywords:
                if keyword in request_lower:
                    logger.warning(f"Potentially harmful request detected: {keyword}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating request: {e}")
            return False
    
    async def check_decision_limits(self, amount: float) -> bool:
        """Check if decision amount is within limits."""
        return amount <= self.max_decision_amount
    
    async def get_agent_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            "name": self.name,
            "is_initialized": self.is_initialized,
            "capabilities": self.capabilities,
            "tools_count": len(self.tools),
            "max_decision_amount": self.max_decision_amount,
            "response_timeout": self.response_timeout
        }
    
    async def cleanup(self) -> None:
        """Cleanup agent resources."""
        try:
            # Clear memory
            self.memory.clear()
            
            # Clear tools
            self.tools.clear()
            
            self.is_initialized = False
            logger.info(f"Agent {self.name} cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error cleaning up agent {self.name}: {e}")
    
    def __str__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name})"
    
    def __repr__(self) -> str:
        return self.__str__()
