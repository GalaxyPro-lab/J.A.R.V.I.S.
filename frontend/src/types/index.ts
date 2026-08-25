export interface Project {
  id: string;
  name: string;
  description?: string;
  model?: string | null;
  system_instructions?: string;
  temperature?: number;
  top_p?: number;
  enabled_skills: string[];
  enabled_mcp_servers: string[];
  chats_count?: number;
  created_at?: string;
  updated_at?: string;
  chats?: ChatSummary[];
}

export interface ChatSummary {
  id: string;
  title: string;
  model?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Chat {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  model?: string | null;
  system_instructions?: string | null;
  temperature?: number | null;
  top_p?: number | null;
  voice_mode_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  chat_id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  reasoning_content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string | null;
  attachments?: Attachment[];
  created_at?: string;
}

export interface Attachment {
  name: string;
  type: string;
  size?: number;
  dataUrl?: string;
}

export interface MemoryItem {
  id: string;
  level: 'global' | 'project' | 'chat';
  category: string;
  key: string;
  value: string;
  project_id?: string | null;
  chat_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  icon: string;
  enabled: boolean;
  tools_count: number;
  tools: any[];
  instructions: string;
}

export interface MCPServerItem {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  enabled: boolean;
  is_connected: boolean;
  tools_count: number;
  tools: any[];
  last_error?: string | null;
  created_at?: string;
}

export interface IntegrationsStatus {
  google: {
    is_connected: boolean;
    client_id_configured: boolean;
    user_info: any;
    services: { name: string; available: boolean }[];
  };
  github: {
    is_connected: boolean;
    user_info: any;
    capabilities: { name: string; level: string }[];
  };
}

export interface VoiceConfig {
  stt_provider: string;
  tts_provider: string;
  voice_name: string;
  pitch: number;
  rate: number;
  vad_sensitivity: number;
  silence_threshold_ms: number;
  available_stt_providers: string[];
  available_tts_providers: string[];
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
  details?: Record<string, any>;
}

export interface OllamaStatus {
  status: {
    online: boolean;
    url: string;
    models_count: number;
    models: string[];
    message: string;
  };
  models: OllamaModel[];
}

export type AssistantState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';
