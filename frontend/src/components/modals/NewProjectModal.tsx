import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Server } from 'lucide-react';
import { SkillItem, MCPServerItem, OllamaModel } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    model: string;
    system_instructions: string;
    enabled_skills: string[];
    enabled_mcp_servers: string[];
  }) => void;
  availableSkills: SkillItem[];
  availableMcpServers: MCPServerItem[];
  availableModels: OllamaModel[];
  defaultModel: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableSkills,
  availableMcpServers,
  availableModels,
  defaultModel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState(defaultModel || 'llama3.2');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    availableSkills.map((s) => s.id)
  );
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>(
    availableMcpServers.filter((s) => s.enabled).map((s) => s.id)
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      model,
      system_instructions: systemInstructions.trim(),
      enabled_skills: selectedSkills,
      enabled_mcp_servers: selectedMcpServers,
    });
    setName('');
    setDescription('');
    setSystemInstructions('');
    onClose();
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const toggleMcpServer = (serverId: string) => {
    setSelectedMcpServers((prev) =>
      prev.includes(serverId) ? prev.filter((id) => id !== serverId) : [...prev, serverId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#0c1222] border border-cyan-500/30 p-6 space-y-5 shadow-[0_0_40px_rgba(0,240,255,0.15)] text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Nuovo Progetto</h3>
              <p className="text-xs text-slate-400">Crea un ambiente di lavoro isolato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
              Nome Progetto <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Sviluppo App Mobile, Ricerca Quantum, Finanza..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 outline-none text-slate-100 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
              Descrizione (opzionale)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve scopo o contesto del progetto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 outline-none text-slate-100 text-xs"
            />
          </div>

          {/* Model Selector */}
          <div className="space-y-1">
            <label className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
              Modello Ollama Associato
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 outline-none text-slate-100 text-xs font-mono"
            >
              {availableModels.length > 0 ? (
                availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value="llama3.2">llama3.2 (Default)</option>
              )}
            </select>
          </div>

          {/* System Instructions */}
          <div className="space-y-1">
            <label className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
              Istruzioni Specifiche del Progetto
            </label>
            <textarea
              rows={3}
              value={systemInstructions}
              onChange={(e) => setSystemInstructions(e.target.value)}
              placeholder="Regole, vincoli architetturali o convenzioni che JARVIS dovrà seguire sempre all'interno di questo progetto..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 outline-none text-slate-100 text-xs resize-none"
            />
          </div>

          {/* Skills Checkboxes */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SKILLS ABILITATE</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableSkills.map((skill) => (
                <label
                  key={skill.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedSkills.includes(skill.id)
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/30 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="truncate">{skill.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* MCP Servers Checkboxes */}
          {availableMcpServers.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
                <Server className="w-3.5 h-3.5" />
                <span>SERVER MCP ASSOCIATI</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableMcpServers.map((server) => (
                  <label
                    key={server.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedMcpServers.includes(server.id)
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMcpServers.includes(server.id)}
                      onChange={() => toggleMcpServer(server.id)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="truncate">{server.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
            >
              Crea Progetto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
