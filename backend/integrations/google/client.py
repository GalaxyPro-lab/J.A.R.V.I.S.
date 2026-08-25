import os
import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.security.encryption import encrypt_data, decrypt_data

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/youtube.readonly"
]

class GoogleClient:
    def __init__(self):
        self.client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        self.client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        self.redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/integrations/google/callback")
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_info: Dict[str, Any] = {}

    def configure(self, client_id: str, client_secret: str, redirect_uri: Optional[str] = None):
        self.client_id = client_id
        self.client_secret = client_secret
        if redirect_uri:
            self.redirect_uri = redirect_uri

    def get_authorization_url(self, state: str = "jarvis_oauth_state") -> str:
        if not self.client_id:
            raise ValueError("Google Client ID is not configured. Set it in Settings > Integrations > Google.")
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        query_str = "&".join(f"{k}={httpx.URL(v).raw_path.decode() if isinstance(v, str) else v}" for k, v in params.items())
        return f"{GOOGLE_AUTH_URL}?{query_str}"

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                user = await self.fetch_user_profile()
                self.user_info = user
                return {
                    "success": True,
                    "access_token": self.access_token,
                    "refresh_token": self.refresh_token,
                    "user": user
                }
            return {"success": False, "error": resp.text}

    async def fetch_user_profile(self) -> Dict[str, Any]:
        if not self.access_token:
            return {}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {self.access_token}"}
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass
        return {}

    def is_connected(self) -> bool:
        return bool(self.access_token)

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    # Gmail
    async def list_emails(self, query: str = "", max_results: int = 5) -> Dict[str, Any]:
        if not self.access_token:
            return {"error": "Google non è connesso. Configura l'integrazione Google."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={max_results}&q={query}",
                    headers=self._auth_headers()
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"messages": data.get("messages", []), "result_size_estimate": data.get("resultSizeEstimate", 0)}
                return {"error": f"Gmail error {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    # Calendar
    async def list_calendar_events(self, time_min: str = "", max_results: int = 10) -> Dict[str, Any]:
        if not self.access_token:
            return {"error": "Google non è connesso."}
        try:
            if not time_min:
                time_min = datetime.now(timezone.utc).isoformat()
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin={time_min}&maxResults={max_results}&singleEvents=true&orderBy=startTime",
                    headers=self._auth_headers()
                )
                if resp.status_code == 200:
                    events = []
                    for item in resp.json().get("items", []):
                        events.append({
                            "id": item.get("id"),
                            "summary": item.get("summary", "(No title)"),
                            "start": item.get("start"),
                            "end": item.get("end"),
                            "htmlLink": item.get("htmlLink")
                        })
                    return {"events": events, "count": len(events)}
                return {"error": f"Calendar error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def create_calendar_event(self, summary: str, start_time: str, end_time: str, description: str = "") -> Dict[str, Any]:
        if not self.access_token:
            return {"error": "Google non è connesso."}
        try:
            payload = {
                "summary": summary,
                "description": description,
                "start": {"dateTime": start_time},
                "end": {"dateTime": end_time}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                    headers=self._auth_headers(),
                    json=payload
                )
                if resp.status_code in (200, 201):
                    return {"success": True, "event": resp.json()}
                return {"error": f"Create event error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    # Drive
    async def search_drive(self, query: str = "", page_size: int = 10) -> Dict[str, Any]:
        if not self.access_token:
            return {"error": "Google non è connesso."}
        try:
            q_param = f"name contains '{query}' and trashed = false" if query else "trashed = false"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.googleapis.com/drive/v3/files?pageSize={page_size}&q={q_param}&fields=files(id,name,mimeType,webViewLink,modifiedTime)",
                    headers=self._auth_headers()
                )
                if resp.status_code == 200:
                    return {"files": resp.json().get("files", [])}
                return {"error": f"Drive error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

google_client = GoogleClient()
