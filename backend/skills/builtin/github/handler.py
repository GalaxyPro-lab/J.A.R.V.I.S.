from typing import Dict, Any
from backend.integrations.github.client import github_client

async def github_list_repositories(limit: int = 15) -> Dict[str, Any]:
    return await github_client.list_repositories(limit=limit)

async def github_get_file_contents(owner: str, repo: str, path: str, branch: str = "main") -> Dict[str, Any]:
    return await github_client.get_file_contents(owner=owner, repo=repo, path=path, branch=branch)

async def github_search_code(query: str, limit: int = 10) -> Dict[str, Any]:
    return await github_client.search_code(query=query, limit=limit)

async def github_list_issues(owner: str, repo: str, state: str = "open", limit: int = 10) -> Dict[str, Any]:
    return await github_client.list_issues(owner=owner, repo=repo, state=state, limit=limit)

async def github_create_issue(owner: str, repo: str, title: str, body: str) -> Dict[str, Any]:
    return await github_client.create_issue(owner=owner, repo=repo, title=title, body=body)

async def github_create_pull_request(owner: str, repo: str, title: str, head: str, base: str = "main", body: str = "") -> Dict[str, Any]:
    return await github_client.create_pull_request(owner=owner, repo=repo, title=title, head=head, base=base, body=body)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "github_list_repositories",
            "description": "Lists the authenticated user's GitHub repositories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Max repositories to return (default 15)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "github_get_file_contents",
            "description": "Fetches raw file content from a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner (user or org)"},
                    "repo": {"type": "string", "description": "Repository name"},
                    "path": {"type": "string", "description": "File path inside repo"},
                    "branch": {"type": "string", "description": "Branch name (default: main)"}
                },
                "required": ["owner", "repo", "path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "github_search_code",
            "description": "Searches for code keywords across GitHub.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Code search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "github_list_issues",
            "description": "Lists issues for a specific GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner"},
                    "repo": {"type": "string", "description": "Repository name"},
                    "state": {"type": "string", "description": "Issue state: open, closed, all"}
                },
                "required": ["owner", "repo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_issue",
            "description": "Creates a new issue in a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner"},
                    "repo": {"type": "string", "description": "Repository name"},
                    "title": {"type": "string", "description": "Title of the issue"},
                    "body": {"type": "string", "description": "Body description of the issue"}
                },
                "required": ["owner", "repo", "title", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_pull_request",
            "description": "Creates a new pull request in a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner"},
                    "repo": {"type": "string", "description": "Repository name"},
                    "title": {"type": "string", "description": "Title of the pull request"},
                    "head": {"type": "string", "description": "Branch where changes are implemented"},
                    "base": {"type": "string", "description": "Branch to merge into (default: main)"},
                    "body": {"type": "string", "description": "Pull request description"}
                },
                "required": ["owner", "repo", "title", "head"]
            }
        }
    }
]

HANDLERS = {
    "github_list_repositories": github_list_repositories,
    "github_get_file_contents": github_get_file_contents,
    "github_search_code": github_search_code,
    "github_list_issues": github_list_issues,
    "github_create_issue": github_create_issue,
    "github_create_pull_request": github_create_pull_request
}
