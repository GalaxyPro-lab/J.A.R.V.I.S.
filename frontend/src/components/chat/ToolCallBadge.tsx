import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Terminal
} from 'lucide-react';

interface ToolCallBadgeProps {
  toolName: string;
  args?: any;
  result?: any;
  status?: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  permissionLevel?: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({
  toolName,
  args,
  result,
  status = 'executed',
  permissionLevel = 'READ',
  onApprove,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getToolDisplayName = (name: string) => {
    if (name === 'web_search') return '⚡ Ricerca Web...';
    if (name === 'fetch_web_page') return '🌐 Analisi Pagina Web...';
    if (name.startsWith('github_')) return `🐙 GitHub: ${name.replace('github_', '')}...`;
    if (name.startsWith('google_')) return `📁 Google: ${name.replace('google_', '')}...`;
    if (name === 'read_file') return `📄 Lettura file: ${args?.path || ''}...`;
    if (name === 'write_file') return `✏️ Scrittura file: ${args?.path || ''}...`;
    if (name === 'execute_terminal_command') return `💻 Comando Terminale: ${args?.command || ''}...`;
    return `◉ Uso tool: ${name}...`;
  };

  const isDestructive = permissionLevel === 'DESTRUCTIVE';

  return (
    <div className="my-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/70 overflow-hidden text-xs font-mono shadow-md">
      {/* Top Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3.5 py-2 cursor-pointer hover:bg-slate-800/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-cyan-300 truncate">{getToolDisplayName(toolName)}</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isDestructive
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : permissionLevel === 'WRITE'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {permissionLevel}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'executed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          {status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {/* Pending Confirmation Box */}
      {status === 'pending' && isDestructive && onApprove && onReject && (
        <div className="p-3 bg-rose-950/40 border-t border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-300 text-[11px]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>L'assistente richiede conferma per eseguire un'operazione distruttiva.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onReject}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={onApprove}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-[0_0_10px_rgba(225,29,72,0.4)] transition-colors"
            >
              Conferma
            </button>
          </div>
        </div>
      )}

      {/* Expandable Details Body */}
      {isOpen && (
        <div className="p-3 border-t border-slate-800 bg-[#070b14]/90 space-y-2 text-[11px]">
          {args && (
            <div>
              <span className="text-slate-500 block mb-1">Argomenti:</span>
              <pre className="p-2 rounded bg-slate-950/80 border border-slate-800 text-slate-300 overflow-x-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div>
              <span className="text-slate-500 block mb-1">Risultato:</span>
              <pre className="p-2 rounded bg-slate-950/80 border border-slate-800 text-emerald-300/90 overflow-x-auto max-h-48">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
