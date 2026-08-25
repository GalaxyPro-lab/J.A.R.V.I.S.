import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional

DEFAULT_OLLAMA_URL = "http://localhost:11434"

class OllamaClient:
    def __init__(self, base_url: str = DEFAULT_OLLAMA_URL, timeout: float = 60.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def set_base_url(self, url: str):
        self.base_url = url.rstrip("/")

    async def check_health(self) -> Dict[str, Any]:
        """
        Check if Ollama server is reachable and fetch installed models.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "online": True,
                        "url": self.base_url,
                        "models_count": len(models),
                        "models": models,
                        "message": "Ollama is online and reachable."
                    }
                else:
                    return {
                        "online": False,
                        "url": self.base_url,
                        "models_count": 0,
                        "models": [],
                        "message": f"Ollama returned status {resp.status_code}"
                    }
        except Exception as e:
            return {
                "online": False,
                "url": self.base_url,
                "models_count": 0,
                "models": [],
                "message": f"Ollama non raggiungibile: {str(e)}. Controlla che Ollama sia avviato (ollama serve)."
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        Retrieve list of available models from Ollama.
        """
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = []
                    for item in data.get("models", []):
                        models.append({
                            "name": item.get("name"),
                            "size": item.get("size", 0),
                            "modified_at": item.get("modified_at", ""),
                            "digest": item.get("digest", ""),
                            "details": item.get("details", {})
                        })
                    return models
                return []
        except Exception:
            return []

    async def chat_stream(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        options: Optional[Dict[str, Any]] = None,
        keep_alive: Optional[str] = "15m"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat completions from Ollama /api/chat.
        Yields chunks with structure:
        {
           "type": "content" | "tool_calls" | "done" | "error",
           "delta": str | list,
           "done": bool,
           "total_duration": ...
        }
        """
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": True,
            "keep_alive": keep_alive or "15m"
        }
        if tools and len(tools) > 0:
            payload["tools"] = tools
        if options:
            payload["options"] = options

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        yield {
                            "type": "error",
                            "delta": f"Ollama Error ({response.status_code}): {error_body.decode(errors='ignore')}",
                            "done": True
                        }
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                        except Exception:
                            continue

                        msg = chunk.get("message", {})
                        content_piece = msg.get("content", "")
                        tool_calls_piece = msg.get("tool_calls", None)
                        is_done = chunk.get("done", False)

                        if content_piece:
                            yield {
                                "type": "content",
                                "delta": content_piece,
                                "done": is_done
                            }

                        if tool_calls_piece:
                            yield {
                                "type": "tool_calls",
                                "delta": tool_calls_piece,
                                "done": is_done
                            }

                        if is_done:
                            yield {
                                "type": "done",
                                "delta": "",
                                "done": True,
                                "total_duration": chunk.get("total_duration"),
                                "eval_count": chunk.get("eval_count"),
                                "eval_duration": chunk.get("eval_duration")
                            }
        except httpx.ConnectError:
            yield {
                "type": "error",
                "delta": "Impossibile connettersi ad Ollama. Assicurati che il servizio sia in esecuzione su " + self.base_url,
                "done": True
            }
        except Exception as e:
            yield {
                "type": "error",
                "delta": f"Errore durante la comunicazione con Ollama: {str(e)}",
                "done": True
            }

ollama_client = OllamaClient()
