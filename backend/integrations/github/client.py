import os
import base64
import httpx
from typing import Dict, Any, List, Optional
from backend.security.encryption import decrypt_data

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.base_url = "https://api.github.com"

    def set_token(self, token: str):
        self.token = token

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Jarvis-AI-Assistant/1.0"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def check_auth(self) -> Dict[str, Any]:
        if not self.token:
            return {"connected": False, "message": "Nessun token GitHub configurato."}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{self.base_url}/user", headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "connected": True,
                        "login": data.get("login"),
                        "name": data.get("name"),
                        "avatar_url": data.get("avatar_url"),
                        "public_repos": data.get("public_repos")
                    }
                return {"connected": False, "message": f"GitHub auth error: {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "message": str(e)}

    async def list_repositories(self, limit: int = 15) -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso. Configura il token in Impostazioni > GitHub."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/user/repos?sort=updated&per_page={limit}",
                    headers=self._get_headers()
                )
                if resp.status_code == 200:
                    repos = [
                        {
                            "name": r.get("name"),
                            "full_name": r.get("full_name"),
                            "private": r.get("private"),
                            "html_url": r.get("html_url"),
                            "description": r.get("description"),
                            "updated_at": r.get("updated_at")
                        }
                        for r in resp.json()
                    ]
                    return {"repositories": repos, "count": len(repos)}
                return {"error": f"GitHub API error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def get_file_contents(self, owner: str, repo: str, path: str, branch: str = "main") -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso. Configura il token in Impostazioni > GitHub."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/contents/{path}?ref={branch}",
                    headers=self._get_headers()
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content_b64 = data.get("content", "")
                    decoded = base64.b64decode(content_b64).decode("utf-8", errors="replace") if content_b64 else ""
                    return {
                        "name": data.get("name"),
                        "path": data.get("path"),
                        "sha": data.get("sha"),
                        "size": data.get("size"),
                        "content": decoded
                    }
                return {"error": f"File retrieval error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def search_code(self, query: str, limit: int = 10) -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/search/code?q={query}&per_page={limit}",
                    headers=self._get_headers()
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = [
                        {
                            "name": item.get("name"),
                            "path": item.get("path"),
                            "repository": item.get("repository", {}).get("full_name"),
                            "html_url": item.get("html_url")
                        }
                        for item in data.get("items", [])
                    ]
                    return {"total_count": data.get("total_count"), "items": items}
                return {"error": f"Search error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def list_issues(self, owner: str, repo: str, state: str = "open", limit: int = 10) -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/issues?state={state}&per_page={limit}",
                    headers=self._get_headers()
                )
                if resp.status_code == 200:
                    issues = [
                        {
                            "number": i.get("number"),
                            "title": i.get("title"),
                            "state": i.get("state"),
                            "user": i.get("user", {}).get("login"),
                            "html_url": i.get("html_url"),
                            "created_at": i.get("created_at")
                        }
                        for i in resp.json()
                    ]
                    return {"issues": issues, "count": len(issues)}
                return {"error": f"Issues error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def create_issue(self, owner: str, repo: str, title: str, body: str) -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/repos/{owner}/{repo}/issues",
                    headers=self._get_headers(),
                    json={"title": title, "body": body}
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    return {
                        "success": True,
                        "number": data.get("number"),
                        "title": data.get("title"),
                        "html_url": data.get("html_url")
                    }
                return {"error": f"Create issue error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

    async def create_pull_request(self, owner: str, repo: str, title: str, head: str, base: str, body: str) -> Dict[str, Any]:
        if not self.token:
            return {"error": "GitHub non è connesso."}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/repos/{owner}/{repo}/pulls",
                    headers=self._get_headers(),
                    json={"title": title, "head": head, "base": base, "body": body}
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    return {
                        "success": True,
                        "number": data.get("number"),
                        "title": data.get("title"),
                        "html_url": data.get("html_url")
                    }
                return {"error": f"Create PR error: {resp.status_code}", "detail": resp.text}
        except Exception as e:
            return {"error": str(e)}

github_client = GitHubClient()
