from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, delete
from backend.database.models import Memory

class MemoryService:
    @staticmethod
    async def add_memory(
        db: AsyncSession,
        level: str,
        key: str,
        value: str,
        category: str = "general",
        project_id: Optional[str] = None,
        chat_id: Optional[str] = None
    ) -> Memory:
        """
        Store a new memory item at global, project, or chat tier.
        """
        # Validate target IDs according to tier
        if level == "global":
            project_id = None
            chat_id = None
        elif level == "project":
            if not project_id:
                raise ValueError("project_id is required for project-level memory")
            chat_id = None
        elif level == "chat":
            if not chat_id:
                raise ValueError("chat_id is required for chat-level memory")

        # Check if an existing memory with same key in this scope exists; if so, update it
        query = select(Memory).where(
            and_(
                Memory.level == level,
                Memory.key == key,
                Memory.project_id == project_id,
                Memory.chat_id == chat_id
            )
        )
        result = await db.execute(query)
        existing = result.scalars().first()

        if existing:
            existing.value = value
            existing.category = category
            await db.commit()
            await db.refresh(existing)
            return existing

        new_mem = Memory(
            level=level,
            project_id=project_id,
            chat_id=chat_id,
            category=category,
            key=key,
            value=value
        )
        db.add(new_mem)
        await db.commit()
        await db.refresh(new_mem)
        return new_mem

    @staticmethod
    async def list_memories(
        db: AsyncSession,
        level: Optional[str] = None,
        project_id: Optional[str] = None,
        chat_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Memory]:
        """
        Query memories with optional filtering.
        """
        conditions = []
        if level:
            conditions.append(Memory.level == level)
        if project_id:
            conditions.append(Memory.project_id == project_id)
        if chat_id:
            conditions.append(Memory.chat_id == chat_id)
        if category:
            conditions.append(Memory.category == category)
        if search:
            conditions.append(
                or_(
                    Memory.key.ilike(f"%{search}%"),
                    Memory.value.ilike(f"%{search}%")
                )
            )

        query = select(Memory)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(Memory.created_at.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def delete_memory(db: AsyncSession, memory_id: str) -> bool:
        """
        Delete a memory by its ID.
        """
        query = delete(Memory).where(Memory.id == memory_id)
        result = await db.execute(query)
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def get_context_memories(
        db: AsyncSession,
        project_id: Optional[str] = None,
        chat_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all applicable memories for a given chat:
        Global memories + Project memories + Chat memories
        """
        conditions = [Memory.level == "global"]

        if project_id:
            conditions.append(
                and_(Memory.level == "project", Memory.project_id == project_id)
            )
        if chat_id:
            conditions.append(
                and_(Memory.level == "chat", Memory.chat_id == chat_id)
            )

        query = select(Memory).where(or_(*conditions)).order_by(Memory.level.asc(), Memory.created_at.asc())
        result = await db.execute(query)
        mems = result.scalars().all()

        return [
            {
                "id": m.id,
                "level": m.level,
                "category": m.category,
                "key": m.key,
                "value": m.value
            }
            for m in mems
        ]

memory_service = MemoryService()
