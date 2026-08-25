import pytest
from backend.database.models import Project, Chat, Message, Memory
from backend.ai.prompt_builder import prompt_builder

@pytest.mark.asyncio
async def test_context_isolation_between_chats(db_session):
    # Setup Project
    project = Project(
        name="Security Research",
        system_instructions="Project Rule: Only talk about cryptography."
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Chat A: Secrets
    chat_a = Chat(project_id=project.id, title="Chat A")
    # Chat B: Public
    chat_b = Chat(project_id=project.id, title="Chat B")
    db_session.add_all([chat_a, chat_b])
    await db_session.commit()
    await db_session.refresh(chat_a)
    await db_session.refresh(chat_b)

    # Messages in Chat A
    msg_a1 = Message(chat_id=chat_a.id, role="user", content="Top secret token: XYZ-12345")
    msg_a2 = Message(chat_id=chat_a.id, role="assistant", content="Acknowledged secret XYZ-12345")
    db_session.add_all([msg_a1, msg_a2])

    # Messages in Chat B
    msg_b1 = Message(chat_id=chat_b.id, role="user", content="What is the weather today?")
    db_session.add(msg_b1)

    # Memory in Chat A only
    mem_a = Memory(level="chat", chat_id=chat_a.id, key="secret_key", value="SUPER_SECRET_A")
    # Memory in Chat B only
    mem_b = Memory(level="chat", chat_id=chat_b.id, key="weather_pref", value="Celsius")
    # Memory in Project
    mem_proj = Memory(level="project", project_id=project.id, key="org_name", value="IronCorp")
    db_session.add_all([mem_a, mem_b, mem_proj])
    await db_session.commit()

    # Build context for Chat A
    context_a = await prompt_builder.build_context(db_session, chat_a.id)
    chat_a_text = str(context_a["messages"])

    # Build context for Chat B
    context_b = await prompt_builder.build_context(db_session, chat_b.id)
    chat_b_text = str(context_b["messages"])

    # 1. Chat A must contain secret token and secret memory
    assert "XYZ-12345" in chat_a_text
    assert "SUPER_SECRET_A" in chat_a_text
    assert "IronCorp" in chat_a_text
    # 2. Chat A must NOT contain Chat B weather question or memory
    assert "What is the weather today?" not in chat_a_text
    assert "weather_pref" not in chat_a_text

    # 3. Chat B must contain weather question and Chat B memory and Project memory
    assert "What is the weather today?" in chat_b_text
    assert "Celsius" in chat_b_text
    assert "IronCorp" in chat_b_text
    # 4. Chat B must NEVER see Chat A secrets
    assert "XYZ-12345" not in chat_b_text
    assert "SUPER_SECRET_A" not in chat_b_text
