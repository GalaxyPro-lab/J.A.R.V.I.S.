import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { JarvisOrb } from './JarvisOrb';
import { voiceManager } from '../../services/voice';
import { streamMessage } from '../../services/api';
import { AssistantState } from '../../types';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  projectName?: string;
  chatTitle?: string;
  onMessageAdded?: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  chatId,
  projectName = 'JARVIS Core',
  chatTitle = 'Nuova chat',
  onMessageAdded,
}) => {
  const [state, setState] = useState<AssistantState>('IDLE');
  const [volume, setVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantSpeech, setAssistantSpeech] = useState<string>('');
  const [callSeconds, setCallSeconds] = useState<number>(0);

  // Call timer
  useEffect(() => {
    let interval: any;
    if (isOpen) {
      setCallSeconds(0);
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup VoiceManager lifecycle
  useEffect(() => {
    if (!isOpen) {
      voiceManager.stopListening();
      voiceManager.stopSpeaking();
      return;
    }

    voiceManager.onVolumeChange = (vol) => {
      setVolume(vol);
    };

    voiceManager.onStateChange = (newState) => {
      setState(newState);
    };

    voiceManager.onTranscript = (text, isFinal) => {
      setTranscript(text);
      if (isFinal && text.trim().length > 1) {
        handleUserSpokenMessage(text.trim());
      }
    };

    voiceManager.onError = (err) => {
      console.warn('Voice error in modal:', err);
    };

    // Auto-start listening
    voiceManager.startListening();

    return () => {
      voiceManager.stopListening();
      voiceManager.stopSpeaking();
    };
  }, [isOpen, chatId]);

  const handleUserSpokenMessage = async (userPrompt: string) => {
    setState('PROCESSING');
    setTranscript(`"${userPrompt}"`);
    let fullResponse = '';

    await streamMessage(
      chatId,
      userPrompt,
      [],
      undefined,
      {
        onToken: (_delta, content) => {
          fullResponse = content;
          setAssistantSpeech(content);
        },
        onDone: () => {
          onMessageAdded?.();
          if (!isSpeakerMuted && fullResponse) {
            voiceManager.speak(fullResponse);
          } else {
            setState('LISTENING');
          }
        },
        onError: (err) => {
          setAssistantSpeech(`Errore: ${err}`);
          setState('ERROR');
        }
      }
    );
  };

  const toggleMute = () => {
    if (isMuted) {
      voiceManager.startListening();
      setIsMuted(false);
    } else {
      voiceManager.stopListening();
      setIsMuted(true);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    if (!isSpeakerMuted) {
      voiceManager.stopSpeaking();
    }
  };

  const handleHangup = () => {
    voiceManager.stopListening();
    voiceManager.stopSpeaking();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl"
      >
        {/* Background futuristic grid & glow aura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.15)_0,transparent_70%)] pointer-events-none" />

        <div className="relative w-full max-w-xl mx-4 flex flex-col items-center justify-between min-h-[580px] p-8 rounded-3xl bg-[#0a0f1d]/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
          {/* Header Info */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>JARVIS VOICE LINK ACTIVE</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100">{projectName}</h2>
            <p className="text-xs text-slate-400 font-mono">{chatTitle}</p>
            <div className="inline-block px-3 py-1 mt-2 rounded-full bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 font-mono text-sm tracking-wider">
              {formatTimer(callSeconds)}
            </div>
          </div>

          {/* Central Animated Orb */}
          <div className="my-6 relative flex flex-col items-center">
            <JarvisOrb state={state} volume={volume} size="lg" interactive={false} />

            {/* Live Subtitle / Status Display */}
            <div className="mt-6 text-center max-w-md px-4 min-h-[60px] flex flex-col items-center justify-center">
              {state === 'LISTENING' && (
                <p className="text-cyan-300/90 text-sm font-medium animate-pulse">
                  {transcript ? transcript : 'Sto ascoltando... Parla liberamente'}
                </p>
              )}
              {state === 'PROCESSING' && (
                <p className="text-purple-300 text-sm font-medium animate-pulse">
                  JARVIS sta elaborando la richiesta...
                </p>
              )}
              {state === 'SPEAKING' && (
                <p className="text-slate-200 text-sm italic line-clamp-3">
                  "{assistantSpeech}"
                </p>
              )}
              {state === 'IDLE' && (
                <p className="text-slate-400 text-sm">Microfono in pausa</p>
              )}
            </div>
          </div>

          {/* Bottom Call Controls (Mute, Hang Up, Speaker) */}
          <div className="flex items-center justify-center gap-6 w-full pt-4 border-t border-slate-800/80">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full border transition-all duration-200 ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300'
              }`}
              title={isMuted ? 'Riattiva microfono' : 'Disattiva microfono'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Hang Up Button */}
            <button
              onClick={handleHangup}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
              title="Termina chiamata"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={toggleSpeaker}
              className={`p-4 rounded-full border transition-all duration-200 ${
                isSpeakerMuted
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300'
              }`}
              title={isSpeakerMuted ? 'Riattiva audio assistente' : 'Muta voce assistente'}
            >
              {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
