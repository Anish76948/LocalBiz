"""
LocalBiz AI Backend Microservice (FastAPI)
Completely independent service running on port 8000.
Provides agentic AI tool calling, RAG knowledge retrieval, and platform assistance.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from agent import agent
from knowledge_base import KNOWLEDGE_DOCS
import tools

app = FastAPI(
    title="LocalBiz AI Teaching Assistant & Autonomous Agent",
    description="Dedicated microservice supporting RAG platform guides, autonomous order placement, status tracking, and vendor fulfillment.",
    version="1.0.0"
)

# CORS enabled for future frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., example="Order Aaji mango pickle for Anish at Bandra")
    user_role: Optional[str] = Field("customer", example="customer or vendor")
    session_id: Optional[str] = Field("default-session", example="session-123")


class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    action_taken: str
    data: Optional[Any] = None


class FulfillRequest(BaseModel):
    order_number: str = Field(..., example="LB-7453")
    status: str = Field("SHIPPED", example="SHIPPED or DELIVERED")


@app.get("/api/ai/health")
def health_check():
    return {
        "status": "healthy",
        "service": "LocalBiz AI Agent Microservice",
        "version": "1.0.0",
        "port": 8000
    }


@app.post("/api/ai/chat", response_model=ChatResponse)
def chat_with_agent(req: ChatRequest):
    """
    Main conversational endpoint:
    Processes user/vendor query, executes autonomous tools if requested, and returns RAG-assisted answer.
    """
    try:
        res = agent.process_message(req.message, req.user_role, req.session_id)
        return ChatResponse(
            success=True,
            reply=res["reply"],
            action_taken=res["action_taken"],
            data=res["data"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/knowledge")
def get_knowledge_topics():
    """Returns catalog of indexed platform documentation available to the RAG system."""
    return {
        "count": len(KNOWLEDGE_DOCS),
        "topics": [{"id": d["id"], "category": d["category"], "title": d["title"], "tags": d["tags"]} for d in KNOWLEDGE_DOCS]
    }


@app.post("/api/ai/tools/fulfill")
def direct_fulfill(req: FulfillRequest):
    """Direct agent tool to mark order as SHIPPED or DELIVERED in SQLite."""
    try:
        return tools.tool_update_order_status(req.order_number, req.status)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/ai/tools/analytics")
def direct_analytics():
    """Direct agent tool to query real-time sales and orders from SQLite."""
    try:
        return tools.tool_get_vendor_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
