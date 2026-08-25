import React, { useState } from 'react';
import {
  FolderPlus,
  MessageSquarePlus,
  ChevronDown,
  ChevronRight,
  Folder,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Bot,
  Mic
} from 'lucide-react';
import { Project, ChatSummary } from '../../types';

interface LeftSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  activeChatId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectChat: (chatId: string) => void;
  onOpenNewProjectModal: () => void;
  onCreateNewChat: (projectId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteProjectClick: (project: Project) => void;
  onDeleteChatClick: (chatId: string, chatTitle: string) => void;
  onOpenSearch: () => void;
  // Voice Chats
  voiceChats: { id: string; title: string; projectId: string; created_at?: string }[];
  onSelectVoiceChat: (chatId: string) => void;
  onCreateVoiceChat: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  projects,
  activeProjectId,
  activeChatId,
  onSelectProject,
  onSelectChat,
  onOpenNewProjectModal,
  onCreateNewChat,
  onRenameChat,
  onDeleteProjectClick,
  onDeleteChatClick,
  onOpenSearch,
  // Voice Chats
  voiceChats = [],
  onSelectVoiceChat,
  onCreateVoiceChat,
}) => {
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState<string>('');
  const [isVoiceSectionCollapsed, setIsVoiceSectionCollapsed] = useState(false);

  const toggleProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const startRename = (chat: ChatSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingChatId(chat.id);
    setEditChatTitle(chat.title);
  };

  const saveRename = (chatId: string) => {
    if (editChatTitle.trim()) {
      onRenameChat(chatId, editChatTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelRename = () => {
    setEditingChatId(null);
  };

  return (
    <aside className="w-72 flex flex-col h-full bg-[#0a0f1d] border-r border-cyan-500/20 select-none z-10 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider font-mono text-cyan-300">J.A.R.V.I.S.</h1>
            <p className="text-[10px] text-slate-400 font-mono">AI ASSISTANT PLATFORM</p>
          </div>
        </div>
        
        <button
          onClick={onOpenSearch}
          className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Cerca (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons: New Project & New Chat */}
      <div className="p-3 space-y-2 border-b border-slate-800/80">
        <button
          onClick={onOpenNewProjectModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.1)] transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ Nuovo Progetto</span>
        </button>

        {activeProjectId && (
          <button
            onClick={() => onCreateNewChat(activeProjectId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition-all"
          >
            <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
            <span>+ Nuova Chat</span>
          </button>
        )}
      </div>

      {/* Main Scrollable Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        
        {/* ==================== VOICE CHATS SECTION ==================== */}
        {voiceChats.length > 0 && (
          <div className="mb-2">
            <div
              className="flex items-center justify-between text-[11px] font-mono uppercase text-emerald-400 px-2 cursor-pointer hover:text-emerald-300"
              onClick={() => setIsVoiceSectionCollapsed(!isVoiceSectionCollapsed)}
            >
              <div className="flex items-center gap-1.5">
                {isVoiceSectionCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <Mic className="w-3 h-3" />
                <span>CHAT VOCALI</span>
              </div>
              <span className="text-emerald-500/60">{voiceChats.length}</span>
            </div>

            {!isVoiceSectionCollapsed && (
              <div className="mt-1.5 space-y-1">
                {voiceChats.map((vc) => {
                  const isActive = vc.id === activeChatId;
                  return (
                    <div
                      key={vc.id}
                      onClick={() => onSelectVoiceChat(vc.id)}
                      className={`group/vc flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 font-medium shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Mic className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="truncate">{vc.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChatClick(vc.id, vc.title);
                        }}
                        className="ml-auto p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover/vc:opacity-100 transition-opacity"
                        title="Elimina chat vocale"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== PROJECTS SECTION ==================== */}
        <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 px-2">
          <span>PROGETTI</span>
          <span>{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-xs">
            Nessun progetto attivo. Crea il tuo primo progetto per iniziare!
          </div>
        ) : (
          projects.map((project) => {
            const isProjectActive = project.id === activeProjectId;
            const isCollapsed = !!collapsedProjects[project.id];
            const chats = project.chats || [];

            return (
              <div
                key={project.id}
                className={`rounded-xl border transition-all ${
                  isProjectActive
                    ? 'bg-slate-900/60 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                    : 'bg-slate-900/20 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Project Header Item */}
                <div
                  onClick={() => onSelectProject(project.id)}
                  className="group flex items-center justify-between p-2.5 cursor-pointer rounded-t-xl hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={(e) => toggleProject(project.id, e)}
                      className="text-slate-400 hover:text-cyan-300 p-0.5 rounded"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Folder className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-200 truncate">{project.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateNewChat(project.id);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded"
                      title="Aggiungi chat"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProjectClick(project);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded"
                      title="Elimina progetto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nested Chats List */}
                {!isCollapsed && (
                  <div className="pb-1.5 px-1.5 space-y-1">
                    {chats.map((chat) => {
                      const isChatActive = chat.id === activeChatId;
                      const isEditing = editingChatId === chat.id;

                      return (
                        <div
                          key={chat.id}
                          onClick={() => onSelectChat(chat.id)}
                          onDoubleClick={(e) => startRename(chat, e)}
                          className={`group/chat flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                            isChatActive
                              ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 font-medium shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isChatActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                            
                            {isEditing ? (
                              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editChatTitle}
                                  onChange={(e) => setEditChatTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(chat.id);
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                  autoFocus
                                  className="w-full bg-slate-950 border border-cyan-500/60 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none"
                                />
                                <button onClick={() => saveRename(chat.id)} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={cancelRename} className="text-slate-400 hover:text-slate-300 p-0.5">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="truncate">{chat.title}</span>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => startRename(chat, e)}
                                className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                                title="Rinomina chat (o doppio click)"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChatClick(chat.id, chat.title);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded"
                                title="Elimina chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>v1.0.0 Online</span>
        </div>
        <span className="text-[10px] text-slate-500">Autonomous Core</span>
      </div>
    </aside>
  );
};
