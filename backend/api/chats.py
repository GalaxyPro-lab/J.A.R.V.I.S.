from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from backend.database.database import get_db
from backend.database.models import Chat, Project, Message

router = APIRouter(prefix="/api/chats", tags=["chats"])

class ChatCreate(BaseModel):
    project_id: str
    title: Optional[str] = "Nuova chat"
    model: Optional[str] = None
    system_instructions: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_instructions: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    voice_mode_enabled: Optional[bool] = None

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_chat(data: ChatCreate, db: AsyncSession = Depends(get_db)):
    # Verify project exists
    proj_query = select(Project).where(Project.id == data.project_id)
    res = await db.execute(proj_query)
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato.")

    chat = Chat(
        project_id=data.project_id,
        title=data.title.strip() if data.title and data.title.strip() else "Nuova chat",
        model=data.model or project.model,
        system_instructions=data.system_instructions,
        temperature=data.temperature,
        top_p=data.top_p
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)

    return {
        "id": chat.id,
        "project_id": chat.project_id,
        "title": chat.title,
        "model": chat.model,
        "created_at": chat.created_at.isoformat() if chat.created_at else None,
        "updated_at": chat.updated_at.isoformat() if chat.updated_at else None
    }

@router.get("/{chat_id}")
async def get_chat(chat_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Chat).options(selectinload(Chat.project)).where(Chat.id == chat_id)
    res = await db.execute(query)
    chat = res.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat non trovata.")

    # Load messages
    msg_query = select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())
    msg_res = await db.execute(msg_query)
    messages = msg_res.scalars().all()

    return {
        "id": chat.id,
        "project_id": chat.project_id,
        "project_name": chat.project.name if chat.project else "",
        "title": chat.title,
        "model": chat.model or (chat.project.model if chat.project else None),
        "system_instructions": chat.system_instructions,
        "temperature": chat.temperature,
        "top_p": chat.top_p,
        "voice_mode_enabled": chat.voice_mode_enabled,
        "created_at": chat.created_at.isoformat() if chat.created_at else None,
        "updated_at": chat.updated_at.isoformat() if chat.updated_at else None,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "tool_calls": m.tool_calls,
                "attachments": m.attachments or [],
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }

@router.patch("/{chat_id}")
async def update_chat(chat_id: str, data: ChatUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Chat).where(Chat.id == chat_id)
    res = await db.execute(query)
    chat = res.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat non trovata.")

    if data.title is not None:
        chat.title = data.title.strip() or "Nuova chat"
    if data.model is not None:
        chat.model = data.model
    if data.system_instructions is not None:
        chat.system_instructions = data.system_instructions
    if data.temperature is not None:
        chat.temperature = data.temperature
    if data.top_p is not None:
        chat.top_p = data.top_p
    if data.voice_mode_enabled is not None:
        chat.voice_mode_enabled = data.voice_mode_enabled

    await db.commit()
    await db.refresh(chat)

    return {
        "success": True,
        "id": chat.id,
        "title": chat.title,
        "model": chat.model,
        "updated_at": chat.updated_at.isoformat() if chat.updated_at else None
    }

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Chat).where(Chat.id == chat_id)
    res = await db.execute(query)
    chat = res.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat non trovata.")

    await db.delete(chat)
    await db.commit()

    return {
        "success": True,
        "message": f"Chat '{chat.title}' eliminata con successo."
    }
