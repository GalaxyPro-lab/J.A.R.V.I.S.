import React, { useState, useEffect } from 'react';
import {
  Settings,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  Cpu,
  Search,
  Sparkles,
  Wifi,
  WifiOff,
  Mic,
  MicOff
} from 'lucide-react';
import { JarvisOrb } from '../voice/JarvisOrb';
import { OllamaStatus, AssistantState } from '../../types';
import { getOllamaStatus } from '../../services/api';

interface HeaderProps {
  projectName?: string;
  chatTitle?: string;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onToggleVoiceMode: () => void;
  isVoiceActive: boolean;
  assistantState: AssistantState;
  voiceVolume: number;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  isRightDrawerOpen: boolean;
  onToggleRightDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName = 'JARVIS Core',
  chatTitle = 'Nuova chat',
  selectedModel,
  onSelectModel,
  onToggleVoiceMode,
  isVoiceActive,
  assistantState,
  voiceVolume,
  onOpenSettings,
  onOpenSearch,
  isRightDrawerOpen,
  onToggleRightDrawer,
}) => {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const checkStatus = async () => {
    try {
      const data = await getOllamaStatus();
      setOllamaStatus(data);
      if (data.models && data.models.length > 0 && !selectedModel) {
        onSelectModel(data.models[0].name);
      }
    } catch (e) {
      setOllamaStatus({
        status: {
          online: false,
          url: 'http://localhost:11434',
          models_count: 0,
          models: [],
          message: 'Ollama offline'
        },
        models: []
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = ollamaStatus?.status?.online ?? false;

  return (
    <header className="h-20 px-5 flex items-center justify-between border-b border-cyan-500/20 bg-[#0a0f1d]/85 backdrop-blur-xl z-20 select-none">
      {/* Left: Project and Chat Title Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span className="font-semibold text-sm text-slate-200 truncate">{projectName}</span>
        </div>
        <span className="text-slate-600 font-mono text-sm">/</span>
        <span className="text-sm text-slate-400 font-medium truncate max-w-[200px]">{chatTitle}</span>
      </div>

      {/* Center: Interactive Prominent JARVIS Holographic Orb */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center gap-3">
          <JarvisOrb
            state={assistantState}
            volume={voiceVolume}
            size="sm"
            onClick={onToggleVoiceMode}
            interactive={true}
          />
          
          <div
            onClick={onToggleVoiceMode}
            className={`cursor-pointer px-3 py-1 rounded-full border transition-all flex items-center gap-2 text-xs font-mono font-semibold ${
              isVoiceActive
                ? assistantState === 'LISTENING'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-pulse'
                  : assistantState === 'SPEAKING'
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300'
            }`}
          >
            {isVoiceActive ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>
                  {assistantState === 'LISTENING'
                    ? 'ASCOLTO ATTIVO'
                    : assistantState === 'PROCESSING'
                    ? 'ELABORAZIONE...'
                    : assistantState === 'SPEAKING'
                    ? 'JARVIS PARLA...'
                    : 'VOCE ATTIVA'}
                </span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
                <span>ATTIVA VOCE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Model Picker, Status, Search, Settings, Drawer */}
      <div className="flex items-center gap-2.5">
        {/* Model Selector Dropdown with Online Indicator */}
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-mono text-slate-200 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[120px] truncate">{selectedModel || 'llama3.2'}</span>
            
            {/* Online/Offline Status Dot */}
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
              }`}
              title={isOnline ? 'Ollama Online' : 'Ollama Offline'}
            />
            
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0e1627] border border-cyan-500/30 shadow-2xl p-2 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2">
              <div className="px-2 py-1.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">Modelli Ollama</span>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1 max-h-48 overflow-y-auto custom-scrollbar">
                {ollamaStatus?.models && ollamaStatus.models.length > 0 ? (
                  ollamaStatus.models.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => {
                        onSelectModel(m.name);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-cyan-950/60 transition-colors ${
                        selectedModel === m.name ? 'text-cyan-300 font-semibold bg-cyan-950/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {m.details?.parameter_size || `${(m.size / 1024 / 1024 / 1024).toFixed(1)} GB`}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-center text-slate-400 text-[11px]">
                    {isOnline ? 'Nessun modello trovato in Ollama' : 'Ollama non raggiungibile (localhost:11434)'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Search (Ctrl+K) */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Cerca (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Impostazioni"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Right Drawer Toggle */}
        <button
          onClick={onToggleRightDrawer}
          className={`p-2 rounded-lg border transition-colors ${
            isRightDrawerOpen
              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
              : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-cyan-500/40'
          }`}
          title="Pannello Contesto & Tools"
        >
          {isRightDrawerOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
