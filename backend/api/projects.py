from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from backend.database.database import get_db
from backend.database.models import Project, Chat

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    model: Optional[str] = None
    system_instructions: Optional[str] = ""
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    enabled_skills: Optional[List[str]] = []
    enabled_mcp_servers: Optional[List[str]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model: Optional[str] = None
    system_instructions: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    enabled_skills: Optional[List[str]] = None
    enabled_mcp_servers: Optional[List[str]] = None

@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    query = (
        select(Project)
        .options(selectinload(Project.chats))
        .order_by(Project.updated_at.desc())
    )
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "model": p.model,
            "system_instructions": p.system_instructions,
            "temperature": p.temperature,
            "top_p": p.top_p,
            "enabled_skills": p.enabled_skills or [],
            "enabled_mcp_servers": p.enabled_mcp_servers or [],
            "chats_count": len(p.chats),
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "chats": [
                {
                    "id": c.id,
                    "title": c.title,
                    "model": c.model,
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None
                }
                for c in p.chats
            ]
        }
        for p in projects
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Il nome del progetto non può essere vuoto.")
    
    project = Project(
        name=data.name.strip(),
        description=data.description or "",
        model=data.model,
        system_instructions=data.system_instructions or "",
        temperature=data.temperature if data.temperature is not None else 0.7,
        top_p=data.top_p if data.top_p is not None else 0.9,
        enabled_skills=data.enabled_skills or [],
        enabled_mcp_servers=data.enabled_mcp_servers or []
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Automatically create a first "Nuova chat" for convenience
    first_chat = Chat(
        project_id=project.id,
        title="Nuova chat",
        model=project.model
    )
    db.add(first_chat)
    await db.commit()
    await db.refresh(first_chat)

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "model": project.model,
        "first_chat_id": first_chat.id,
        "created_at": project.created_at.isoformat() if project.created_at else None
    }

@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Project).options(selectinload(Project.chats)).where(Project.id == project_id)
    res = await db.execute(query)
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato.")

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "model": project.model,
        "system_instructions": project.system_instructions,
        "temperature": project.temperature,
        "top_p": project.top_p,
        "enabled_skills": project.enabled_skills,
        "enabled_mcp_servers": project.enabled_mcp_servers,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "chats": [
            {
                "id": c.id,
                "title": c.title,
                "model": c.model,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in project.chats
        ]
    }

@router.put("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Project).where(Project.id == project_id)
    res = await db.execute(query)
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato.")

    if data.name is not None:
        project.name = data.name.strip()
    if data.description is not None:
        project.description = data.description
    if data.model is not None:
        project.model = data.model
    if data.system_instructions is not None:
        project.system_instructions = data.system_instructions
    if data.temperature is not None:
        project.temperature = data.temperature
    if data.top_p is not None:
        project.top_p = data.top_p
    if data.enabled_skills is not None:
        project.enabled_skills = data.enabled_skills
    if data.enabled_mcp_servers is not None:
        project.enabled_mcp_servers = data.enabled_mcp_servers

    await db.commit()
    await db.refresh(project)
    return {"success": True, "id": project.id, "name": project.name}

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Project).where(Project.id == project_id)
    res = await db.execute(query)
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato.")

    # Cascades automatically to chats, messages, memories, tool logs
    await db.delete(project)
    await db.commit()

    return {
        "success": True,
        "message": f"Progetto '{project.name}' e tutti i suoi dati associati sono stati eliminati definitivamente."
    }
