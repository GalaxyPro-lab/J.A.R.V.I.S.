import React, { useEffect, useRef } from 'react';
import { Sparkles, Bot, Globe, Code, Calendar, Shield, Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Message, AssistantState } from '../../types';
import { ChatMessage } from './ChatMessage';
import { JarvisOrb } from '../voice/JarvisOrb';
import { ToolCallBadge } from './ToolCallBadge';

interface ChatAreaProps {
  messages: Message[];
  streamingContent?: string;
  streamingStatus?: string;
  streamingTools?: any[];
  pendingApproval?: any;
  onApproveTool?: (logId: string) => void;
  onRejectTool?: (logId: string) => void;
  onQuickPrompt?: (prompt: string) => void;
  onOpenVoiceMode: () => void;
  projectTitle?: string;
  chatTitle?: string;
  // Voice Chat Props
  isVoiceChat?: boolean;
  isVoiceActive?: boolean;
  assistantState?: AssistantState;
  voiceVolume?: number;
  isMicMuted?: boolean;
  isSpeakerMuted?: boolean;
  voiceTranscript?: string;
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
  onEndVoiceCall?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  streamingContent,
  streamingStatus,
  streamingTools = [],
  pendingApproval,
  onApproveTool,
  onRejectTool,
  onQuickPrompt,
  onOpenVoiceMode,
  projectTitle = 'JARVIS Core',
  chatTitle = 'Nuova chat',
  // Voice Chat Props
  isVoiceChat = false,
  isVoiceActive = false,
  assistantState = 'IDLE',
  voiceVolume = 0,
  isMicMuted = false,
  isSpeakerMuted = false,
  voiceTranscript = '',
  onToggleMic,
  onToggleSpeaker,
  onEndVoiceCall,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, streamingStatus, streamingTools]);

  const quickPrompts = [
    {
      icon: Globe,
      label: 'Ricerca Web in Tempo Reale',
      prompt: 'Cerca sul web le ultime novità sullo sviluppo dei modelli open-source locali.',
    },
    {
      icon: Code,
      label: 'Analisi & Scrittura Codice',
      prompt: 'Crea uno script Python asincrono con FastAPI per gestire una pipeline di elaborazione dati.',
    },
    {
      icon: Calendar,
      label: 'Integrazione Google & GitHub',
      prompt: 'Controlla gli eventi sul mio Google Calendar e verifica i repository GitHub attivi.',
    },
    {
      icon: Shield,
      label: 'Gestione Memoria & Preferenze',
      prompt: 'Ricorda nelle preferenze globali che preferisco codice TypeScript moderno e risposte strutturate.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
      {messages.length === 0 && !streamingContent && streamingTools.length === 0 ? (
        /* Empty State / Welcome Screen */
        <div className="my-auto flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Tripled JARVIS Orb — Huge Hero Orb */}
          <div className="relative group cursor-pointer" onClick={onOpenVoiceMode}>
            <JarvisOrb size="xl" interactive={true} state={assistantState} volume={voiceVolume} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>J.A.R.V.I.S. ONLINE & READY</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">
              Come posso assisterti oggi, Signore?
            </h2>
            <p className="text-sm text-slate-400 max-w-lg">
              Motore Ollama locale, Model Context Protocol (MCP), Skills modulari, memoria persistente su 3 livelli e modalità vocale continua.
            </p>
          </div>

          {/* Quick Prompt Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
            {quickPrompts.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onQuickPrompt?.(qp.prompt)}
                  className="p-3.5 rounded-xl text-left bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all group flex items-start gap-3 shadow-sm hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                >
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-cyan-300 transition-colors">
                      {qp.label}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-2 leading-snug mt-0.5">
                      {qp.prompt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Conversation Feed */
        <div className="divide-y divide-slate-800/40 pb-6">
          {/* Voice Chat: Large Orb Header with Controls */}
          {isVoiceChat && (
            <div className="flex flex-col items-center gap-4 py-6 px-6 bg-gradient-to-b from-[#0a0f1d]/90 to-transparent border-b border-cyan-500/20">
              <JarvisOrb
                state={isVoiceActive ? assistantState : 'IDLE'}
                volume={voiceVolume}
                size="lg"
                interactive={true}
                onClick={onToggleMic}
              />

              {/* Live Voice Status */}
              <div className="text-center min-h-[40px]">
                {isVoiceActive && assistantState === 'LISTENING' && (
                  <p className="text-cyan-300/90 text-sm font-medium animate-pulse">
                    {voiceTranscript || 'Sto ascoltando... Parla liberamente'}
                  </p>
                )}
                {isVoiceActive && assistantState === 'PROCESSING' && (
                  <p className="text-purple-300 text-sm font-medium animate-pulse">
                    JARVIS sta elaborando la richiesta...
                  </p>
                )}
                {isVoiceActive && assistantState === 'SPEAKING' && (
                  <p className="text-slate-200 text-sm italic">JARVIS sta rispondendo...</p>
                )}
                {!isVoiceActive && (
                  <p className="text-slate-500 text-xs font-mono">
                    Clicca l'Orb o usa i controlli per attivare il microfono
                  </p>
                )}
              </div>

              {/* Voice Controls */}
              <div className="flex items-center gap-4">
                {/* Mic Toggle */}
                <button
                  onClick={onToggleMic}
                  className={`p-3 rounded-full border transition-all duration-200 ${
                    isMicMuted || !isVoiceActive
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  }`}
                  title={isMicMuted || !isVoiceActive ? 'Riattiva microfono' : 'Disattiva microfono'}
                >
                  {isMicMuted || !isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={onToggleSpeaker}
                  className={`p-3 rounded-full border transition-all duration-200 ${
                    isSpeakerMuted
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300'
                  }`}
                  title={isSpeakerMuted ? 'Riattiva audio assistente' : 'Muta voce assistente'}
                >
                  {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* End Voice Session */}
                {isVoiceActive && (
                  <button
                    onClick={onEndVoiceCall}
                    className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:scale-105 active:scale-95 transition-all"
                    title="Termina sessione vocale"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onApproveTool={onApproveTool}
              onRejectTool={onRejectTool}
            />
          ))}

          {/* Dynamic In-Flight Tool Calls */}
          {streamingTools.length > 0 && (
            <div className="py-4 px-6 bg-[#0c1222]/30 border-y border-cyan-500/10 space-y-2">
              {streamingTools.map((t, idx) => (
                <ToolCallBadge
                  key={idx}
                  toolName={t.toolName}
                  args={t.args}
                  result={t.result}
                  status={t.status}
                  permissionLevel={t.permissionLevel}
                  onApprove={t.toolLogId && onApproveTool ? () => onApproveTool(t.toolLogId) : undefined}
                  onReject={t.toolLogId && onRejectTool ? () => onRejectTool(t.toolLogId) : undefined}
                />
              ))}
            </div>
          )}

          {/* Pending Confirmation Approval Banner */}
          {pendingApproval && (
            <div className="py-4 px-6 bg-rose-950/20 border-y border-rose-500/30">
              <ToolCallBadge
                toolName={pendingApproval.toolName}
                args={pendingApproval.arguments}
                status="pending"
                permissionLevel="DESTRUCTIVE"
                onApprove={() => onApproveTool?.(pendingApproval.logId)}
                onReject={() => onRejectTool?.(pendingApproval.logId)}
              />
            </div>
          )}

          {/* Active Streaming Assistant Response Bubble */}
          {streamingContent && (
            <ChatMessage
              message={{
                id: 'streaming-asst',
                role: 'assistant',
                content: streamingContent,
                created_at: new Date().toISOString(),
              }}
              isLastAssistantMessage={true}
            />
          )}

          {/* Status Badge (Thinking / Processing) */}
          {streamingStatus && (
            <div className="px-6 py-3 flex items-center gap-2.5 text-xs font-mono text-cyan-400/90 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span>
                {streamingStatus === 'thinking'
                  ? 'JARVIS sta elaborando la risposta...'
                  : streamingStatus === 'executing_tools'
                  ? '⚡ Esecuzione strumenti in corso...'
                  : streamingStatus}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
