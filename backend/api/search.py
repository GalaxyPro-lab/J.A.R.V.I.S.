from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from backend.database.database import get_db
from backend.database.models import Project, Chat, Message

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
async def global_search(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    term = f"%{q.strip()}%"

    # Search Projects
    proj_query = select(Project).where(
        or_(
            Project.name.ilike(term),
            Project.description.ilike(term)
        )
    ).limit(10)
    p_res = await db.execute(proj_query)
    projects = [
        {"id": p.id, "name": p.name, "description": p.description, "type": "project"}
        for p in p_res.scalars().all()
    ]

    # Search Chats
    chat_query = select(Chat).where(
        Chat.title.ilike(term)
    ).limit(15)
    c_res = await db.execute(chat_query)
    chats = [
        {"id": c.id, "project_id": c.project_id, "title": c.title, "type": "chat"}
        for c in c_res.scalars().all()
    ]

    # Search Messages
    msg_query = select(Message).where(
        Message.content.ilike(term)
    ).order_by(Message.created_at.desc()).limit(20)
    m_res = await db.execute(msg_query)
    messages = [
        {
            "id": m.id,
            "chat_id": m.chat_id,
            "role": m.role,
            "content_snippet": m.content[:150],
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "type": "message"
        }
        for m in m_res.scalars().all()
    ]

    return {
        "query": q,
        "total_results": len(projects) + len(chats) + len(messages),
        "results": {
            "projects": projects,
            "chats": chats,
            "messages": messages
        }
    }
