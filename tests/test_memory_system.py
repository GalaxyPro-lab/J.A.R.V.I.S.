import pytest
from backend.database.models import Project, Chat
from backend.memory.service import memory_service

@pytest.mark.asyncio
async def test_3_tier_memory_crud(db_session):
    project = Project(name="JARVIS Development")
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    chat = Chat(project_id=project.id, title="Main Chat")
    db_session.add(chat)
    await db_session.commit()
    await db_session.refresh(chat)

    # 1. Add Global Memory
    g_mem = await memory_service.add_memory(
        db=db_session,
        level="global",
        key="user_title",
        value="Sir",
        category="preferences"
    )
    assert g_mem.id is not None
    assert g_mem.level == "global"

    # 2. Add Project Memory
    p_mem = await memory_service.add_memory(
        db=db_session,
        level="project",
        key="project_goal",
        value="Deliver high quality JARVIS assistant",
        project_id=project.id
    )
    assert p_mem.level == "project"

    # 3. Add Chat Memory
    c_mem = await memory_service.add_memory(
        db=db_session,
        level="chat",
        key="focus_mode",
        value="Testing and verification",
        chat_id=chat.id
    )
    assert c_mem.level == "chat"

    # 4. Context memory aggregation for this chat
    context_mems = await memory_service.get_context_memories(
        db=db_session,
        project_id=project.id,
        chat_id=chat.id
    )
    assert len(context_mems) == 3
    keys = [m["key"] for m in context_mems]
    assert "user_title" in keys
    assert "project_goal" in keys
    assert "focus_mode" in keys

    # 5. Delete a memory
    del_success = await memory_service.delete_memory(db_session, c_mem.id)
    assert del_success is True

    # 6. Verify it's gone
    updated_context = await memory_service.get_context_memories(
        db=db_session,
        project_id=project.id,
        chat_id=chat.id
    )
    assert len(updated_context) == 2
