from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from backend.skills.registry import skill_registry

router = APIRouter(prefix="/api/skills", tags=["skills"])

class SkillUpdate(BaseModel):
    enabled: Optional[bool] = None

@router.get("")
async def list_skills():
    return skill_registry.list_skills()

@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    skill = skill_registry.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill non trovata.")
    return skill.to_dict()

@router.patch("/{skill_id}")
async def update_skill(skill_id: str, data: SkillUpdate):
    skill = skill_registry.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill non trovata.")

    if data.enabled is not None:
        skill.enabled_by_default = data.enabled

    return {"success": True, "skill": skill.to_dict()}
