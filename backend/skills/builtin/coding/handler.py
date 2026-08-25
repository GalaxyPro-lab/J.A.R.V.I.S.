import os
import glob
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional

# Root directory of the JARVIS codebase to protect
JARVIS_APP_ROOT = str(Path(__file__).resolve().parent.parent.parent.parent.parent)

def _is_jarvis_source_path(resolved_path: str) -> bool:
    """
    Check if a path points inside the JARVIS application codebase.
    """
    try:
        common = os.path.commonpath([os.path.abspath(resolved_path), os.path.abspath(JARVIS_APP_ROOT)])
        return os.path.abspath(common) == os.path.abspath(JARVIS_APP_ROOT)
    except Exception:
        return False

def _resolve_safe_path(path_str: str) -> str:
    path = Path(path_str)
    if not path.is_absolute():
        # Default relative paths to the user's home/desktop directory rather than JARVIS internal dir
        user_home = Path.home()
        path = user_home / path
    resolved = str(path.resolve())
    return resolved

async def read_file(path: str, max_lines: int = 500) -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato: I file sorgente di JARVIS sono protetti e non possono essere letti, modificati o eliminati per motivi di sicurezza."}

        if not os.path.exists(resolved):
            return {"error": f"File non trovato: {path}"}
        if os.path.isdir(resolved):
            return {"error": f"Il percorso specificato è una cartella, non un file: {path}"}
        
        with open(resolved, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        
        content = "".join(lines[:max_lines])
        truncated = len(lines) > max_lines
        return {
            "path": path,
            "resolved_path": resolved,
            "total_lines": len(lines),
            "lines_read": min(len(lines), max_lines),
            "truncated": truncated,
            "content": content
        }
    except Exception as e:
        return {"error": str(e)}

async def write_file(path: str, content: str) -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato: Non è permesso creare o modificare file all'interno del codice sorgente di JARVIS."}

        os.makedirs(os.path.dirname(resolved), exist_ok=True)
        with open(resolved, "w", encoding="utf-8") as f:
            f.write(content)
        return {"success": True, "path": path, "resolved_path": resolved, "bytes_written": len(content.encode("utf-8"))}
    except Exception as e:
        return {"error": str(e)}

async def edit_file(path: str, target: str, replacement: str) -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato: Non è permesso modificare file all'interno del codice sorgente di JARVIS."}

        if not os.path.exists(resolved):
            return {"error": f"File non trovato: {path}"}
        
        with open(resolved, "r", encoding="utf-8") as f:
            content = f.read()
        
        if target not in content:
            return {"error": f"Stringa da sostituire non trovata nel file {path}"}
        
        new_content = content.replace(target, replacement, 1)
        with open(resolved, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        return {"success": True, "path": path, "resolved_path": resolved, "modified": True}
    except Exception as e:
        return {"error": str(e)}

async def delete_file(path: str) -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato: Non è permesso eliminare file all'interno del codice sorgente di JARVIS."}

        if not os.path.exists(resolved):
            return {"error": f"File non trovato: {path}"}
        
        if os.path.isdir(resolved):
            os.rmdir(resolved)
        else:
            os.remove(resolved)
        return {"success": True, "deleted": path, "resolved_path": resolved}
    except Exception as e:
        return {"error": str(e)}

async def list_directory(path: str = ".") -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato: Non è permesso esplorare la directory dei file sorgente di JARVIS."}

        if not os.path.exists(resolved):
            return {"error": f"Directory non trovata: {path}"}
        
        entries = []
        for entry in os.scandir(resolved):
            entries.append({
                "name": entry.name,
                "is_dir": entry.is_dir(),
                "size": entry.stat().st_size if not entry.is_dir() else 0
            })
        return {"path": path, "resolved_path": resolved, "entries": sorted(entries, key=lambda x: (not x["is_dir"], x["name"]))}
    except Exception as e:
        return {"error": str(e)}

async def search_files(pattern: str, path: str = ".") -> Dict[str, Any]:
    try:
        resolved = _resolve_safe_path(path)
        if _is_jarvis_source_path(resolved):
            return {"error": "Accesso negato alla cartella sorgente di JARVIS."}

        search_pattern = os.path.join(resolved, "**", pattern)
        matches = glob.glob(search_pattern, recursive=True)
        # Filter out any match that might be inside JARVIS directory
        safe_matches = [m for m in matches if not _is_jarvis_source_path(m)][:50]
        return {"pattern": pattern, "count": len(safe_matches), "matches": safe_matches}
    except Exception as e:
        return {"error": str(e)}

async def execute_terminal_command(command: str) -> Dict[str, Any]:
    try:
        # Check command for attempts to delete or damage JARVIS directory
        lower_cmd = command.lower()
        if "jarvis" in lower_cmd and any(w in lower_cmd for w in ["rm", "del", "rmdir", "remove", "kill"]):
            return {"command": command, "error": "Comando bloccato: Non è permesso eseguire operazioni distruttive sui file di JARVIS."}

        user_home = str(Path.home())
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=user_home
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
        return {
            "command": command,
            "returncode": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace")
        }
    except asyncio.TimeoutError:
        return {"command": command, "error": "Comando terminato per timeout (30s)."}
    except Exception as e:
        return {"command": command, "error": str(e)}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Reads text content from any file on the computer (excluding JARVIS source files).",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute or relative path to the file on the computer"},
                    "max_lines": {"type": "integer", "description": "Max lines to read (default 500)"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Creates or writes a file on the computer with specified content (excluding JARVIS source files).",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path of the file to write"},
                    "content": {"type": "string", "description": "The exact content to write"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Replaces a specific block of text inside an existing file on the computer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path of the file to edit"},
                    "target": {"type": "string", "description": "The exact string to find and replace"},
                    "replacement": {"type": "string", "description": "The replacement string"}
                },
                "required": ["path", "target", "replacement"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Deletes a file on the computer (excluding JARVIS source files). Requires confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path of the file to delete"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "Lists contents of any directory on the computer (excluding JARVIS internal directory).",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory path to list (e.g. C:/Users/X-PC/Desktop)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Finds files matching a glob pattern anywhere on the computer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Glob pattern (e.g. *.pdf, *.py, *.docx)"},
                    "path": {"type": "string", "description": "Search directory root"}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_terminal_command",
            "description": "Runs a shell/PowerShell command on the system. Note: Destructive commands require approval.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command line to execute"}
                },
                "required": ["command"]
            }
        }
    }
]

HANDLERS = {
    "read_file": read_file,
    "write_file": write_file,
    "edit_file": edit_file,
    "delete_file": delete_file,
    "list_directory": list_directory,
    "search_files": search_files,
    "execute_terminal_command": execute_terminal_command
}
