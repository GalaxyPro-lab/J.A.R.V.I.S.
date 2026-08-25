from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database.models import Project, Chat, Message
from backend.memory.service import memory_service
from backend.skills.registry import skill_registry

JARVIS_BASE_PERSONA = """Sei J.A.R.V.I.S. (Just A Rather Very Intelligent System), un assistente AI avanzato, elegante, reattivo, preciso e cordiale.
Fornisci risposte concise, strutturate, eleganti in italiano (o nella lingua richiesta dall'utente).
Utilizza Markdown avanzato, elenchi puntati, tabelle e blocchi di codice con syntax highlighting.
Quando hai a disposizione tool o integrazioni (Web, File/Coding, GitHub, Google, MCP, Memory), usali in modo mirato e proattivo per risolvere i task.
Non fingere di compiere azioni che non hai eseguito."""

class PromptBuilder:
    @staticmethod
    async def build_context(
        db: AsyncSession,
        chat_id: str,
        additional_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds completely isolated context for a specific chat_id.
        Merges:
        - System Base
        - Global Memories
        - Project Settings & Project Memories
        - Chat Settings & Chat Memories
        - Active Skills Instructions
        - Strict Chat Message History
        """
        # 1. Fetch Chat and its parent Project
        chat_query = select(Chat).where(Chat.id == chat_id)
        res = await db.execute(chat_query)
        chat = res.scalars().first()
        if not chat:
            raise ValueError(f"Chat {chat_id} non trovata.")

        proj_query = select(Project).where(Project.id == chat.project_id)
        res = await db.execute(proj_query)
        project = res.scalars().first()

        # 2. Collect Applicable Memories
        memories = await memory_service.get_context_memories(
            db=db,
            project_id=project.id if project else None,
            chat_id=chat.id
        )

        # 3. Collect Active Skills Instructions
        enabled_skills = project.enabled_skills if project and project.enabled_skills else None
        skills_instructions = skill_registry.get_instructions_for_skills(enabled_skills)

        # 4. Construct System Message Sections
        system_sections = [JARVIS_BASE_PERSONA]

        if project and project.system_instructions and project.system_instructions.strip():
            system_sections.append(f"### Istruzioni Progetto ({project.name}):\n{project.system_instructions.strip()}")

        if chat.system_instructions and chat.system_instructions.strip():
            system_sections.append(f"### Istruzioni Chat ({chat.title}):\n{chat.system_instructions.strip()}")

        if memories:
            mem_lines = []
            for m in memories:
                scope_tag = f"[{m['level'].upper()}]"
                mem_lines.append(f"- {scope_tag} ({m['category']}) {m['key']}: {m['value']}")
            system_sections.append("### Memoria a Lungo Termine:\n" + "\n".join(mem_lines))

        if skills_instructions:
            system_sections.append(skills_instructions)

        if additional_system_prompt:
            system_sections.append(additional_system_prompt)

        full_system_prompt = "\n\n".join(system_sections)

        # 5. Fetch Isolated Messages for this chat only
        msg_query = (
            select(Message)
            .where(Message.chat_id == chat.id)
            .order_by(Message.created_at.asc())
        )
        msg_res = await db.execute(msg_query)
        db_messages = msg_res.scalars().all()

        formatted_messages: List[Dict[str, Any]] = [
            {"role": "system", "content": full_system_prompt}
        ]

        for m in db_messages:
            msg_obj: Dict[str, Any] = {"role": m.role, "content": m.content}
            if m.tool_calls:
                msg_obj["tool_calls"] = m.tool_calls
            if m.tool_call_id:
                msg_obj["tool_call_id"] = m.tool_call_id
            formatted_messages.append(msg_obj)

        # Model options resolution: Chat overrides Project
        model = chat.model or (project.model if project else None) or "llama3.2"
        temperature = chat.temperature if chat.temperature is not None else (project.temperature if project and project.temperature is not None else 0.7)
        top_p = chat.top_p if chat.top_p is not None else (project.top_p if project and project.top_p is not None else 0.9)

        return {
            "chat": chat,
            "project": project,
            "model": model,
            "temperature": temperature,
            "top_p": top_p,
            "messages": formatted_messages,
            "enabled_skills": enabled_skills,
            "enabled_mcp_servers": project.enabled_mcp_servers if project else []
        }

prompt_builder = PromptBuilder()
