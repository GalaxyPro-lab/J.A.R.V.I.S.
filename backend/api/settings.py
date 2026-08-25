from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database.database import get_db
from backend.database.models import SettingRecord
from backend.ai.ollama_client import ollama_client

router = APIRouter(tags=["settings"])

class OllamaConfigUpdate(BaseModel):
    url: str

class SettingsPayload(BaseModel):
    settings: Dict[str, Any]

@router.get("/api/ollama/status")
async def get_ollama_status():
    health = await ollama_client.check_health()
    models = await ollama_client.list_models()
    return {
        "status": health,
        "models": models
    }

@router.post("/api/ollama/config")
async def update_ollama_config(data: OllamaConfigUpdate, db: AsyncSession = Depends(get_db)):
    url = data.url.strip().rstrip("/")
    ollama_client.set_base_url(url)
    
    # Save setting to database
    rec = await db.get(SettingRecord, "ollama_url")
    if not rec:
        rec = SettingRecord(key="ollama_url", value={"url": url})
        db.add(rec)
    else:
        rec.value = {"url": url}
    await db.commit()

    health = await ollama_client.check_health()
    return {"success": True, "url": url, "health": health}

@router.get("/api/settings")
async def get_all_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SettingRecord))
    records = res.scalars().all()
    settings_map = {r.key: r.value for r in records}
    
    # Defaults if not set
    defaults = {
        "ollama_url": {"url": ollama_client.base_url},
        "default_model": {"model": "llama3.2"},
        "security_mode": {"mode": "balanced"},
        "appearance": {"theme": "dark", "sound_effects": True, "glassmorphism": True},
        "general": {"language": "it", "user_name": "Sir"}
    }
    for k, v in defaults.items():
        if k not in settings_map:
            settings_map[k] = v
            
    return settings_map

@router.post("/api/settings")
async def save_settings(payload: SettingsPayload, db: AsyncSession = Depends(get_db)):
    for k, v in payload.settings.items():
        rec = await db.get(SettingRecord, k)
        if not rec:
            rec = SettingRecord(key=k, value=v)
            db.add(rec)
        else:
            rec.value = v
    await db.commit()
    return {"success": True, "message": "Impostazioni salvate con successo."}
