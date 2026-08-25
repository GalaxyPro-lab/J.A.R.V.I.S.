import React, { useState, useEffect } from 'react';
import { Search, Folder, MessageSquare, MessageCircle, X, Sparkles } from 'lucide-react';
import { performGlobalSearch } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectChat: (chatId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onSelectChat,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await performGlobalSearch(query);
        setResults(data.results);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Global keydown handler for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasResults =
    results &&
    ((results.projects && results.projects.length > 0) ||
      (results.chats && results.chats.length > 0) ||
      (results.messages && results.messages.length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-[#0c1222] border border-cyan-500/30 overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-100 flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca progetti, chat, argomenti, messaggi..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {isLoading && (
            <div className="p-6 text-center text-slate-400 font-mono animate-pulse">
              Scansione database in corso...
            </div>
          )}

          {!isLoading && !query && (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <Sparkles className="w-6 h-6 text-cyan-400/50 mx-auto" />
              <p>Digita per cercare all'interno di tutto l'archivio JARVIS</p>
            </div>
          )}

          {!isLoading && query && !hasResults && (
            <div className="p-8 text-center text-slate-500">
              Nessun risultato trovato per "{query}"
            </div>
          )}

          {/* Projects Results */}
          {!isLoading && results?.projects && results.projects.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-2">
                PROGETTI ({results.projects.length})
              </span>
              {results.projects.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{p.name}</span>
                      {p.description && <span className="text-[11px] text-slate-400">{p.description}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chats Results */}
          {!isLoading && results?.chats && results.chats.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-2">
                CHAT ({results.chats.length})
              </span>
              {results.chats.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectChat(c.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">{c.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages Results */}
          {!isLoading && results?.messages && results.messages.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-2">
                MESSAGGI ({results.messages.length})
              </span>
              {results.messages.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectChat(m.chat_id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 cursor-pointer space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3 h-3 text-cyan-400" />
                      <span className="uppercase">{m.role}</span>
                    </div>
                    <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2">{m.content_snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
