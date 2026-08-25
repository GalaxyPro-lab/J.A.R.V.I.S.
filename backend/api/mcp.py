from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database.database import get_db
from backend.database.models import MCPServerRecord
from backend.mcp.client import mcp_manager

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

class MCPServerCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    transport: str = "stdio"  # stdio, sse, http
    command: Optional[str] = None
    args: Optional[List[str]] = []
    env: Optional[Dict[str, str]] = {}
    url: Optional[str] = None
    enabled: Optional[bool] = True

@router.get("/servers")
async def list_mcp_servers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MCPServerRecord).order_by(MCPServerRecord.created_at.desc()))
    records = res.scalars().all()

    servers = []
    for r in records:
        instance = mcp_manager.get_server(r.id)
        if not instance:
            instance = mcp_manager.register_server(
                server_id=r.id,
                name=r.name,
                transport=r.transport,
                command=r.command,
                args=r.args,
                env=r.env,
                url=r.url
            )
        servers.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "transport": r.transport,
            "command": r.command,
            "args": r.args,
            "env": r.env,
            "url": r.url,
            "enabled": r.enabled,
            "is_connected": instance.is_connected,
            "tools_count": len(instance.tools),
            "tools": instance.tools,
            "last_error": instance.last_error,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return servers

@router.post("/servers", status_code=status.HTTP_201_CREATED)
async def create_mcp_server(data: MCPServerCreate, db: AsyncSession = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Il nome del server MCP è obbligatorio.")

    rec = MCPServerRecord(
        name=data.name.strip(),
        description=data.description or "",
        transport=data.transport,
        command=data.command,
        args=data.args or [],
        env=data.env or {},
        url=data.url,
        enabled=data.enabled if data.enabled is not None else True
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    # Register in runtime manager and discover
    instance = mcp_manager.register_server(
        server_id=rec.id,
        name=rec.name,
        transport=rec.transport,
        command=rec.command,
        args=rec.args,
        env=rec.env,
        url=rec.url
    )
    await instance.connect_and_discover()

    return {
        "id": rec.id,
        "name": rec.name,
        "transport": rec.transport,
        "is_connected": instance.is_connected,
        "tools_count": len(instance.tools),
        "last_error": instance.last_error
    }

@router.post("/servers/{server_id}/test")
async def test_mcp_server(server_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MCPServerRecord).where(MCPServerRecord.id == server_id))
    rec = res.scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Server MCP non trovato.")

    instance = mcp_manager.get_server(rec.id)
    if not instance:
        instance = mcp_manager.register_server(
            server_id=rec.id,
            name=rec.name,
            transport=rec.transport,
            command=rec.command,
            args=rec.args,
            env=rec.env,
            url=rec.url
        )

    result = await instance.connect_and_discover()
    return result

@router.delete("/servers/{server_id}")
async def delete_mcp_server(server_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MCPServerRecord).where(MCPServerRecord.id == server_id))
    rec = res.scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Server MCP non trovato.")

    mcp_manager.remove_server(server_id)
    await db.delete(rec)
    await db.commit()

    return {"success": True, "message": f"Server MCP '{rec.name}' rimosso."}
