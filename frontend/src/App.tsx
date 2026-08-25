import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightDrawer } from './components/layout/RightDrawer';
import { ChatArea } from './components/chat/ChatArea';
import { ChatInput } from './components/chat/ChatInput';
import { SettingsModal } from './components/settings/SettingsModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { SearchModal } from './components/modals/SearchModal';
import {
  Project,
  Chat,
  Message,
  SkillItem,
  MCPServerItem,
  MemoryItem,
  Attachment,
  OllamaStatus,
  AssistantState
} from './types';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchChat,
  createChat,
  updateChat,
  deleteChat,
  streamMessage,
  resolveToolApproval,
  fetchSkills,
  fetchMCPServers,
  fetchMemories,
  getOllamaStatus
} from './services/api';
import { voiceManager } from './services/voice';

export function App() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Voice Chats Registry (chat IDs marked as voice chats)
  const [voiceChatIds, setVoiceChatIds] = useState<Set<string>>(new Set());

  // Streaming State
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingStatus, setStreamingStatus] = useState('');
  const [streamingTools, setStreamingTools] = useState<any[]>([]);
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'project' | 'chat';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'project',
    id: '',
    name: '',
  });

  // Aux Data
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServerItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  // Persist voiceChatIds to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('jarvis_voice_chat_ids');
    if (stored) {
      try {
        setVoiceChatIds(new Set(JSON.parse(stored)));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jarvis_voice_chat_ids', JSON.stringify([...voiceChatIds]));
  }, [voiceChatIds]);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [projList, skList, mcpList, memList, olStatus] = await Promise.all([
        fetchProjects(),
        fetchSkills(),
        fetchMCPServers(),
        fetchMemories(),
        getOllamaStatus()
      ]);

      setProjects(projList);
      setSkills(skList);
      setMcpServers(mcpList);
      setMemories(memList);
      setOllamaStatus(olStatus);

      if (olStatus?.models && olStatus.models.length > 0) {
        setSelectedModel(olStatus.models[0].name);
      }

      // Auto-select first project & first chat
      if (projList.length > 0) {
        const firstP = projList[0];
        setActiveProjectId(firstP.id);
        if (firstP.chats && firstP.chats.length > 0) {
          const firstC = firstP.chats[0];
          setActiveChatId(firstC.id);
          const cData = await fetchChat(firstC.id);
          setCurrentChat(cData);
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Setup Voice Callbacks
  useEffect(() => {
    voiceManager.onVolumeChange = (vol) => {
      setVoiceVolume(vol);
    };

    voiceManager.onStateChange = (state) => {
      setAssistantState(state);
    };

    voiceManager.onTranscript = (text, isFinal) => {
      setVoiceTranscript(text);
      if (isFinal && text.trim().length > 1) {
        handleSendMessage(text.trim());
      }
    };

    return () => {
      voiceManager.stopListening();
      voiceManager.stopSpeaking();
    };
  }, [activeChatId, activeProjectId, projects, selectedModel]);

  // ===================== VOICE CHAT MANAGEMENT =====================

  const isCurrentChatVoice = activeChatId ? voiceChatIds.has(activeChatId) : false;

  /** Build the list of voice chats for the sidebar */
  const voiceChatsList: { id: string; title: string; projectId: string; created_at?: string }[] = [];
  for (const proj of projects) {
    for (const chat of (proj.chats || [])) {
      if (voiceChatIds.has(chat.id)) {
        voiceChatsList.push({
          id: chat.id,
          title: chat.title,
          projectId: proj.id,
          created_at: chat.created_at,
        });
      }
    }
  }

  /** Create a new voice chat under the active project (or first project) */
  const handleCreateVoiceChat = async () => {
    try {
      let pId = activeProjectId;
      if (!pId) {
        if (projects.length > 0) {
          pId = projects[0].id;
        } else {
          const pRes = await createProject({
            name: 'JARVIS Core',
            description: 'Ambiente principale assistente',
            model: selectedModel,
            enabled_skills: skills.map((s) => s.id),
            enabled_mcp_servers: [],
          });
          pId = pRes.id;
        }
        setActiveProjectId(pId);
      }
      if (!pId) return;

      const now = new Date();
      const title = `Voce ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
      const cRes = await createChat(pId, title, selectedModel);
      const chatId = cRes.id as string;

      setVoiceChatIds((prev) => new Set([...prev, chatId]));
      setActiveChatId(chatId);
      setActiveProjectId(pId);

      const updatedProj = await fetchProjects();
      setProjects(updatedProj);
      const cData = await fetchChat(chatId);
      setCurrentChat(cData);

      // Auto-start voice
      startVoice();
    } catch (e) {
      console.error('Failed to create voice chat:', e);
    }
  };

  const handleSelectVoiceChat = async (chatId: string) => {
    setActiveChatId(chatId);
    try {
      const cData = await fetchChat(chatId);
      setCurrentChat(cData);
      if (cData.project_id) {
        setActiveProjectId(cData.project_id);
      }
    } catch (e) {
      console.error('Failed to load voice chat:', e);
    }
  };

  // ===================== VOICE CONTROLS =====================

  const startVoice = () => {
    voiceManager.startListening();
    setIsVoiceActive(true);
    setIsMicMuted(false);
    setAssistantState('LISTENING');
  };

  const stopVoice = () => {
    voiceManager.stopListening();
    voiceManager.stopSpeaking();
    setIsVoiceActive(false);
    setIsMicMuted(false);
    setAssistantState('IDLE');
  };

  /** Toggle voice mode. If on hero page or header, creates a voice chat. If already in a voice chat, toggles mic. */
  const toggleVoiceMode = () => {
    if (isVoiceActive) {
      stopVoice();
    } else {
      // If we're already in a voice chat, just start mic
      if (isCurrentChatVoice) {
        startVoice();
      } else {
        // Create a new voice chat
        handleCreateVoiceChat();
      }
    }
  };

  const toggleMic = () => {
    if (isMicMuted || !isVoiceActive) {
      voiceManager.startListening();
      setIsMicMuted(false);
      setIsVoiceActive(true);
      setAssistantState('LISTENING');
    } else {
      voiceManager.stopListening();
      setIsMicMuted(true);
      setAssistantState('IDLE');
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    if (!isSpeakerMuted) {
      voiceManager.stopSpeaking();
    }
  };

  const endVoiceCall = () => {
    stopVoice();
  };

  // Load chat when activeChatId changes
  const handleSelectChat = async (chatId: string) => {
    // When switching away from a voice chat, stop voice
    if (isVoiceActive && activeChatId && voiceChatIds.has(activeChatId) && chatId !== activeChatId) {
      stopVoice();
    }
    setActiveChatId(chatId);
    try {
      const cData = await fetchChat(chatId);
      setCurrentChat(cData);
      if (cData.project_id) {
        setActiveProjectId(cData.project_id);
      }
    } catch (e) {
      console.error('Failed to load chat:', e);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const p = projects.find((proj) => proj.id === projectId);
    if (p && p.chats && p.chats.length > 0) {
      handleSelectChat(p.chats[0].id);
    } else {
      setActiveChatId(null);
      setCurrentChat(null);
    }
  };

  // Create New Project
  const handleCreateProject = async (data: {
    name: string;
    description: string;
    model: string;
    system_instructions: string;
    enabled_skills: string[];
    enabled_mcp_servers: string[];
  }) => {
    try {
      const res = await createProject(data);
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      setActiveProjectId(res.id);
      if (res.first_chat_id) {
        handleSelectChat(res.first_chat_id);
      }
    } catch (e) {
      console.error('Error creating project:', e);
    }
  };

  // Create New Chat
  const handleCreateNewChat = async (projectId: string) => {
    try {
      const res = await createChat(projectId, 'Nuova chat', selectedModel);
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      handleSelectChat(res.id);
    } catch (e) {
      console.error('Error creating chat:', e);
    }
  };

  // Rename Chat
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await updateChat(chatId, { title: newTitle });
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat({ ...currentChat, title: newTitle });
      }
    } catch (e) {
      console.error('Error renaming chat:', e);
    }
  };

  // Delete Project Confirm
  const handleDeleteProjectConfirmed = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteProject(deleteConfirm.id);
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      if (updatedProjects.length > 0) {
        handleSelectProject(updatedProjects[0].id);
      } else {
        setActiveProjectId(null);
        setActiveChatId(null);
        setCurrentChat(null);
      }
    } catch (e) {
      console.error('Error deleting project:', e);
    }
  };

  // Delete Chat Confirm
  const handleDeleteChatConfirmed = async () => {
    if (!deleteConfirm.id) return;
    try {
      // Remove from voice chat registry too
      setVoiceChatIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirm.id);
        return next;
      });

      await deleteChat(deleteConfirm.id);
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      const currentProj = updatedProjects.find((p) => p.id === activeProjectId);
      if (currentProj && currentProj.chats && currentProj.chats.length > 0) {
        handleSelectChat(currentProj.chats[0].id);
      } else {
        setActiveChatId(null);
        setCurrentChat(null);
      }
    } catch (e) {
      console.error('Error deleting chat:', e);
    }
  };

  // Send Message & Stream (Auto-creates project and chat if none exist)
  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    let targetChatId = activeChatId;

    // Auto-create Project and Chat if user writes with none selected
    if (!targetChatId) {
      try {
        let pId = activeProjectId;
        if (!pId) {
          if (projects.length > 0) {
            pId = projects[0].id;
          } else {
            const pRes = await createProject({
              name: 'JARVIS Core',
              description: 'Ambiente principale assistente',
              model: selectedModel,
              enabled_skills: skills.map((s) => s.id),
              enabled_mcp_servers: []
            });
            pId = pRes.id;
          }
          setActiveProjectId(pId);
        }

        if (!pId) return;
        const cRes = await createChat(pId, 'Nuova chat', selectedModel);
        targetChatId = cRes.id as string;
        setActiveChatId(targetChatId);

        const updatedProj = await fetchProjects();
        setProjects(updatedProj);
        const cData = await fetchChat(targetChatId);
        setCurrentChat(cData);
      } catch (err) {
        console.error('Failed to auto-create project/chat:', err);
        return;
      }
    }

    if (!targetChatId) return;

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      attachments,
      created_at: new Date().toISOString(),
    };

    setCurrentChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null
    );

    setIsGenerating(true);
    setStreamingContent('');
    setStreamingStatus('thinking');
    setStreamingTools([]);
    setPendingApproval(null);
    if (isVoiceActive) {
      setAssistantState('PROCESSING');
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    await streamMessage(
      targetChatId,
      content,
      attachments,
      selectedModel,
      {
        onToken: (_delta, fullContent) => {
          accumulatedContent = fullContent;
          setStreamingStatus('');
          setStreamingContent(fullContent);
        },
        onStatus: (status) => {
          setStreamingStatus(status);
        },
        onToolStart: (toolName, args, permLevel) => {
          setStreamingTools((prev) => [
            ...prev,
            { toolName, args, status: 'pending', permissionLevel: permLevel },
          ]);
        },
        onToolResult: (toolName, result, status) => {
          setStreamingTools((prev) =>
            prev.map((t) => (t.toolName === toolName ? { ...t, result, status } : t))
          );
        },
        onApprovalRequired: (toolName, args, logId, message) => {
          setPendingApproval({ toolName, arguments: args, logId, message });
        },
        onDone: async () => {
          setIsGenerating(false);
          setStreamingContent('');
          setStreamingStatus('');
          setStreamingTools([]);
          setPendingApproval(null);

          // Refresh full chat messages
          const cData = await fetchChat(targetChatId!);
          setCurrentChat(cData);

          // If voice mode is active, speak the assistant's response aloud
          if (isVoiceActive && accumulatedContent && !isSpeakerMuted) {
            setAssistantState('SPEAKING');
            voiceManager.speak(accumulatedContent, () => {
              if (isVoiceActive) {
                setAssistantState('LISTENING');
                setVoiceTranscript('');
              }
            });
          } else if (isVoiceActive) {
            setAssistantState('LISTENING');
            setVoiceTranscript('');
          }
        },
        onError: (err) => {
          setIsGenerating(false);
          setStreamingStatus(`Errore: ${err}`);
          if (isVoiceActive) {
            setAssistantState('ERROR');
          }
        },
      },
      controller.signal
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setStreamingStatus('Generazione interrotta.');
    }
  };

  // Tool Approval Actions
  const handleApproveTool = async (logId: string) => {
    await resolveToolApproval(logId, true);
    setPendingApproval(null);
  };

  const handleRejectTool = async (logId: string) => {
    await resolveToolApproval(logId, false);
    setPendingApproval(null);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060a12] text-slate-100 jarvis-grid-bg">
      {/* 1. Left Sidebar: Projects, Voice Chats, and Text Chats */}
      <LeftSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        activeChatId={activeChatId}
        onSelectProject={handleSelectProject}
        onSelectChat={handleSelectChat}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onCreateNewChat={handleCreateNewChat}
        onRenameChat={handleRenameChat}
        onDeleteProjectClick={(p) =>
          setDeleteConfirm({
            isOpen: true,
            type: 'project',
            id: p.id,
            name: p.name,
          })
        }
        onDeleteChatClick={(cId, title) =>
          setDeleteConfirm({
            isOpen: true,
            type: 'chat',
            id: cId,
            name: title,
          })
        }
        onOpenSearch={() => setIsSearchOpen(true)}
        voiceChats={voiceChatsList}
        onSelectVoiceChat={handleSelectVoiceChat}
        onCreateVoiceChat={handleCreateVoiceChat}
      />

      {/* 2. Center Main Layout: Header, Chat Area, Glass Input */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          projectName={activeProject?.name}
          chatTitle={currentChat?.title}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onToggleVoiceMode={toggleVoiceMode}
          isVoiceActive={isVoiceActive}
          assistantState={assistantState}
          voiceVolume={voiceVolume}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isRightDrawerOpen={isRightDrawerOpen}
          onToggleRightDrawer={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        />

        {/* Chat Feed */}
        <ChatArea
          messages={currentChat?.messages || []}
          streamingContent={streamingContent}
          streamingStatus={streamingStatus}
          streamingTools={streamingTools}
          pendingApproval={pendingApproval}
          onApproveTool={handleApproveTool}
          onRejectTool={handleRejectTool}
          onQuickPrompt={(prompt) => handleSendMessage(prompt)}
          onOpenVoiceMode={toggleVoiceMode}
          projectTitle={activeProject?.name}
          chatTitle={currentChat?.title}
          // Voice Chat Props
          isVoiceChat={isCurrentChatVoice}
          isVoiceActive={isVoiceActive}
          assistantState={assistantState}
          voiceVolume={voiceVolume}
          isMicMuted={isMicMuted}
          isSpeakerMuted={isSpeakerMuted}
          voiceTranscript={voiceTranscript}
          onToggleMic={toggleMic}
          onToggleSpeaker={toggleSpeaker}
          onEndVoiceCall={endVoiceCall}
        />

        {/* Floating Glass Input - Always available to type! */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
          onOpenVoiceMode={toggleVoiceMode}
          selectedModel={selectedModel}
          disabled={false}
        />
      </main>

      {/* 3. Right Drawer: Project Context, Skills, MCP Servers, Memory */}
      <RightDrawer
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        project={activeProject}
        chat={currentChat}
        skills={skills}
        mcpServers={mcpServers}
        memories={memories}
      />

      {/* Comprehensive Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshData={loadInitialData}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        availableSkills={skills}
        availableMcpServers={mcpServers}
        availableModels={ollamaStatus?.models || []}
        defaultModel={selectedModel}
      />

      {/* Global Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProject={handleSelectProject}
        onSelectChat={handleSelectChat}
      />

      {/* Confirm Delete Modal (Cascade Safety) */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={
          deleteConfirm.type === 'project'
            ? handleDeleteProjectConfirmed
            : handleDeleteChatConfirmed
        }
        title={
          deleteConfirm.type === 'project'
            ? `Eliminare il progetto "${deleteConfirm.name}"?`
            : `Eliminare la chat "${deleteConfirm.name}"?`
        }
        message={
          deleteConfirm.type === 'project'
            ? 'Sei sicuro? Eliminando questo progetto verranno eliminate atomicamente tutte le chat, i messaggi, la memoria e i dati temporanei associati.'
            : 'Sei sicuro di voler eliminare questa chat e tutti i messaggi contenuti al suo interno?'
        }
      />
    </div>
  );
}
export default App;
