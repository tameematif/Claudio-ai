'use client';

import { useAppStore } from '@/lib/store';
import { aiClient } from '@/lib/ai-client';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Key, Globe, Cpu } from 'lucide-react';
import { useState } from 'react';

export default function SettingsModal() {
  const { isSettingsOpen, toggleSettings, chatConfig, setChatConfig, setApiStatus } =
    useAppStore();

  const [apiUrl, setApiUrl] = useState(chatConfig.apiUrl || '');
  const [apiKey, setApiKey] = useState(chatConfig.apiKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setChatConfig({
      apiUrl,
      apiKey,
    });
    toggleSettings();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await aiClient.checkConnection({
        ...chatConfig,
        apiUrl,
        apiKey,
      });
      if (res.connected) {
        setTestResult({
          success: true,
          message: `Connected successfully (${res.latency}ms latency)`,
        });
        setApiStatus({
          connected: true,
          latency: res.latency,
          lastChecked: Date.now(),
        });
      } else {
        setTestResult({
          success: false,
          message: `Could not connect to endpoint`,
        });
        setApiStatus({
          connected: false,
          latency: null,
          lastChecked: Date.now(),
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const setPreset = (url: string, model?: string) => {
    setApiUrl(url);
    if (model) {
      setChatConfig({ model });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-panel-surface border border-panel-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            AI Provider Settings
          </h2>
          <button
            onClick={toggleSettings}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-panel-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Presets */}
          <div>
            <label className="text-xs text-slate-400 block mb-2 font-medium uppercase tracking-wider">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset('', 'mock-ai')}
                className="px-2.5 py-1.5 rounded bg-panel-bg border border-panel-border hover:border-accent-primary text-xs text-slate-300 transition-colors text-center"
              >
                Mock AI (Demo)
              </button>
              <button
                type="button"
                onClick={() => setPreset('http://localhost:11434/v1', 'llama3')}
                className="px-2.5 py-1.5 rounded bg-panel-bg border border-panel-border hover:border-accent-primary text-xs text-slate-300 transition-colors text-center"
              >
                Ollama Local
              </button>
              <button
                type="button"
                onClick={() => setPreset('https://api.openai.com/v1', 'gpt-4o')}
                className="px-2.5 py-1.5 rounded bg-panel-bg border border-panel-border hover:border-accent-primary text-xs text-slate-300 transition-colors text-center"
              >
                OpenAI Cloud
              </button>
            </div>
          </div>

          {/* API Base URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 block mb-1 font-medium">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:11434/v1 (or default from env)"
              className="input-field w-full"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Ollama, LM Studio, vLLM, OpenAI, Groq, or OpenAI-compatible endpoints.
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 block mb-1 font-medium">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              API Key (Optional for local)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... (Leave blank for Ollama/LM Studio)"
              className="input-field w-full font-mono"
            />
          </div>

          {/* Connection Test Output */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-panel-bg border-t border-panel-border">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="btn-ghost flex items-center gap-1.5 text-xs text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleSettings} className="btn-ghost text-xs">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary text-xs">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
