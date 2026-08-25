import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from backend.database.database import init_db, AsyncSessionLocal
from backend.database.models import Project, Chat, SettingRecord, IntegrationRecord
from backend.skills.loader import load_builtin_skills
from backend.ai.ollama_client import ollama_client
from backend.voice.service import voice_service
from backend.integrations.github.client import github_client
from backend.security.encryption import decrypt_data
from backend.api.projects import router as projects_router
from backend.api.chats import router as chats_router
from backend.api.messages import router as messages_router
from backend.api.memories import router as memories_router
from backend.api.skills import router as skills_router
from backend.api.mcp import router as mcp_router
from backend.api.integrations import router as integrations_router
from backend.api.voice import router as voice_router
from backend.api.settings import router as settings_router
from backend.api.search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database
    await init_db()
    load_builtin_skills()

    # Load persistent settings and integrations from database
    async with AsyncSessionLocal() as session:
        # 1. Load Ollama URL
        rec_url = await session.get(SettingRecord, "ollama_url")
        if rec_url and isinstance(rec_url.value, dict) and "url" in rec_url.value:
            ollama_client.set_base_url(rec_url.value["url"])

        # 2. Load Voice Config
        rec_voice = await session.get(SettingRecord, "voice_config")
        if rec_voice and isinstance(rec_voice.value, dict):
            voice_service.update_config(rec_voice.value)

        # 3. Load GitHub token
        rec_gh = await session.get(IntegrationRecord, "github")
        if rec_gh and rec_gh.is_connected and rec_gh.credentials_encrypted:
            tok = decrypt_data(rec_gh.credentials_encrypted)
            if tok:
                github_client.set_token(tok)

        # 4. Seed default Project and Chat if empty
        result = await session.execute(select(Project))
        first_proj = result.scalars().first()
        if not first_proj:
            default_proj = Project(
                name="JARVIS Core",
                description="Ambiente principale dell'assistente personale JARVIS.",
                model="llama3.2",
                system_instructions="Assisti l'utente in modo proattivo, elegante ed efficiente.",
                enabled_skills=["web_research", "coding", "memory_manager", "data_analysis"]
            )
            session.add(default_proj)
            await session.commit()
            await session.refresh(default_proj)

            first_chat = Chat(
                project_id=default_proj.id,
                title="Nuova chat",
                model="llama3.2"
            )
            session.add(first_chat)
            await session.commit()

    yield
    # Shutdown cleanups if needed

app = FastAPI(
    title="JARVIS Personal AI Assistant",
    description="State-of-the-art Personal AI Assistant platform powered by Ollama, MCP, Skills, Memory, and Voice.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(projects_router)
app.include_router(chats_router)
app.include_router(messages_router)
app.include_router(memories_router)
app.include_router(skills_router)
app.include_router(mcp_router)
app.include_router(integrations_router)
app.include_router(voice_router)
app.include_router(settings_router)
app.include_router(search_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "J.A.R.V.I.S. Personal AI Assistant Platform",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "jarvis-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
