from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database.database import get_db
from backend.database.models import IntegrationRecord
from backend.integrations.google.client import google_client
from backend.integrations.github.client import github_client
from backend.security.encryption import encrypt_data, decrypt_data

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

class GoogleConfigRequest(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: Optional[str] = None

class GitHubTokenRequest(BaseModel):
    token: str

@router.get("")
async def get_integrations_status(db: AsyncSession = Depends(get_db)):
    gh_auth = await github_client.check_auth()
    
    return {
        "google": {
            "is_connected": google_client.is_connected(),
            "client_id_configured": bool(google_client.client_id),
            "user_info": google_client.user_info,
            "services": [
                {"name": "Gmail", "available": True},
                {"name": "Google Calendar", "available": True},
                {"name": "Google Drive", "available": True},
                {"name": "Google Docs", "available": True},
                {"name": "Google Sheets", "available": True},
                {"name": "Google Tasks", "available": True},
                {"name": "YouTube", "available": True}
            ]
        },
        "github": {
            "is_connected": gh_auth.get("connected", False),
            "user_info": gh_auth if gh_auth.get("connected") else {},
            "capabilities": [
                {"name": "Read Repositories", "level": "READ"},
                {"name": "Read & Search Code", "level": "READ"},
                {"name": "Manage Issues", "level": "WRITE"},
                {"name": "Create Pull Requests", "level": "WRITE"},
                {"name": "File Operations", "level": "WRITE / DESTRUCTIVE"}
            ]
        }
    }

@router.get("/google/auth-url")
async def get_google_auth_url():
    try:
        url = google_client.get_authorization_url()
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/google/callback")
async def google_oauth_callback(code: str, db: AsyncSession = Depends(get_db)):
    result = await google_client.exchange_code(code)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=f"Errore scambio codice OAuth: {result.get('error')}")

    # Save to database
    rec = await db.get(IntegrationRecord, "google")
    if not rec:
        rec = IntegrationRecord(id="google", provider="google")
        db.add(rec)
    rec.is_connected = True
    rec.credentials_encrypted = encrypt_data(result.get("access_token", ""))
    rec.user_info = result.get("user", {})
    await db.commit()

    return {"success": True, "message": "Google collegato con successo!", "user": result.get("user")}

@router.post("/google/config")
async def set_google_config(data: GoogleConfigRequest, db: AsyncSession = Depends(get_db)):
    google_client.configure(
        client_id=data.client_id.strip(),
        client_secret=data.client_secret.strip(),
        redirect_uri=data.redirect_uri
    )
    return {"success": True, "message": "Credenziali Google OAuth aggiornate."}

@router.post("/google/disconnect")
async def disconnect_google(db: AsyncSession = Depends(get_db)):
    google_client.access_token = None
    google_client.refresh_token = None
    google_client.user_info = {}

    rec = await db.get(IntegrationRecord, "google")
    if rec:
        rec.is_connected = False
        rec.credentials_encrypted = None
        rec.user_info = {}
        await db.commit()

    return {"success": True, "message": "Google disconnesso con successo."}

@router.post("/github/token")
async def set_github_token(data: GitHubTokenRequest, db: AsyncSession = Depends(get_db)):
    token = data.token.strip()
    github_client.set_token(token)
    auth_res = await github_client.check_auth()

    if not auth_res.get("connected"):
        raise HTTPException(status_code=400, detail=auth_res.get("message", "Token GitHub non valido."))

    rec = await db.get(IntegrationRecord, "github")
    if not rec:
        rec = IntegrationRecord(id="github", provider="github")
        db.add(rec)
    rec.is_connected = True
    rec.credentials_encrypted = encrypt_data(token)
    rec.user_info = auth_res
    await db.commit()

    return {"success": True, "user": auth_res}

@router.post("/github/disconnect")
async def disconnect_github(db: AsyncSession = Depends(get_db)):
    github_client.set_token("")
    rec = await db.get(IntegrationRecord, "github")
    if rec:
        rec.is_connected = False
        rec.credentials_encrypted = None
        rec.user_info = {}
        await db.commit()

    return {"success": True, "message": "GitHub disconnesso con successo."}
