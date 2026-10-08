'use client';

import { useAppStore } from '@/lib/store';
import { aiClient } from '@/lib/ai-client';
import type { Message } from '@/types';
import {
  Send,
  Square,
  Copy,
  Check,
  ArrowDownToLine,
  Bot,
  User,
  Loader2,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CodeBlock({
  language,
  code,
  onInsert,
}: {
  language: string;
  code: string;
  onInsert: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in insecure contexts
    }
  };

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between bg-slate-800 rounded-t-lg px-3 py-1.5 border border-panel-border border-b-0">
        <span className="text-xs text-slate-400">{language || 'code'}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-panel-hover transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => onInsert(code)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-panel-hover transition-colors"
          >
            <ArrowDownToLine className="w-3 h-3" />
            Insert
          </button>
        </div>
      </div>
      <pre className="bg-panel-bg rounded-b-lg p-4 overflow-x-auto border border-panel-border border-t-0 !my-0">
        <code className="text-sm font-mono text-slate-300">{code}</code>
      </pre>
    </div>
  );
}

function ChatMessage({
  message,
  onInsertCode,
}: {
  message: Message;
  onInsertCode: (code: string) => void;
}) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex gap-3 px-4 py-3 ${
        isAssistant ? 'bg-panel-surface/50' : ''
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isAssistant ? 'bg-accent-muted' : 'bg-slate-700'
        }`}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-accent-primary" />
        ) : (
          <User className="w-4 h-4 text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0 chat-content text-sm text-slate-300 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (match) {
                return (
                  <CodeBlock
                    language={match[1]}
                    code={codeString}
                    onInsert={onInsertCode}
                  />
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const {
    messages,
    isStreaming,
    chatConfig,
    tabs,
    activeTabId,
    addMessage,
    appendToLastMessage,
    setStreaming,
    setTokenUsage,
    insertCodeToActiveTab,
  } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getEditorContext = (): string | undefined => {
    if (!activeTabId) return undefined;
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeTab.content) return undefined;
    return activeTab.content;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    addMessage(assistantMessage);
    setInput('');
    setStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const allMessages = [...messages.filter((m) => m.id !== 'welcome'), userMessage];

    try {
      const usage = await aiClient.streamChat(
        {
          messages: allMessages,
          config: chatConfig,
          editorContext: getEditorContext(),
        },
        {
          onChunk: (delta) => {
            appendToLastMessage(delta);
          },
          onComplete: () => {
            setStreaming(false);
          },
          onError: (error) => {
            let errorMsg = error.message;
            try {
              // Extract embedded JSON if present
              const jsonStart = errorMsg.indexOf('{');
              if (jsonStart !== -1) {
                const parsed = JSON.parse(errorMsg.slice(jsonStart));
                if (parsed.detail) {
                  errorMsg = parsed.detail;
                } else if (parsed.error) {
                  errorMsg = parsed.error;
                }
              }
            } catch {
              // keep original errorMsg if parsing fails
            }
            appendToLastMessage(
              `\n\n> ⚠️ **Connection Error**\n> ${errorMsg}\n\n*Tip: Switch Model in sidebar to **"Mock AI (Demo Mode)"** to test immediately without a local server, or open Settings (⚙️) to set your custom API Endpoint.*`
            );
            setStreaming(false);
          },
        }
      );

      if (usage) {
        setTokenUsage(usage);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      appendToLastMessage(`\n\n---\n**Error:** ${message}`);
      setStreaming(false);
    }
  };

  const handleStop = () => {
    aiClient.abort();
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleTextareaInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="w-96 bg-panel-surface border-l border-panel-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-panel-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium text-slate-200">Chat</span>
          </div>
          <span className="text-xs text-slate-500">
            {chatConfig.model}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onInsertCode={insertCodeToActiveTab}
          />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Claudio is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-panel-border shrink-0"
      >
        <div className="flex items-end gap-2 bg-panel-bg rounded-lg border border-panel-border focus-within:border-accent-primary transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claudio AI..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 px-3 py-2.5 resize-none focus:outline-none min-h-[40px] max-h-[200px]"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 mr-1 mb-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
              title="Stop generating"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 mr-1 mb-1 text-accent-primary hover:text-white hover:bg-accent-primary/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Shift+Enter for new line
          </span>
        </div>
      </form>
    </div>
  );
}
