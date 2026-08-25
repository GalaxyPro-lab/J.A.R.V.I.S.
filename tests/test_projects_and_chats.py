import pytest
from sqlalchemy import select
from backend.database.models import Project, Chat, Message, Memory, ToolCallLog

@pytest.mark.asyncio
async def test_project_and_chat_creation_and_cascade_delete(db_session):
    # 1. Create a Project
    project = Project(
        name="Project Alpha",
        description="Test project for cascade check",
        model="llama3.2",
        system_instructions="Rule 1: Be precise."
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    assert project.id is not None
    assert project.name == "Project Alpha"

    # 2. Create Chats in the project
    chat1 = Chat(project_id=project.id, title="Nuova chat")
    chat2 = Chat(project_id=project.id, title="Research Chat")
    db_session.add_all([chat1, chat2])
    await db_session.commit()
    await db_session.refresh(chat1)
    await db_session.refresh(chat2)

    # 3. Add Messages to chat1
    msg1 = Message(chat_id=chat1.id, role="user", content="Hello Jarvis")
    msg2 = Message(chat_id=chat1.id, role="assistant", content="Hello Sir, how may I assist you?")
    db_session.add_all([msg1, msg2])

    # 4. Add Memories
    proj_mem = Memory(level="project", project_id=project.id, key="tech_stack", value="FastAPI + React")
    chat_mem = Memory(level="chat", chat_id=chat1.id, key="user_goal", value="Build Jarvis UI")
    db_session.add_all([proj_mem, chat_mem])

    # 5. Add Tool Log
    tool_log = ToolCallLog(chat_id=chat1.id, tool_name="web_search", permission_level="READ", arguments={"query": "AI"})
    db_session.add(tool_log)
    await db_session.commit()

    # Verify everything is present
    res = await db_session.execute(select(Message).where(Message.chat_id == chat1.id))
    assert len(res.scalars().all()) == 2

    # 6. Delete Project - Cascading Verification
    await db_session.delete(project)
    await db_session.commit()

    # Check Chats are deleted
    c_res = await db_session.execute(select(Chat).where(Chat.project_id == project.id))
    assert len(c_res.scalars().all()) == 0

    # Check Messages are deleted
    m_res = await db_session.execute(select(Message).where(Message.chat_id == chat1.id))
    assert len(m_res.scalars().all()) == 0

    # Check Memories are deleted
    mem_res = await db_session.execute(select(Memory).where(Memory.project_id == project.id))
    assert len(mem_res.scalars().all()) == 0

    # Check Tool logs are deleted
    t_res = await db_session.execute(select(ToolCallLog).where(ToolCallLog.chat_id == chat1.id))
    assert len(t_res.scalars().all()) == 0

@pytest.mark.asyncio
async def test_chat_renaming_and_single_chat_deletion(db_session):
    project = Project(name="Project Beta")
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    chat = Chat(project_id=project.id, title="Nuova chat")
    db_session.add(chat)
    await db_session.commit()
    await db_session.refresh(chat)

    # Rename
    chat.title = "Renamed Chat Title"
    await db_session.commit()
    await db_session.refresh(chat)
    assert chat.title == "Renamed Chat Title"

    # Add message
    msg = Message(chat_id=chat.id, role="user", content="Test message")
    db_session.add(msg)
    await db_session.commit()

    # Delete Chat
    await db_session.delete(chat)
    await db_session.commit()

    # Project must still exist
    p_res = await db_session.execute(select(Project).where(Project.id == project.id))
    assert p_res.scalars().first() is not None

    # Message must be gone
    m_res = await db_session.execute(select(Message).where(Message.chat_id == chat.id))
    assert len(m_res.scalars().all()) == 0
