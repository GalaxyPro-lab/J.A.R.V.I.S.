import {
  Project,
  Chat,
  Message,
  MemoryItem,
  SkillItem,
  MCPServerItem,
  IntegrationsStatus,
  VoiceConfig,
  OllamaStatus
} from '../types';

const API_BASE = '/api';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(data: Partial<Project>): Promise<any> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create project');
  }
  return res.json();
}

export async function updateProject(id: string, data: Partial<Project>): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export async function createChat(projectId: string, title?: string, model?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, title, model })
  });
  if (!res.ok) throw new Error('Failed to create chat');
  return res.json();
}

export async function fetchChat(chatId: string): Promise<Chat> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`);
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json();
}

export async function updateChat(chatId: string, data: Partial<Chat>): Promise<any> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update chat');
  return res.json();
}

export async function deleteChat(chatId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete chat');
  return res.json();
}

export async function resolveToolApproval(logId: string, approved: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/tool-approvals/${logId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });
  return res.json();
}

export async function fetchMemories(params?: { level?: string; projectId?: string; chatId?: string; search?: string }): Promise<MemoryItem[]> {
  const query = new URLSearchParams();
  if (params?.level) query.set('level', params.level);
  if (params?.projectId) query.set('project_id', params.projectId);
  if (params?.chatId) query.set('chat_id', params.chatId);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/memories?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function createMemory(data: Partial<MemoryItem>): Promise<any> {
  const res = await fetch(`${API_BASE}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create memory');
  return res.json();
}

export async function deleteMemory(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/memories/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchSkills(): Promise<SkillItem[]> {
  const res = await fetch(`${API_BASE}/skills`);
  return res.json();
}

export async function updateSkill(id: string, enabled: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/skills/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  return res.json();
}

export async function fetchMCPServers(): Promise<MCPServerItem[]> {
  const res = await fetch(`${API_BASE}/mcp/servers`);
  return res.json();
}

export async function createMCPServer(data: Partial<MCPServerItem>): Promise<any> {
  const res = await fetch(`${API_BASE}/mcp/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function testMCPServer(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/mcp/servers/${id}/test`, { method: 'POST' });
  return res.json();
}

export async function deleteMCPServer(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/mcp/servers/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchIntegrations(): Promise<IntegrationsStatus> {
  const res = await fetch(`${API_BASE}/integrations`);
  return res.json();
}

export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/integrations/google/auth-url`);
  return res.json();
}

export async function configureGoogle(clientId: string, clientSecret: string): Promise<any> {
  const res = await fetch(`${API_BASE}/integrations/google/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
  });
  return res.json();
}

export async function setGitHubToken(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/integrations/github/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Token GitHub non valido');
  }
  return res.json();
}

export async function disconnectIntegration(provider: 'google' | 'github'): Promise<any> {
  const res = await fetch(`${API_BASE}/integrations/${provider}/disconnect`, { method: 'POST' });
  return res.json();
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const res = await fetch(`${API_BASE}/ollama/status`);
  return res.json();
}

export async function updateOllamaUrl(url: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ollama/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

export async function fetchVoiceConfig(): Promise<VoiceConfig> {
  const res = await fetch(`${API_BASE}/voice/config`);
  return res.json();
}

export async function updateVoiceConfig(data: Partial<VoiceConfig>): Promise<any> {
  const res = await fetch(`${API_BASE}/voice/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchAllSettings(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json();
}

export async function saveAllSettings(settings: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings })
  });
  return res.json();
}

export async function performGlobalSearch(q: string): Promise<any> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export interface StreamHandlers {
  onToken?: (token: string, fullContent: string) => void;
  onStatus?: (status: string, meta?: any) => void;
  onToolStart?: (toolName: string, args: any, permLevel: string) => void;
  onToolResult?: (toolName: string, result: any, status: string) => void;
  onApprovalRequired?: (toolName: string, args: any, logId: string, message: string) => void;
  onDone?: (messageId: string, fullContent: string) => void;
  onError?: (error: string) => void;
}

export async function streamMessage(
  chatId: string,
  content: string,
  attachments: any[] = [],
  modelOverride?: string,
  handlers: StreamHandlers = {},
  signal?: AbortSignal
) {
  try {
    const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        attachments,
        model: modelOverride
      }),
      signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      handlers.onError?.(err.detail || 'Failed to stream response');
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (block.startsWith('data: ')) {
          const jsonStr = block.replace('data: ', '').trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'token') {
              handlers.onToken?.(data.delta, data.content);
            } else if (data.type === 'status') {
              handlers.onStatus?.(data.status, data);
            } else if (data.type === 'tool_start') {
              handlers.onToolStart?.(data.tool_name, data.arguments, data.permission_level);
            } else if (data.type === 'tool_result') {
              handlers.onToolResult?.(data.tool_name, data.result, data.status);
            } else if (data.type === 'approval_required') {
              handlers.onApprovalRequired?.(data.tool_name, data.arguments, data.tool_log_id, data.message);
            } else if (data.type === 'done') {
              handlers.onDone?.(data.message_id, data.content);
            } else if (data.type === 'error') {
              handlers.onError?.(data.error);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e, jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      handlers.onError?.(err.message || 'Stream error');
    }
  }
}
