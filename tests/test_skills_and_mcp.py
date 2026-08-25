import os
import pytest
from backend.skills.registry import skill_registry
from backend.skills.loader import load_builtin_skills

@pytest.mark.asyncio
async def test_skills_loading_and_tool_execution():
    load_builtin_skills()
    skills = skill_registry.list_skills()
    skill_ids = [s["id"] for s in skills]

    assert "web_research" in skill_ids
    assert "coding" in skill_ids
    assert "github" in skill_ids
    assert "google_workspace" in skill_ids
    assert "data_analysis" in skill_ids
    assert "memory_manager" in skill_ids

    # Test math calculation execution
    calc_res = await skill_registry.execute_tool(
        "calculate_expression",
        {"expression": "sqrt(256) + 10 * 2"}
    )
    assert calc_res.get("result") == 36.0

    # Test tool schemas retrieval
    tools = skill_registry.get_tools_for_skills(["data_analysis", "coding"])
    tool_names = [t["function"]["name"] for t in tools]
    assert "calculate_expression" in tool_names
    assert "read_file" in tool_names
    assert "write_file" in tool_names

@pytest.mark.asyncio
async def test_source_code_protection():
    load_builtin_skills()

    # Attempt to read JARVIS own backend/main.py
    current_dir = os.path.abspath(".")
    main_file = os.path.join(current_dir, "backend", "main.py")
    res = await skill_registry.execute_tool("read_file", {"path": main_file})
    assert "error" in res
    assert "Accesso negato" in res["error"]

    # Attempt to write inside JARVIS source tree
    fake_file = os.path.join(current_dir, "backend", "malicious.py")
    w_res = await skill_registry.execute_tool("write_file", {"path": fake_file, "content": "bad code"})
    assert "error" in w_res
    assert "Accesso negato" in w_res["error"]
