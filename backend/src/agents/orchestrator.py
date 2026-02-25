"""
AI Agent Orchestrator for FusionAI Enterprise Suite
Coordinates multiple specialized AI agents for different ERP modules
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum

from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain.tools import BaseTool
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.core.config import get_settings
from src.core.redis import get_redis, get_cache_manager
from src.agents.base import BaseAgent
from src.agents.specialized import (
    AccountingAgent,
    CRMAgent,
    InventoryAgent,
    HRAgent,
    ProjectAgent,
    SalesAgent,
    PurchaseAgent,
    HelpdeskAgent,
    MarketingAgent,
    ManufacturingAgent,
)

logger = logging.getLogger(__name__)

settings = get_settings()


class AgentStatus(Enum):
    """Agent status enumeration."""
    IDLE = "idle"
    PROCESSING = "processing"
    ERROR = "error"
    OFFLINE = "offline"


class AgentMessage:
    """Message format for inter-agent communication."""
    
    def __init__(
        self,
        message_type: str,
        source: str,
        target: str,
        payload: Dict[str, Any],
        priority: str = "medium",
        timestamp: Optional[datetime] = None
    ):
        self.message_type = message_type  # "request", "response", "event"
        self.source = source
        self.target = target
        self.payload = payload
        self.priority = priority
        self.timestamp = timestamp or datetime.utcnow()


class AgentOrchestrator:
    """Master orchestrator for all AI agents in the system."""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_status: Dict[str, AgentStatus] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.redis = None
        self.cache = None
        self.llm = None
        self.memory = None
        self.is_initialized = False
        
    async def initialize(self) -> None:
        """Initialize the orchestrator and all agents."""
        try:
            # Initialize Redis and cache
            self.redis = get_redis()
            self.cache = get_cache_manager()
            
            # Initialize LLM
            await self._initialize_llm()
            
            # Initialize memory
            self.memory = ConversationBufferWindowMemory(
                k=settings.AI_CONTEXT_WINDOW,
                return_messages=True
            )
            
            # Initialize specialized agents
            await self._initialize_agents()
            
            # Start message processing loop
            asyncio.create_task(self._process_messages())
            
            self.is_initialized = True
            logger.info("Agent Orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Agent Orchestrator: {e}")
            raise
    
    async def _initialize_llm(self) -> None:
        """Initialize the language model."""
        try:
            if settings.OPENAI_API_KEY:
                self.llm = ChatOpenAI(
                    model=settings.AI_MODEL,
                    temperature=settings.AI_TEMPERATURE,
                    max_tokens=settings.AI_MAX_TOKENS,
                    api_key=settings.OPENAI_API_KEY,
                )
            elif settings.ANTHROPIC_API_KEY:
                self.llm = ChatAnthropic(
                    model="claude-3-sonnet-20240229",
                    temperature=settings.AI_TEMPERATURE,
                    max_tokens=settings.AI_MAX_TOKENS,
                    api_key=settings.ANTHROPIC_API_KEY,
                )
            else:
                raise ValueError("No AI API key provided")
                
            logger.info("LLM initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            raise
    
    async def _initialize_agents(self) -> None:
        """Initialize all specialized agents."""
        agent_classes = [
            AccountingAgent,
            CRMAgent,
            InventoryAgent,
            HRAgent,
            ProjectAgent,
            SalesAgent,
            PurchaseAgent,
            HelpdeskAgent,
            MarketingAgent,
            ManufacturingAgent,
        ]
        
        for agent_class in agent_classes:
            try:
                agent = agent_class(
                    llm=self.llm,
                    memory=self.memory,
                    redis=self.redis,
                    cache=self.cache
                )
                await agent.initialize()
                
                agent_name = agent.name
                self.agents[agent_name] = agent
                self.agent_status[agent_name] = AgentStatus.IDLE
                
                logger.info(f"Agent {agent_name} initialized successfully")
                
            except Exception as e:
                logger.error(f"Failed to initialize agent {agent_class.__name__}: {e}")
                # Continue with other agents
    
    async def _process_messages(self) -> None:
        """Process messages from the queue."""
        while True:
            try:
                message = await self.message_queue.get()
                await self._handle_message(message)
                self.message_queue.task_done()
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await asyncio.sleep(1)
    
    async def _handle_message(self, message: AgentMessage) -> None:
        """Handle a message from the queue."""
        try:
            if message.target == "broadcast":
                # Broadcast to all agents
                tasks = []
                for agent_name, agent in self.agents.items():
                    if agent_name != message.source:
                        task = asyncio.create_task(
                            agent.handle_message(message)
                        )
                        tasks.append(task)
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
            
            elif message.target in self.agents:
                # Send to specific agent
                agent = self.agents[message.target]
                await agent.handle_message(message)
            
            else:
                logger.warning(f"Unknown target agent: {message.target}")
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def process_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a user request and route to appropriate agents."""
        try:
            if not self.is_initialized:
                raise RuntimeError("Orchestrator not initialized")
            
            # Analyze request to determine which agents to involve
            involved_agents = await self._analyze_request(request, context)
            
            if not involved_agents:
                # Use general purpose agent or return error
                return await self._handle_general_request(request, context)
            
            # Route to primary agent
            primary_agent = involved_agents[0]
            agent = self.agents[primary_agent]
            
            # Update agent status
            self.agent_status[primary_agent] = AgentStatus.PROCESSING
            
            try:
                # Process request
                result = await agent.process_request(request, context, user_id)
                
                # Update status
                self.agent_status[primary_agent] = AgentStatus.IDLE
                
                # Store in cache
                cache_key = f"request:{hash(request)}"
                await self.cache.set(cache_key, result, ttl=3600)
                
                return result
                
            except Exception as e:
                self.agent_status[primary_agent] = AgentStatus.ERROR
                logger.error(f"Error processing request with {primary_agent}: {e}")
                raise
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return {
                "error": str(e),
                "status": "error",
                "agent": None
            }
    
    async def _analyze_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Analyze request to determine which agents should handle it."""
        try:
            # Simple keyword-based routing for now
            # In production, this would use more sophisticated NLP
            request_lower = request.lower()
            
            agent_keywords = {
                "accounting": ["invoice", "payment", "expense", "budget", "financial", "accounting"],
                "crm": ["customer", "lead", "contact", "opportunity", "sales", "crm"],
                "inventory": ["inventory", "stock", "warehouse", "product", "supply"],
                "hr": ["employee", "hr", "human resources", "payroll", "attendance"],
                "project": ["project", "task", "milestone", "deadline", "team"],
                "sales": ["sale", "quotation", "order", "revenue", "customer"],
                "purchase": ["purchase", "vendor", "supplier", "procurement"],
                "helpdesk": ["support", "ticket", "issue", "problem", "help"],
                "marketing": ["marketing", "campaign", "email", "social", "promotion"],
                "manufacturing": ["production", "manufacturing", "assembly", "quality"]
            }
            
            involved_agents = []
            for agent_name, keywords in agent_keywords.items():
                if any(keyword in request_lower for keyword in keywords):
                    involved_agents.append(agent_name)
            
            return involved_agents
            
        except Exception as e:
            logger.error(f"Error analyzing request: {e}")
            return []
    
    async def _handle_general_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle general requests that don't fit specific modules."""
        try:
            # Use the LLM directly for general requests
            messages = [HumanMessage(content=request)]
            
            if context:
                context_msg = f"Context: {context}"
                messages.insert(0, HumanMessage(content=context_msg))
            
            response = await self.llm.ainvoke(messages)
            
            return {
                "response": response.content,
                "agent": "general",
                "status": "success",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error handling general request: {e}")
            return {
                "error": str(e),
                "agent": "general",
                "status": "error"
            }
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send a message to the orchestrator."""
        await self.message_queue.put(message)
    
    async def get_agent_status(self, agent_name: Optional[str] = None) -> Dict[str, Any]:
        """Get status of agents."""
        if agent_name:
            return {
                agent_name: {
                    "status": self.agent_status.get(agent_name, AgentStatus.OFFLINE).value,
                    "is_online": agent_name in self.agents
                }
            }
        else:
            return {
                name: {
                    "status": status.value,
                    "is_online": True
                }
                for name, status in self.agent_status.items()
            }
    
    async def get_agent_capabilities(self, agent_name: Optional[str] = None) -> Dict[str, Any]:
        """Get capabilities of agents."""
        if agent_name and agent_name in self.agents:
            return {
                agent_name: self.agents[agent_name].get_capabilities()
            }
        else:
            return {
                name: agent.get_capabilities()
                for name, agent in self.agents.items()
            }
    
    async def cleanup(self) -> None:
        """Cleanup orchestrator and all agents."""
        try:
            # Cleanup all agents
            for agent in self.agents.values():
                await agent.cleanup()
            
            # Clear queues
            while not self.message_queue.empty():
                self.message_queue.get_nowait()
            
            self.agents.clear()
            self.agent_status.clear()
            self.is_initialized = False
            
            logger.info("Agent Orchestrator cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


# Global orchestrator instance
orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator() -> AgentOrchestrator:
    """Get the global orchestrator instance."""
    if orchestrator is None:
        raise RuntimeError("Orchestrator not initialized")
    return orchestrator
