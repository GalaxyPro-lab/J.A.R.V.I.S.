import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Cpu,
  Mic,
  Server,
  Sparkles,
  Mail,
  Github,
  Brain,
  Shield,
  Info,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  SkillItem,
  MCPServerItem,
  IntegrationsStatus,
  VoiceConfig,
  OllamaStatus,
  MemoryItem
} from '../../types';
import {
  getOllamaStatus,
  updateOllamaUrl,
  fetchVoiceConfig,
  updateVoiceConfig,
  fetchSkills,
  updateSkill,
  fetchMCPServers,
  createMCPServer,
  testMCPServer,
  deleteMCPServer,
  fetchIntegrations,
  configureGoogle,
  getGoogleAuthUrl,
  setGitHubToken,
  disconnectIntegration,
  fetchMemories,
  createMemory,
  deleteMemory,
  fetchAllSettings,
  saveAllSettings
} from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<string>('ollama');

  // Ollama tab state
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isTestingOllama, setIsTestingOllama] = useState(false);

  // Voice tab state
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);

  // Skills tab state
  const [skills, setSkills] = useState<SkillItem[]>([]);

  // MCP tab state
  const [mcpServers, setMcpServers] = useState<MCPServerItem[]>([]);
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpTransport, setNewMcpTransport] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [newMcpCommand, setNewMcpCommand] = useState('');
  const [newMcpUrl, setNewMcpUrl] = useState('');

  // Integrations tab state
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [githubToken, setGithubGithubToken] = useState('');
  const [githubMsg, setGithubMsg] = useState('');

  // Memory tab state
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');
  const [newMemLevel, setNewMemLevel] = useState<'global' | 'project' | 'chat'>('global');

  // Security tab state
  const [securityMode, setSecurityMode] = useState('balanced');

  const loadData = async () => {
    try {
      const [status, vConfig, skList, mcpList, intStatus, memList, settingsData] = await Promise.all([
        getOllamaStatus(),
        fetchVoiceConfig(),
        fetchSkills(),
        fetchMCPServers(),
        fetchIntegrations(),
        fetchMemories(),
        fetchAllSettings()
      ]);
      setOllamaStatus(status);
      setVoiceConfig(vConfig);
      setSkills(skList);
      setMcpServers(mcpList);
      setIntegrations(intStatus);
      setMemories(memList);
      if (settingsData?.security_mode?.mode) {
        setSecurityMode(settingsData.security_mode.mode);
      }
      if (settingsData?.ollama_url?.url) {
        setOllamaUrl(settingsData.ollama_url.url);
      }
    } catch (e) {
      console.error('Error loading settings data:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateOllama = async () => {
    setIsTestingOllama(true);
    try {
      await updateOllamaUrl(ollamaUrl);
      const s = await getOllamaStatus();
      setOllamaStatus(s);
      onRefreshData?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingOllama(false);
    }
  };

  const handleSaveVoiceConfig = async (partial: Partial<VoiceConfig>) => {
    try {
      const updated = await updateVoiceConfig(partial);
      setVoiceConfig(updated.config);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSkill = async (id: string, current: boolean) => {
    await updateSkill(id, !current);
    const sk = await fetchSkills();
    setSkills(sk);
    onRefreshData?.();
  };

  const handleAddMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim()) return;
    await createMCPServer({
      name: newMcpName.trim(),
      transport: newMcpTransport,
      command: newMcpCommand.trim() || undefined,
      url: newMcpUrl.trim() || undefined,
      enabled: true
    });
    setNewMcpName('');
    setNewMcpCommand('');
    setNewMcpUrl('');
    const list = await fetchMCPServers();
    setMcpServers(list);
    onRefreshData?.();
  };

  const handleDeleteMcp = async (id: string) => {
    await deleteMCPServer(id);
    const list = await fetchMCPServers();
    setMcpServers(list);
    onRefreshData?.();
  };

  const handleTestMcp = async (id: string) => {
    await testMCPServer(id);
    const list = await fetchMCPServers();
    setMcpServers(list);
  };

  const handleSaveGoogle = async () => {
    if (googleClientId && googleClientSecret) {
      await configureGoogle(googleClientId, googleClientSecret);
      const int = await fetchIntegrations();
      setIntegrations(int);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await getGoogleAuthUrl();
      if (res.url) {
        window.open(res.url, '_blank', 'width=600,height=700');
      }
    } catch (e: any) {
      alert(e.message || 'Configura prima Client ID e Secret di Google');
    }
  };

  const handleSaveGithub = async () => {
    if (!githubToken.trim()) return;
    try {
      await setGitHubToken(githubToken.trim());
      setGithubMsg('GitHub collegato con successo!');
      setGithubGithubToken('');
      const int = await fetchIntegrations();
      setIntegrations(int);
      onRefreshData?.();
    } catch (e: any) {
      setGithubMsg(`Errore: ${e.message}`);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    await createMemory({
      level: newMemLevel,
      key: newMemKey.trim(),
      value: newMemVal.trim(),
      category: 'user_note'
    });
    setNewMemKey('');
    setNewMemVal('');
    const mems = await fetchMemories();
    setMemories(mems);
  };

  const handleDeleteMem = async (id: string) => {
    await deleteMemory(id);
    const mems = await fetchMemories();
    setMemories(mems);
  };

  const handleSaveSecurityMode = async (mode: string) => {
    setSecurityMode(mode);
    await saveAllSettings({ security_mode: { mode } });
  };

  const navTabs = [
    { id: 'ollama', label: 'Ollama & Modelli', icon: Cpu },
    { id: 'voice', label: 'Modalità Vocale', icon: Mic },
    { id: 'skills', label: 'Skills & Capacità', icon: Sparkles },
    { id: 'mcp', label: 'MCP Servers', icon: Server },
    { id: 'google', label: 'Google Workspace', icon: Mail },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'memory', label: 'Memoria a 3 Livelli', icon: Brain },
    { id: 'security', label: 'Sicurezza & Permessi', icon: Shield },
    { id: 'about', label: 'Informazioni JARVIS', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[640px] rounded-3xl bg-[#0a0f1d] border border-cyan-500/30 shadow-[0_0_60px_rgba(0,240,255,0.15)] flex overflow-hidden text-slate-100">
        {/* Left Settings Navigation Sidebar */}
        <div className="w-64 bg-[#070b14] border-r border-slate-800/80 p-4 flex flex-col justify-between flex-shrink-0 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider mb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4" />
              <span>CONFIGURAZIONE</span>
            </div>

            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 text-center">
            JARVIS Autonomous System v1.0.0
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c1222]/90">
          {/* Top Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              {navTabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
            {/* TAB: OLLAMA */}
            {activeTab === 'ollama' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">Stato Server Ollama</span>
                    {ollamaStatus?.status.online ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                        <Wifi className="w-3.5 h-3.5" /> ONLINE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30 text-[11px] font-mono">
                        <WifiOff className="w-3.5 h-3.5" /> OFFLINE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {ollamaStatus?.status.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
                    URL Endpoint Ollama
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 outline-none text-slate-100 font-mono text-xs"
                    />
                    <button
                      onClick={handleUpdateOllama}
                      disabled={isTestingOllama}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingOllama ? 'animate-spin' : ''}`} />
                      <span>Verifica</span>
                    </button>
                  </div>
                </div>

                {/* Available Models List */}
                <div className="space-y-2">
                  <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px] block">
                    Modelli Installati ({ollamaStatus?.models?.length || 0})
                  </span>
                  <div className="space-y-2">
                    {ollamaStatus?.models && ollamaStatus.models.length > 0 ? (
                      ollamaStatus.models.map((m) => (
                        <div
                          key={m.name}
                          className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">{m.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Digest: {m.digest.substring(0, 16)}...
                            </span>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                            {(m.size / 1024 / 1024 / 1024).toFixed(1)} GB
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-slate-400 text-center">
                        Nessun modello trovato in locale. Puoi installarne uno eseguendo nel terminale: <code className="text-cyan-300">ollama run llama3.2</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VOICE */}
            {activeTab === 'voice' && voiceConfig && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
                    Provider Speech-To-Text (STT)
                  </label>
                  <select
                    value={voiceConfig.stt_provider}
                    onChange={(e) => handleSaveVoiceConfig({ stt_provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 outline-none text-slate-100 text-xs font-mono"
                  >
                    <option value="web_speech">Web Speech API (Browser Native - Zero Latency)</option>
                    <option value="whisper_local">Whisper Local Engine</option>
                    <option value="whisper_openai">Whisper Cloud API</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
                    Provider Text-To-Speech (TTS)
                  </label>
                  <select
                    value={voiceConfig.tts_provider}
                    onChange={(e) => handleSaveVoiceConfig({ tts_provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 outline-none text-slate-100 text-xs font-mono"
                  >
                    <option value="web_speech">Web Speech Synthesis (Browser Italian Voice)</option>
                    <option value="elevenlabs">ElevenLabs Neural Voice</option>
                    <option value="openai">OpenAI TTS HD</option>
                    <option value="google">Google Cloud TTS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 text-[11px] flex justify-between">
                      <span>Velocità Voce ({voiceConfig.rate}x)</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={voiceConfig.rate}
                      onChange={(e) => handleSaveVoiceConfig({ rate: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 text-[11px] flex justify-between">
                      <span>Tonalità / Pitch ({voiceConfig.pitch})</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={voiceConfig.pitch}
                      onChange={(e) => handleSaveVoiceConfig({ pitch: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SKILLS */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs">
                  Abilita o disabilita le capacità autonome dell'assistente JARVIS:
                </p>
                <div className="space-y-2.5">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="font-semibold text-slate-200">{skill.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            v{skill.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{skill.description}</p>
                      </div>

                      <button
                        onClick={() => handleToggleSkill(skill.id, skill.enabled)}
                        className={`px-4 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                          skill.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {skill.enabled ? 'Attiva' : 'Disattivata'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MCP */}
            {activeTab === 'mcp' && (
              <div className="space-y-6">
                {/* Add MCP Server Form */}
                <form onSubmit={handleAddMcpServer} className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                  <span className="font-semibold text-slate-200 text-xs font-mono uppercase text-cyan-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Aggiungi Server MCP
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome server (es. Filesystem, Browser...)"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 outline-none"
                    />
                    <select
                      value={newMcpTransport}
                      onChange={(e: any) => setNewMcpTransport(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono outline-none"
                    >
                      <option value="stdio">stdio (Comando Locale)</option>
                      <option value="sse">Streamable HTTP / SSE</option>
                    </select>
                  </div>

                  {newMcpTransport === 'stdio' ? (
                    <input
                      type="text"
                      placeholder="Comando CLI (es. npx @modelcontextprotocol/server-filesystem ./)"
                      value={newMcpCommand}
                      onChange={(e) => setNewMcpCommand(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="URL Endpoint SSE (es. http://localhost:8080/sse)"
                      value={newMcpUrl}
                      onChange={(e) => setNewMcpUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono outline-none"
                    />
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    Registra Server MCP
                  </button>
                </form>

                {/* List of MCP servers */}
                <div className="space-y-2">
                  <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px] block">
                    Server MCP Registrati ({mcpServers.length})
                  </span>
                  {mcpServers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-slate-500 text-center">
                      Nessun server MCP collegato.
                    </div>
                  ) : (
                    mcpServers.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{s.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 uppercase text-cyan-300">
                              {s.transport}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.tools_count} tools attivi
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestMcp(s.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                          >
                            Test & Discovery
                          </button>
                          <button
                            onClick={() => handleDeleteMcp(s.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: GOOGLE */}
            {activeTab === 'google' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">Google Workspace OAuth 2.0</span>
                    {integrations?.google.is_connected ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                        ● Google Collegato
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono">
                        Non Connesso
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Collega il tuo account Google per permettere a JARVIS di consultare e gestire Gmail, Calendar, Drive, Docs, Sheets, Tasks e YouTube.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 text-[11px]">Google OAuth Client ID</label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 text-[11px]">Google OAuth Client Secret</label>
                    <input
                      type="password"
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      placeholder="GOCSPX-xxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveGoogle}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Salva Credenziali
                    </button>
                    <button
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                    >
                      Connetti Account Google
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GITHUB */}
            {activeTab === 'github' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">GitHub Integration</span>
                    {integrations?.github.is_connected ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                        ● GitHub Collegato ({integrations.github.user_info.login})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono">
                        Non Connesso
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Permette a JARVIS di cercare repository, leggere codice, gestire issue e creare Pull Request.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-slate-400 text-[11px]">GitHub Personal Access Token (PAT)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubGithubToken(e.target.value)}
                      placeholder="ghp_xxxx..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 outline-none"
                    />
                    <button
                      onClick={handleSaveGithub}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                    >
                      Collega
                    </button>
                  </div>
                  {githubMsg && <p className="text-xs text-cyan-300 font-mono mt-1">{githubMsg}</p>}
                </div>
              </div>
            )}

            {/* TAB: MEMORY */}
            {activeTab === 'memory' && (
              <div className="space-y-5">
                {/* Add Memory Form */}
                <form onSubmit={handleAddMemory} className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                  <span className="font-semibold text-cyan-300 font-mono text-xs uppercase flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Aggiungi Memoria Manuale
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Chiave (es. user_timezone)"
                      value={newMemKey}
                      onChange={(e) => setNewMemKey(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Valore (es. Europe/Rome)"
                      value={newMemVal}
                      onChange={(e) => setNewMemVal(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 outline-none"
                    />
                    <select
                      value={newMemLevel}
                      onChange={(e: any) => setNewMemLevel(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono outline-none"
                    >
                      <option value="global">Global (Tutti i progetti)</option>
                      <option value="project">Project (Progetto)</option>
                      <option value="chat">Chat (Singola chat)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    Salva Memoria
                  </button>
                </form>

                {/* List of Memories */}
                <div className="space-y-2">
                  <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px] block">
                    Memorie Salvate ({memories.length})
                  </span>
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-cyan-300">{m.key}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {m.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{m.value}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMem(m.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <span className="font-semibold text-slate-200 text-sm block">
                    Modalità di Autorizzazione Strumenti
                  </span>
                  <p className="text-slate-400 text-xs">
                    Scegli il livello di controllo sull'esecuzione dei tool da parte di JARVIS:
                  </p>

                  <div className="space-y-2">
                    {[
                      {
                        id: 'balanced',
                        title: 'Bilanciata (Consigliata)',
                        desc: 'Le operazioni di lettura (READ) e scrittura ordinaria (WRITE) sono automatiche. Le operazioni distruttive (DESTRUCTIVE, eliminazione file o comandi shell critici) richiedono conferma interattiva.',
                      },
                      {
                        id: 'strict',
                        title: 'Rigida (Massima Sicurezza)',
                        desc: 'Tutte le operazioni che modificano lo stato (WRITE e DESTRUCTIVE) richiedono approvazione esplicita.',
                      },
                      {
                        id: 'permissive',
                        title: 'Permissiva (Sviluppo Autonomo)',
                        desc: 'Tutti i tool vengono eseguiti automaticamente senza interruzioni.',
                      },
                    ].map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => handleSaveSecurityMode(mode.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          securityMode === mode.id
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                            : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">{mode.title}</span>
                          {securityMode === mode.id && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{mode.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono text-cyan-300">J.A.R.V.I.S. Platform</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">Autonomous AI Personal Assistant</p>
                </div>
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300 space-y-2 text-left">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Core LLM</span>
                    <span className="text-cyan-300 font-mono">Ollama Local Engine</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Protocollo Tool</span>
                    <span className="text-cyan-300 font-mono">Model Context Protocol (MCP)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Database</span>
                    <span className="text-cyan-300 font-mono">SQLite (WAL) + SQLAlchemy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modalità Vocale</span>
                    <span className="text-cyan-300 font-mono">VAD + Holographic 2D Canvas Orb</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
