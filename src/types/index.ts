export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  language?: string;
  content?: string;
}

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface ChatConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface ApiStatus {
  connected: boolean;
  latency: number | null;
  lastChecked: number | null;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}
