from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.memory.service import memory_service

router = APIRouter(prefix="/api/memories", tags=["memories"])

class MemoryCreate(BaseModel):
    level: str  # global, project, chat
    key: str
    value: str
    category: Optional[str] = "general"
    project_id: Optional[str] = None
    chat_id: Optional[str] = None

@router.get("")
async def list_memories(
    level: Optional[str] = None,
    project_id: Optional[str] = None,
    chat_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    mems = await memory_service.list_memories(
        db=db,
        level=level,
        project_id=project_id,
        chat_id=chat_id,
        category=category,
        search=search
    )
    return [
        {
            "id": m.id,
            "level": m.level,
            "category": m.category,
            "key": m.key,
            "value": m.value,
            "project_id": m.project_id,
            "chat_id": m.chat_id,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None
        }
        for m in mems
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_memory(data: MemoryCreate, db: AsyncSession = Depends(get_db)):
    if not data.key.strip() or not data.value.strip():
        raise HTTPException(status_code=400, detail="Chiave e valore della memoria non possono essere vuoti.")

    mem = await memory_service.add_memory(
        db=db,
        level=data.level,
        key=data.key.strip(),
        value=data.value.strip(),
        category=data.category or "general",
        project_id=data.project_id,
        chat_id=data.chat_id
    )
    return {
        "id": mem.id,
        "level": mem.level,
        "category": mem.category,
        "key": mem.key,
        "value": mem.value,
        "created_at": mem.created_at.isoformat() if mem.created_at else None
    }

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await memory_service.delete_memory(db, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memoria non trovata.")
    return {"success": True, "message": "Memoria eliminata con successo."}
