'use client';

import { useAppStore } from '@/lib/store';
import type { FileNode } from '@/types';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  ChevronRight,
  ChevronDown,
  Cpu,
} from 'lucide-react';

function getFileIcon(node: FileNode) {
  if (node.type === 'directory') return null;
  const ext = node.name.split('.').pop();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-green-400" />;
    case 'css':
      return <FileCode className="w-4 h-4 text-purple-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-slate-400" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
}

function FileTreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const { expandedDirs, toggleDir, openFile, tabs, activeTabId } = useAppStore();
  const isExpanded = expandedDirs.includes(node.path);
  const isActive = tabs.find((t) => t.id === activeTabId)?.filePath === node.path;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => toggleDir(node.path)}
          className="flex items-center gap-1.5 w-full px-2 py-1 text-sm text-slate-300 hover:bg-panel-hover rounded transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => openFile(node)}
      className={`flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded transition-colors ${
        isActive
          ? 'bg-accent-muted text-blue-300'
          : 'text-slate-400 hover:bg-panel-hover hover:text-slate-200'
      }`}
      style={{ paddingLeft: `${depth * 12 + 26}px` }}
    >
      {getFileIcon(node)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function Sidebar() {
  const { fileTree, chatConfig, setChatConfig, availableModels } = useAppStore();

  return (
    <aside className="w-64 bg-panel-surface border-r border-panel-border flex flex-col shrink-0 select-none">
      {/* Model Selector */}
      <div className="p-3 border-b border-panel-border">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          Model
        </label>
        <select
          value={chatConfig.model}
          onChange={(e) => setChatConfig({ model: e.target.value })}
          className="input-field w-full text-xs"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      {/* File Explorer */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Explorer
          </span>
        </div>
        {fileTree.map((node) => (
          <FileTreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>

      {/* Chat Config */}
      <div className="p-3 border-t border-panel-border space-y-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Temperature</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={chatConfig.temperature}
              onChange={(e) =>
                setChatConfig({ temperature: parseFloat(e.target.value) })
              }
              className="flex-1 h-1 accent-accent-primary"
            />
            <span className="text-xs text-slate-400 w-8 text-right">
              {chatConfig.temperature.toFixed(1)}
            </span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Max Tokens</label>
          <input
            type="number"
            value={chatConfig.maxTokens}
            onChange={(e) =>
              setChatConfig({
                maxTokens: Math.max(1, parseInt(e.target.value) || 4096),
              })
            }
            className="input-field w-full text-xs"
            min="1"
            max="128000"
          />
        </div>
      </div>
    </aside>
  );
}
