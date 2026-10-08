'use client';

import { useAppStore } from '@/lib/store';
import { X, Code } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-accent-primary rounded-full animate-spin" />
        Loading editor...
      </div>
    </div>
  ),
});

function languageToMonaco(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'typescript',
    javascript: 'javascript',
    python: 'python',
    json: 'json',
    html: 'html',
    css: 'css',
    markdown: 'markdown',
    plaintext: 'plaintext',
  };
  return map[lang] || 'plaintext';
}

export default function CodeEditor() {
  const { tabs, activeTabId, setActiveTab, closeTab, updateTabContent } =
    useAppStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-panel-bg">
        <div className="text-center space-y-3">
          <Code className="w-12 h-12 text-slate-700 mx-auto" />
          <div className="text-slate-500 text-sm">
            Open a file from the sidebar
          </div>
          <div className="text-slate-600 text-xs">
            or ask Claudio AI to generate code
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-panel-bg min-w-0">
      {/* Tab Bar */}
      <div className="flex items-center bg-panel-surface border-b border-panel-border overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-2 px-3 py-2 text-xs border-r border-panel-border cursor-pointer shrink-0 transition-colors ${
              tab.id === activeTabId
                ? 'bg-panel-bg text-slate-200 border-b-2 border-b-accent-primary'
                : 'text-slate-400 hover:bg-panel-hover hover:text-slate-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="truncate max-w-[120px]">
              {tab.isDirty && (
                <span className="text-amber-400 mr-1">&bull;</span>
              )}
              {tab.fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-slate-600 rounded p-0.5 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {activeTab && (
          <MonacoEditor
            key={activeTab.id}
            height="100%"
            language={languageToMonaco(activeTab.language)}
            value={activeTab.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              padding: { top: 12 },
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
