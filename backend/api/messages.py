import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from backend.database.database import get_db, AsyncSessionLocal
from backend.database.models import Message, Chat, ToolCallLog
from backend.ai.orchestrator import ai_orchestrator
from backend.skills.registry import skill_registry
from backend.mcp.client import mcp_manager

router = APIRouter(tags=["messages"])

class SendMessageRequest(BaseModel):
    content: str
    attachments: Optional[List[Dict[str, Any]]] = []
    security_mode: Optional[str] = "balanced"  # balanced, strict, permissive
    model: Optional[str] = None

class ToolApprovalRequest(BaseModel):
    approved: bool

@router.get("/api/chats/{chat_id}/messages")
async def list_chat_messages(chat_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    res = await db.execute(query)
    messages = res.scalars().all()

    return [
        {
            "id": m.id,
            "chat_id": m.chat_id,
            "role": m.role,
            "content": m.content,
            "reasoning_content": m.reasoning_content,
            "tool_calls": m.tool_calls,
            "tool_call_id": m.tool_call_id,
            "attachments": m.attachments or [],
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]

@router.post("/api/chats/{chat_id}/messages")
async def send_message_stream(
    chat_id: str,
    req: SendMessageRequest
):
    """
    Streaming SSE endpoint for chat completions and multi-turn tool execution.
    """
    if not req.content.strip() and not req.attachments:
        raise HTTPException(status_code=400, detail="Il messaggio non può essere vuoto.")

    async def event_generator():
        async with AsyncSessionLocal() as session:
            # Verify chat exists
            chat_query = select(Chat).where(Chat.id == chat_id)
            res = await session.execute(chat_query)
            chat = res.scalars().first()
            if not chat:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Chat non trovata.'})}\n\n"
                return

            try:
                async for event in ai_orchestrator.process_chat(
                    db=session,
                    chat_id=chat_id,
                    user_message=req.content,
                    attachments=req.attachments,
                    security_mode=req.security_mode or "balanced",
                    model_override=req.model
                ):
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/api/tool-approvals/{log_id}")
async def resolve_tool_approval(
    log_id: str,
    req: ToolApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject a tool call awaiting user confirmation.
    """
    query = select(ToolCallLog).where(ToolCallLog.id == log_id)
    res = await db.execute(query)
    tool_log = res.scalars().first()
    if not tool_log:
        raise HTTPException(status_code=404, detail="Tool log non trovato.")

    if not req.approved:
        tool_log.status = "rejected"
        tool_log.result = {"status": "rejected", "message": "Operazione annullata dall'utente."}
        await db.commit()
        return {"status": "rejected", "tool_log_id": log_id}

    # Execute tool
    tool_log.status = "approved"
    try:
        t_name = tool_log.tool_name
        t_args = tool_log.arguments or {}
        if t_name.startswith("mcp_"):
            res_data = await mcp_manager.execute_tool(t_name, t_args)
        else:
            res_data = await skill_registry.execute_tool(t_name, t_args)
        
        tool_log.result = res_data
        tool_log.status = "executed"
    except Exception as e:
        tool_log.result = {"error": str(e)}
        tool_log.status = "failed"

    await db.commit()
    return {"status": tool_log.status, "result": tool_log.result}
