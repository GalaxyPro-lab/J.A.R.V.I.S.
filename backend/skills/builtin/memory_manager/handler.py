from typing import Dict, Any, Optional
from backend.database.database import AsyncSessionLocal
from backend.memory.service import memory_service

async def store_memory(key: str, value: str, level: str = "project", category: str = "general", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    project_id = context.get("project_id") if context else None
    chat_id = context.get("chat_id") if context else None
    
    if level == "global":
        project_id = None
        chat_id = None
    elif level == "project" and not project_id:
        level = "global"
    elif level == "chat" and not chat_id:
        level = "project" if project_id else "global"

    async with AsyncSessionLocal() as session:
        mem = await memory_service.add_memory(
            db=session,
            level=level,
            key=key,
            value=value,
            category=category,
            project_id=project_id,
            chat_id=chat_id
        )
        return {
            "success": True,
            "id": mem.id,
            "level": mem.level,
            "key": mem.key,
            "value": mem.value,
            "message": f"Saved fact to {level} memory."
        }

async def recall_memory(query: str = "", level: str = "all", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    project_id = context.get("project_id") if context else None
    chat_id = context.get("chat_id") if context else None

    async with AsyncSessionLocal() as session:
        lvl_filter = None if level == "all" else level
        mems = await memory_service.list_memories(
            db=session,
            level=lvl_filter,
            project_id=project_id if level in ("all", "project") else None,
            chat_id=chat_id if level in ("all", "chat") else None,
            search=query if query else None
        )
        return {
            "query": query,
            "count": len(mems),
            "memories": [{"level": m.level, "category": m.category, "key": m.key, "value": m.value} for m in mems]
        }

async def delete_memory_by_key(key: str, level: str = "project", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    project_id = context.get("project_id") if context else None
    chat_id = context.get("chat_id") if context else None

    async with AsyncSessionLocal() as session:
        mems = await memory_service.list_memories(
            db=session,
            level=level,
            project_id=project_id,
            chat_id=chat_id,
            search=key
        )
        deleted_count = 0
        for m in mems:
            if m.key == key:
                await memory_service.delete_memory(session, m.id)
                deleted_count += 1
        return {"success": True, "deleted_count": deleted_count, "key": key}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "store_memory",
            "description": "Explicitly saves an important user preference, project architectural rule, or fact to long-term memory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Short identifier/topic for this memory"},
                    "value": {"type": "string", "description": "The exact fact or information to remember"},
                    "level": {"type": "string", "enum": ["global", "project", "chat"], "description": "Scope of memory: global (all chats), project (current project), or chat (current conversation)"},
                    "category": {"type": "string", "description": "Category (e.g. preferences, architecture, instructions)"}
                },
                "required": ["key", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recall_memory",
            "description": "Searches stored memories for specific facts or preferences.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search keyword or topic"},
                    "level": {"type": "string", "enum": ["all", "global", "project", "chat"], "description": "Memory level filter"}
                }
            }
        }
    }
]

HANDLERS = {
    "store_memory": store_memory,
    "recall_memory": recall_memory,
    "delete_memory_by_key": delete_memory_by_key
}
