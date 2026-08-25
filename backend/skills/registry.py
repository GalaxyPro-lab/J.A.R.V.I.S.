import os
import json
import inspect
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable, Awaitable

SKILLS_DIR = Path(__file__).parent / "builtin"

class Skill:
    def __init__(
        self,
        skill_id: str,
        name: str,
        description: str,
        category: str,
        version: str,
        instructions: str,
        tools: List[Dict[str, Any]],
        handlers: Dict[str, Callable[..., Awaitable[Any]]],
        enabled_by_default: bool = True,
        icon: str = "Sparkles"
    ):
        self.skill_id = skill_id
        self.name = name
        self.description = description
        self.category = category
        self.version = version
        self.instructions = instructions
        self.tools = tools
        self.handlers = handlers
        self.enabled_by_default = enabled_by_default
        self.icon = icon

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.skill_id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "version": self.version,
            "icon": self.icon,
            "enabled": self.enabled_by_default,
            "tools_count": len(self.tools),
            "tools": self.tools,
            "instructions": self.instructions
        }

class SkillRegistry:
    def __init__(self):
        self._skills: Dict[str, Skill] = {}
        self._tool_to_skill: Dict[str, str] = {}

    def register(self, skill: Skill):
        self._skills[skill.skill_id] = skill
        for tool in skill.tools:
            function_info = tool.get("function", {})
            name = function_info.get("name")
            if name:
                self._tool_to_skill[name] = skill.skill_id

    def get_skill(self, skill_id: str) -> Optional[Skill]:
        return self._skills.get(skill_id)

    def list_skills(self) -> List[Dict[str, Any]]:
        return [skill.to_dict() for skill in self._skills.values()]

    def get_tools_for_skills(self, enabled_skill_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get all Ollama/OpenAI formatted tool schemas for the specified active skills.
        If enabled_skill_ids is None, returns tools for all enabled skills.
        """
        active_tools = []
        for skill_id, skill in self._skills.items():
            if enabled_skill_ids is None or skill_id in enabled_skill_ids:
                active_tools.extend(skill.tools)
        return active_tools

    def get_instructions_for_skills(self, enabled_skill_ids: Optional[List[str]] = None) -> str:
        """
        Assemble prompt instructions for all active skills.
        """
        instructions = []
        for skill_id, skill in self._skills.items():
            if enabled_skill_ids is None or skill_id in enabled_skill_ids:
                if skill.instructions.strip():
                    instructions.append(f"### Skill: {skill.name}\n{skill.instructions.strip()}")
        return "\n\n".join(instructions)

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Any:
        """
        Route tool call to appropriate handler.
        """
        skill_id = self._tool_to_skill.get(tool_name)
        if not skill_id:
            raise ValueError(f"No skill found handling tool: '{tool_name}'")

        skill = self._skills[skill_id]
        handler = skill.handlers.get(tool_name)
        if not handler:
            raise ValueError(f"Handler not found for tool: '{tool_name}' in skill '{skill_id}'")

        sig = inspect.signature(handler)
        if "context" in sig.parameters:
            return await handler(**arguments, context=context)
        return await handler(**arguments)

skill_registry = SkillRegistry()
