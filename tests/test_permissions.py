from backend.security.permissions import (
    PermissionLevel,
    get_tool_permission_level,
    requires_user_confirmation
)

def test_tool_permission_classification():
    assert get_tool_permission_level("web_search") == PermissionLevel.READ
    assert get_tool_permission_level("read_file") == PermissionLevel.READ
    assert get_tool_permission_level("github_list_issues") == PermissionLevel.READ

    assert get_tool_permission_level("write_file") == PermissionLevel.WRITE
    assert get_tool_permission_level("github_create_issue") == PermissionLevel.WRITE
    assert get_tool_permission_level("store_memory") == PermissionLevel.WRITE

    assert get_tool_permission_level("delete_file") == PermissionLevel.DESTRUCTIVE
    assert get_tool_permission_level("execute_terminal_command") == PermissionLevel.DESTRUCTIVE
    assert get_tool_permission_level("github_delete_repository") == PermissionLevel.DESTRUCTIVE

def test_confirmation_modes():
    # Balanced mode (Default): Only DESTRUCTIVE requires confirmation
    assert requires_user_confirmation(PermissionLevel.READ, "balanced") is False
    assert requires_user_confirmation(PermissionLevel.WRITE, "balanced") is False
    assert requires_user_confirmation(PermissionLevel.DESTRUCTIVE, "balanced") is True

    # Strict mode: WRITE and DESTRUCTIVE require confirmation
    assert requires_user_confirmation(PermissionLevel.READ, "strict") is False
    assert requires_user_confirmation(PermissionLevel.WRITE, "strict") is True
    assert requires_user_confirmation(PermissionLevel.DESTRUCTIVE, "strict") is True

    # Permissive mode: No confirmation required
    assert requires_user_confirmation(PermissionLevel.DESTRUCTIVE, "permissive") is False
