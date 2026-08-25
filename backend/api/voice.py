from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.database.models import SettingRecord
from backend.voice.service import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice"])

class VoiceConfigUpdate(BaseModel):
    stt_provider: str = None
    tts_provider: str = None
    voice_name: str = None
    pitch: float = None
    rate: float = None
    vad_sensitivity: float = None
    silence_threshold_ms: int = None

@router.get("/config")
async def get_voice_config():
    return voice_service.get_config()

@router.post("/config")
async def update_voice_config(data: VoiceConfigUpdate, db: AsyncSession = Depends(get_db)):
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    voice_service.update_config(update_dict)
    
    # Persist in database
    cfg = voice_service.get_config()
    rec = await db.get(SettingRecord, "voice_config")
    if not rec:
        rec = SettingRecord(key="voice_config", value=cfg)
        db.add(rec)
    else:
        rec.value = cfg
    await db.commit()

    return {"success": True, "config": cfg}
