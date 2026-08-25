import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Cpu
} from 'lucide-react';
import { Attachment } from '../../types';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  onOpenVoiceMode: () => void;
  selectedModel?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  onOpenVoiceMode,
  selectedModel = 'llama3.2',
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && attachments.length === 0) || isGenerating || disabled) return;
    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachments((prev) => [
              ...prev,
              {
                name: `Pasted_Image_${Date.now()}.png`,
                type: file.type,
                size: file.size,
                dataUrl: reader.result as string,
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-gradient-to-t from-[#060a12] via-[#080d18] to-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Main Floating Glass Input Box */}
        <div className="relative rounded-2xl bg-[#0c1322]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.08)] focus-within:border-cyan-400 focus-within:shadow-[0_0_35px_rgba(0,240,255,0.18)] transition-all">
          {/* Attachments Preview Bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-slate-800/80">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/20 text-xs text-slate-300 group"
                >
                  {att.type.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Scrivi un messaggio o chiedi a JARVIS di eseguire un'operazione... (Shift+Enter per andare a capo)"
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent px-4 pt-3.5 pb-2 text-slate-100 placeholder-slate-500 text-sm resize-none outline-none custom-scrollbar min-h-[44px] max-h-[180px]"
          />

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            {/* Left Tools: Attach file & Mic */}
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                title="Allega file o trascina immagini"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenVoiceMode}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors group relative"
                title="Avvia modalità vocale"
              >
                <Mic className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Right: Model Label & Send / Stop Button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span className="max-w-[120px] truncate">{selectedModel}</span>
              </div>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
                  title="Interrompi generazione"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={(!content.trim() && attachments.length === 0) || disabled}
                  className={`p-2.5 rounded-xl transition-all ${
                    content.trim() || attachments.length > 0
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-100'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Invia messaggio (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
