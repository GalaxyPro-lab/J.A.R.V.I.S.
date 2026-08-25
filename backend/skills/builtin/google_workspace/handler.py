from typing import Dict, Any
from backend.integrations.google.client import google_client

async def google_list_emails(query: str = "", max_results: int = 5) -> Dict[str, Any]:
    return await google_client.list_emails(query=query, max_results=max_results)

async def google_list_calendar_events(time_min: str = "", max_results: int = 10) -> Dict[str, Any]:
    return await google_client.list_calendar_events(time_min=time_min, max_results=max_results)

async def google_create_calendar_event(summary: str, start_time: str, end_time: str, description: str = "") -> Dict[str, Any]:
    return await google_client.create_calendar_event(summary=summary, start_time=start_time, end_time=end_time, description=description)

async def google_search_drive(query: str = "", page_size: int = 10) -> Dict[str, Any]:
    return await google_client.search_drive(query=query, page_size=page_size)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "google_list_emails",
            "description": "Lists or searches emails in the user's Gmail mailbox.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query filter (e.g. is:unread, from:boss)"},
                    "max_results": {"type": "integer", "description": "Number of emails to return"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "google_list_calendar_events",
            "description": "Lists upcoming events from Google Calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "time_min": {"type": "string", "description": "ISO start datetime filter"},
                    "max_results": {"type": "integer", "description": "Max events to return"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "google_create_calendar_event",
            "description": "Schedules a new meeting or event in Google Calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string", "description": "Title of the calendar event"},
                    "start_time": {"type": "string", "description": "ISO start datetime (e.g. 2026-08-26T10:00:00Z)"},
                    "end_time": {"type": "string", "description": "ISO end datetime"},
                    "description": {"type": "string", "description": "Event description or notes"}
                },
                "required": ["summary", "start_time", "end_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "google_search_drive",
            "description": "Searches files and documents in Google Drive.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Filename or keyword search"},
                    "page_size": {"type": "integer", "description": "Max files to return"}
                }
            }
        }
    }
]

HANDLERS = {
    "google_list_emails": google_list_emails,
    "google_list_calendar_events": google_list_calendar_events,
    "google_create_calendar_event": google_create_calendar_event,
    "google_search_drive": google_search_drive
}
