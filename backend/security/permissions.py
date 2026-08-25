from enum import Enum
from typing import Dict, Any, Optional

class PermissionLevel(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    DESTRUCTIVE = "DESTRUCTIVE"

# Default classification mappings for built-in and common MCP tools
TOOL_PERMISSION_MAP: Dict[str, PermissionLevel] = {
    # Web & search
    "web_search": PermissionLevel.READ,
    "fetch_web_page": PermissionLevel.READ,
    
    # Coding & Files
    "read_file": PermissionLevel.READ,
    "list_directory": PermissionLevel.READ,
    "search_files": PermissionLevel.READ,
    "write_file": PermissionLevel.WRITE,
    "edit_file": PermissionLevel.WRITE,
    "delete_file": PermissionLevel.DESTRUCTIVE,
    "execute_terminal_command": PermissionLevel.DESTRUCTIVE,
    
    # GitHub
    "github_list_repositories": PermissionLevel.READ,
    "github_get_file_contents": PermissionLevel.READ,
    "github_search_code": PermissionLevel.READ,
    "github_list_issues": PermissionLevel.READ,
    "github_create_issue": PermissionLevel.WRITE,
    "github_create_pull_request": PermissionLevel.WRITE,
    "github_create_or_update_file": PermissionLevel.WRITE,
    "github_delete_file": PermissionLevel.DESTRUCTIVE,
    "github_delete_repository": PermissionLevel.DESTRUCTIVE,
    
    # Google Workspace
    "google_list_emails": PermissionLevel.READ,
    "google_read_email": PermissionLevel.READ,
    "google_send_email": PermissionLevel.WRITE,
    "google_list_calendar_events": PermissionLevel.READ,
    "google_create_calendar_event": PermissionLevel.WRITE,
    "google_delete_calendar_event": PermissionLevel.DESTRUCTIVE,
    "google_search_drive": PermissionLevel.READ,
    "google_create_doc": PermissionLevel.WRITE,
    "google_delete_drive_file": PermissionLevel.DESTRUCTIVE,
    
    # Memory
    "recall_memory": PermissionLevel.READ,
    "store_memory": PermissionLevel.WRITE,
    "delete_memory": PermissionLevel.DESTRUCTIVE,
    
    # Data Analysis
    "calculate_expression": PermissionLevel.READ,
    "analyze_dataset": PermissionLevel.READ,
}

def get_tool_permission_level(tool_name: str, custom_permissions: Optional[Dict[str, str]] = None) -> PermissionLevel:
    if custom_permissions and tool_name in custom_permissions:
        return PermissionLevel(custom_permissions[tool_name])
    
    if tool_name in TOOL_PERMISSION_MAP:
        return TOOL_PERMISSION_MAP[tool_name]
    
    # Heuristics for MCP tools
    lower = tool_name.lower()
    if any(word in lower for word in ["delete", "remove", "drop", "destroy", "kill", "terminate", "format", "exec", "cmd", "run", "bash"]):
        return PermissionLevel.DESTRUCTIVE
    if any(word in lower for word in ["write", "create", "update", "edit", "insert", "modify", "send", "post", "patch"]):
        return PermissionLevel.WRITE
    
    return PermissionLevel.READ

def requires_user_confirmation(level: PermissionLevel, security_mode: str = "balanced") -> bool:
    """
    security_mode options:
    - strict: WRITE and DESTRUCTIVE require confirmation
    - balanced: Only DESTRUCTIVE requires confirmation (Default)
    - permissive: All tools auto-approved
    """
    if security_mode == "permissive":
        return False
    if security_mode == "strict":
        return level in (PermissionLevel.WRITE, PermissionLevel.DESTRUCTIVE)
    # Balanced
    return level == PermissionLevel.DESTRUCTIVE
