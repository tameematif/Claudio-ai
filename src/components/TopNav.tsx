'use client';

import { useAppStore } from '@/lib/store';
import { Bot, Wifi, WifiOff, Zap, Settings, Trash2 } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { aiClient } from '@/lib/ai-client';

export default function TopNav() {
  const { apiStatus, setApiStatus, clearMessages, tokenUsage, toggleSettings, chatConfig } =
    useAppStore();

  const checkConnection = useCallback(async () => {
    try {
      const result = await aiClient.checkConnection(chatConfig);
      setApiStatus({
        connected: result.connected,
        latency: result.latency,
        lastChecked: Date.now(),
      });
    } catch {
      setApiStatus({
        connected: false,
        latency: null,
        lastChecked: Date.now(),
      });
    }
  }, [setApiStatus, chatConfig]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <header className="h-12 bg-panel-surface border-b border-panel-border flex items-center justify-between px-4 select-none shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent-primary" />
          <span className="font-bold text-sm tracking-wide text-slate-100">
            CLAUDIO AI
          </span>
        </div>
        <span className="text-xs text-slate-500">v1.0.0</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Token counter */}
        {tokenUsage.totalTokens > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5" />
            <span>{tokenUsage.totalTokens.toLocaleString()} tokens</span>
          </div>
        )}

        {/* Connection status */}
        <button
          onClick={checkConnection}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded hover:bg-panel-hover transition-colors"
          title={`Click to refresh. ${apiStatus.latency ? `Latency: ${apiStatus.latency}ms` : ''}`}
        >
          {apiStatus.connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Connected</span>
              {apiStatus.latency && (
                <span className="text-slate-500">{apiStatus.latency}ms</span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Disconnected</span>
            </>
          )}
        </button>

        {/* Clear chat */}
        <button
          onClick={clearMessages}
          className="btn-ghost"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Settings toggle */}
        <button
          onClick={toggleSettings}
          className="btn-ghost"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
