import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Bot, User, FileText, Image as ImageIcon } from 'lucide-react';
import { Message } from '../../types';
import { ToolCallBadge } from './ToolCallBadge';

interface ChatMessageProps {
  message: Message;
  isLastAssistantMessage?: boolean;
  onApproveTool?: (logId: string) => void;
  onRejectTool?: (logId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onApproveTool,
  onRejectTool,
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`py-5 px-6 flex gap-4 transition-colors ${
        isAssistant
          ? 'bg-[#0c1222]/50 border-y border-cyan-500/10'
          : 'bg-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400/50">
            <Bot className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content Area */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header Name & Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wide text-slate-200">
              {isAssistant ? 'J.A.R.V.I.S.' : 'USER'}
            </span>
            {isAssistant && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                AI Engine
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(message.content)}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
              title="Copia messaggio"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Attachments if present */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {message.attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
              >
                {att.type?.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="truncate max-w-[160px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tool Call Badges if attached to message */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="space-y-1 my-2">
            {message.tool_calls.map((tc: any, i: number) => {
              const func = tc.function || {};
              let args = func.arguments;
              if (typeof args === 'string') {
                try {
                  args = JSON.parse(args);
                } catch (e) {}
              }
              return (
                <ToolCallBadge
                  key={i}
                  toolName={func.name}
                  args={args}
                  status="executed"
                />
              );
            })}
          </div>
        )}

        {/* Markdown Text Rendering */}
        <div className="prose prose-invert prose-cyan max-w-none text-slate-100 text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline) {
                  return (
                    <div className="relative my-3 rounded-xl border border-cyan-500/20 bg-slate-950 overflow-hidden font-mono text-xs shadow-lg">
                      <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-slate-400 select-none">
                        <span className="text-[11px] uppercase tracking-wider text-cyan-400/90 font-semibold">
                          {match ? match[1] : 'code'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(codeString)}
                          className="flex items-center gap-1 text-[11px] hover:text-cyan-300 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copia</span>
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-slate-200">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table({ children }) {
                return (
                  <div className="my-3 overflow-x-auto rounded-lg border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800 text-xs">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="px-3 py-2 bg-slate-900 text-left font-mono font-semibold text-cyan-300">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return <td className="px-3 py-2 border-t border-slate-800/60">{children}</td>;
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
