"""
AI endpoints for FusionAI Enterprise Suite
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from src.agents.orchestrator import get_orchestrator

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    agent: str
    status: str
    timestamp: str
    actions_executed: Optional[int] = None


class AgentStatusResponse(BaseModel):
    name: str
    status: str
    is_online: bool


class AgentCapabilitiesResponse(BaseModel):
    name: str
    capabilities: List[str]


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with the AI system."""
    try:
        orchestrator = get_orchestrator()
        
        result = await orchestrator.process_request(
            request=request.message,
            context=request.context,
            user_id=request.user_id
        )
        
        return ChatResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[AgentStatusResponse])
async def get_agents():
    """Get all available AI agents."""
    try:
        orchestrator = get_orchestrator()
        status = await orchestrator.get_agent_status()
        
        agents = []
        for name, info in status.items():
            agents.append(AgentStatusResponse(
                name=name,
                status=info["status"],
                is_online=info["is_online"]
            ))
        
        return agents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/status", response_model=Dict[str, Any])
async def get_agent_status(agent: Optional[str] = None):
    """Get status of specific agent or all agents."""
    try:
        orchestrator = get_orchestrator()
        status = await orchestrator.get_agent_status(agent)
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/capabilities", response_model=Dict[str, Any])
async def get_agent_capabilities(agent: Optional[str] = None):
    """Get capabilities of specific agent or all agents."""
    try:
        orchestrator = get_orchestrator()
        capabilities = await orchestrator.get_agent_capabilities(agent)
        return capabilities
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




