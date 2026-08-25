import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from backend.database.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    model = Column(String(100), nullable=True, default=None)
    system_instructions = Column(Text, nullable=True, default="")
    temperature = Column(Float, nullable=True, default=0.7)
    top_p = Column(Float, nullable=True, default=0.9)
    enabled_skills = Column(JSON, nullable=False, default=list)
    enabled_mcp_servers = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    chats = relationship("Chat", back_populates="project", cascade="all, delete-orphan", passive_deletes=True)
    memories = relationship("Memory", back_populates="project", cascade="all, delete-orphan", passive_deletes=True)


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Nuova chat")
    model = Column(String(100), nullable=True, default=None)
    system_instructions = Column(Text, nullable=True, default=None)
    temperature = Column(Float, nullable=True, default=None)
    top_p = Column(Float, nullable=True, default=None)
    voice_mode_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    project = relationship("Project", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan", passive_deletes=True)
    memories = relationship("Memory", back_populates="chat", cascade="all, delete-orphan", passive_deletes=True)
    tool_logs = relationship("ToolCallLog", back_populates="chat", cascade="all, delete-orphan", passive_deletes=True)


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chat_id = Column(String(36), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(30), nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=False, default="")
    reasoning_content = Column(Text, nullable=True, default=None)
    tool_calls = Column(JSON, nullable=True, default=None)
    tool_call_id = Column(String(100), nullable=True, default=None)
    attachments = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    chat = relationship("Chat", back_populates="messages")


class Memory(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    level = Column(String(20), nullable=False)  # global, project, chat
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    chat_id = Column(String(36), ForeignKey("chats.id", ondelete="CASCADE"), nullable=True, index=True)
    category = Column(String(100), nullable=False, default="general")
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    project = relationship("Project", back_populates="memories")
    chat = relationship("Chat", back_populates="memories")

    __table_args__ = (
        Index("idx_memory_level_target", "level", "project_id", "chat_id"),
    )


class SkillRecord(Base):
    __tablename__ = "skills"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    icon = Column(String(50), nullable=True, default="Sparkles")
    version = Column(String(30), nullable=False, default="1.0.0")
    category = Column(String(50), nullable=False, default="general")
    enabled = Column(Boolean, default=True, nullable=False)
    config = Column(JSON, nullable=False, default=dict)
    instructions = Column(Text, nullable=True, default="")


class MCPServerRecord(Base):
    __tablename__ = "mcp_servers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    transport = Column(String(30), nullable=False, default="stdio")  # stdio, sse, http
    command = Column(String(255), nullable=True)
    args = Column(JSON, nullable=False, default=list)
    env = Column(JSON, nullable=False, default=dict)
    url = Column(String(500), nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    permissions = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)


class IntegrationRecord(Base):
    __tablename__ = "integrations"

    id = Column(String(50), primary_key=True)  # google, github
    provider = Column(String(50), nullable=False)
    is_connected = Column(Boolean, default=False, nullable=False)
    credentials_encrypted = Column(Text, nullable=True)
    scopes = Column(JSON, nullable=False, default=list)
    user_info = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)


class ToolCallLog(Base):
    __tablename__ = "tool_call_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chat_id = Column(String(36), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), nullable=True)
    tool_name = Column(String(255), nullable=False)
    permission_level = Column(String(30), nullable=False, default="READ")  # READ, WRITE, DESTRUCTIVE
    arguments = Column(JSON, nullable=False, default=dict)
    result = Column(JSON, nullable=True)
    status = Column(String(30), nullable=False, default="pending")  # pending, approved, rejected, executed, failed
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    chat = relationship("Chat", back_populates="tool_logs")


class SettingRecord(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
