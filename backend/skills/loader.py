import json
from pathlib import Path
from backend.skills.registry import skill_registry, Skill

BUILTIN_DIR = Path(__file__).parent / "builtin"

def load_builtin_skills():
    """
    Scans builtin skills directory and registers each skill into the SkillRegistry.
    """
    from backend.skills.builtin.web_research import handler as web_h
    from backend.skills.builtin.coding import handler as code_h
    from backend.skills.builtin.github import handler as gh_h
    from backend.skills.builtin.google_workspace import handler as google_h
    from backend.skills.builtin.data_analysis import handler as data_h
    from backend.skills.builtin.memory_manager import handler as mem_h

    skill_modules = [
        ("web_research", web_h),
        ("coding", code_h),
        ("github", gh_h),
        ("google_workspace", google_h),
        ("data_analysis", data_h),
        ("memory_manager", mem_h)
    ]

    for skill_id, mod in skill_modules:
        skill_path = BUILTIN_DIR / skill_id
        skill_json_path = skill_path / "skill.json"
        instr_path = skill_path / "instructions.md"

        meta = {}
        if skill_json_path.exists():
            with open(skill_json_path, "r", encoding="utf-8") as f:
                meta = json.load(f)

        instructions = ""
        if instr_path.exists():
            with open(instr_path, "r", encoding="utf-8") as f:
                instructions = f.read()

        skill = Skill(
            skill_id=meta.get("id", skill_id),
            name=meta.get("name", skill_id.capitalize()),
            description=meta.get("description", ""),
            category=meta.get("category", "general"),
            version=meta.get("version", "1.0.0"),
            instructions=instructions,
            tools=getattr(mod, "TOOLS", []),
            handlers=getattr(mod, "HANDLERS", {}),
            enabled_by_default=meta.get("enabled", True),
            icon=meta.get("icon", "Sparkles")
        )
        skill_registry.register(skill)

load_builtin_skills()
