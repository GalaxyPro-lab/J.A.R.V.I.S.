import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Database,
  Terminal,
  Shield,
  Layers,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import { Project, Chat, SkillItem, MCPServerItem, MemoryItem } from '../../types';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  chat?: Chat | null;
  skills: SkillItem[];
  mcpServers: MCPServerItem[];
  memories: MemoryItem[];
}

export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onClose,
  project,
  chat,
  skills,
  mcpServers,
  memories,
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'skills' | 'mcp' | 'memory'>('context');

  if (!isOpen) return null;

  const projectSkills = skills.filter(
    (s) => !project?.enabled_skills || project.enabled_skills.length === 0 || project.enabled_skills.includes(s.id)
  );

  return (
    <aside className="w-80 h-full bg-[#0a0f1d] border-l border-cyan-500/20 flex flex-col select-none z-10 flex-shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Context & Capabilities
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'context'
              ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Contesto
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'skills'
              ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Skills ({projectSkills.length})
        </button>
        <button
          onClick={() => setActiveTab('mcp')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'mcp'
              ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          MCP ({mcpServers.length})
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'memory'
              ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Memoria
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* TAB 1: CONTEXT */}
        {activeTab === 'context' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>ISOLAMENTO CONTESTO</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Questa chat opera in un sandbox rigorosamente isolato. Messaggi e contesti di altre chat non sono accessibili.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Progetto Attivo</label>
              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-200 font-medium">
                {project?.name || 'Nessun progetto selezionato'}
              </div>
              {project?.description && (
                <p className="text-slate-400 text-[11px] px-1">{project.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Istruzioni Progetto</label>
              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-300 font-mono text-[11px] max-h-32 overflow-y-auto">
                {project?.system_instructions || 'Nessuna istruzione personalizzata'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Parametri Modello</label>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Temperature</span>
                  <span className="text-cyan-300 font-semibold">{chat?.temperature ?? project?.temperature ?? 0.7}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Top P</span>
                  <span className="text-cyan-300 font-semibold">{chat?.top_p ?? project?.top_p ?? 0.9}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-2.5">
            <p className="text-slate-400 text-[11px]">
              Skills abilitate per questo ambiente. JARVIS può invocare i loro tool in modo autonomo.
            </p>
            {projectSkills.map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">{skill.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                    {skill.tools_count} tools
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{skill.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MCP */}
        {activeTab === 'mcp' && (
          <div className="space-y-2.5">
            <p className="text-slate-400 text-[11px]">
              Server Model Context Protocol (MCP) connessi:
            </p>
            {mcpServers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nessun server MCP configurato. Puoi aggiungerne uno da Impostazioni &gt; MCP Servers.
              </div>
            ) : (
              mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{server.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        server.is_connected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800">{server.transport}</span>
                    <span>{server.tools_count} tools scoperti</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: MEMORY */}
        {activeTab === 'memory' && (
          <div className="space-y-2.5">
            <p className="text-slate-400 text-[11px]">
              Fatti e preferenze caricati nel contesto corrente (3-tier: Global, Project, Chat):
            </p>
            {memories.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nessuna memoria salvata per questo contesto. JARVIS apprende automaticamente o puoi aggiungere note in Impostazioni &gt; Memoria.
              </div>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 text-[11px]">{m.key}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {m.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{m.value}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
