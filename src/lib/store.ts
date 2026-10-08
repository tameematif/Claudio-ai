import { create } from 'zustand';
import type { Message, FileNode, EditorTab, ModelOption, ChatConfig, ApiStatus, TokenUsage } from '@/types';

const MOCK_FILE_TREE: FileNode[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      {
        name: 'app',
        path: '/src/app',
        type: 'directory',
        children: [
          {
            name: 'page.tsx',
            path: '/src/app/page.tsx',
            type: 'file',
            language: 'typescript',
            content: 'export default function Home() {\n  return (\n    <main className="flex min-h-screen">\n      <h1>Claudio AI</h1>\n    </main>\n  );\n}',
          },
          {
            name: 'layout.tsx',
            path: '/src/app/layout.tsx',
            type: 'file',
            language: 'typescript',
            content: 'import type { Metadata } from "next";\nimport "./globals.css";\n\nexport const metadata: Metadata = {\n  title: "Claudio AI",\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}',
          },
        ],
      },
      {
        name: 'components',
        path: '/src/components',
        type: 'directory',
        children: [
          {
            name: 'ChatPanel.tsx',
            path: '/src/components/ChatPanel.tsx',
            type: 'file',
            language: 'typescript',
            content: '// Chat panel component with streaming support',
          },
          {
            name: 'CodeEditor.tsx',
            path: '/src/components/CodeEditor.tsx',
            type: 'file',
            language: 'typescript',
            content: '// Monaco code editor wrapper',
          },
          {
            name: 'Sidebar.tsx',
            path: '/src/components/Sidebar.tsx',
            type: 'file',
            language: 'typescript',
            content: '// Sidebar with file tree and model selector',
          },
        ],
      },
      {
        name: 'lib',
        path: '/src/lib',
        type: 'directory',
        children: [
          {
            name: 'ai-client.ts',
            path: '/src/lib/ai-client.ts',
            type: 'file',
            language: 'typescript',
            content: '// AI streaming client',
          },
          {
            name: 'store.ts',
            path: '/src/lib/store.ts',
            type: 'file',
            language: 'typescript',
            content: '// Zustand state management',
          },
        ],
      },
    ],
  },
  {
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    language: 'json',
    content: '{\n  "name": "claudio-ai",\n  "version": "1.0.0"\n}',
  },
  {
    name: 'tsconfig.json',
    path: '/tsconfig.json',
    type: 'file',
    language: 'json',
    content: '{\n  "compilerOptions": {\n    "target": "ES2017"\n  }\n}',
  },
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    language: 'markdown',
    content: '# Claudio AI\n\nAutonomous AI developer assistant.\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```',
  },
];

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'mock-ai', name: 'Mock AI (Demo Mode)', provider: 'Local Simulator' },
  { id: 'llama3', name: 'Llama 3', provider: 'Ollama' },
  { id: 'codellama', name: 'Code Llama', provider: 'Ollama' },
  { id: 'mistral', name: 'Mistral 7B', provider: 'Ollama' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'Ollama' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
];

const DEFAULT_SYSTEM_PROMPT = `You are Claudio AI, an expert software engineer. You write clean, production-ready code. When asked to write code, always provide complete implementations with proper error handling. Format code in markdown code blocks with language identifiers.`;

interface AppState {
  // File tree
  fileTree: FileNode[];
  expandedDirs: string[];

  // Editor
  tabs: EditorTab[];
  activeTabId: string | null;

  // Chat
  messages: Message[];
  isStreaming: boolean;

  // Config & Settings Modal
  chatConfig: ChatConfig;
  availableModels: ModelOption[];
  isSettingsOpen: boolean;

  // Status
  apiStatus: ApiStatus;
  tokenUsage: TokenUsage;

  // File tree actions
  toggleDir: (path: string) => void;
  openFile: (node: FileNode) => void;

  // Editor actions
  addTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  insertCodeToActiveTab: (code: string) => void;

  // Chat actions
  addMessage: (message: Message) => void;
  appendToLastMessage: (delta: string) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;

  // Config actions
  setChatConfig: (config: Partial<ChatConfig>) => void;
  toggleSettings: () => void;

  // Status actions
  setApiStatus: (status: ApiStatus) => void;
  setTokenUsage: (usage: TokenUsage) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  fileTree: MOCK_FILE_TREE,
  expandedDirs: ['/src', '/src/app', '/src/components'],
  tabs: [],
  activeTabId: null,
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m **Claudio AI**, your development assistant. I can help you write code, debug issues, and architect solutions.\n\nOpen a file from the sidebar or ask me anything to get started.',
      timestamp: Date.now(),
    },
  ],
  isStreaming: false,
  isSettingsOpen: false,
  chatConfig: {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 4096,
    model: 'mock-ai',
    apiUrl: '',
    apiKey: '',
  },
  availableModels: DEFAULT_MODELS,
  apiStatus: {
    connected: false,
    latency: null,
    lastChecked: null,
  },
  tokenUsage: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  },

  // File tree actions
  toggleDir: (path: string) =>
    set((state) => ({
      expandedDirs: state.expandedDirs.includes(path)
        ? state.expandedDirs.filter((d) => d !== path)
        : [...state.expandedDirs, path],
    })),

  openFile: (node: FileNode) => {
    const state = get();
    const existing = state.tabs.find((t) => t.filePath === node.path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      filePath: node.path,
      fileName: node.name,
      language: node.language || 'plaintext',
      content: node.content || '',
      isDirty: false,
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  // Editor actions
  addTab: (tab: EditorTab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    })),

  closeTab: (id: string) =>
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== id);
      let nextActive = state.activeTabId;
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        nextActive = filtered[Math.min(idx, filtered.length - 1)]?.id || null;
      }
      return { tabs: filtered, activeTabId: nextActive };
    }),

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabContent: (id: string, content: string) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    })),

  insertCodeToActiveTab: (code: string) => {
    const state = get();
    if (!state.activeTabId) {
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        filePath: '/untitled',
        fileName: 'untitled',
        language: 'typescript',
        content: code,
        isDirty: true,
      };
      set((s) => ({
        tabs: [...s.tabs, newTab],
        activeTabId: newTab.id,
      }));
      return;
    }
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === state.activeTabId
          ? { ...t, content: t.content ? t.content + '\n' + code : code, isDirty: true }
          : t
      ),
    }));
  },

  // Chat actions
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastMessage: (delta: string) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta };
      }
      return { messages: msgs };
    }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chat cleared. How can I help you?',
          timestamp: Date.now(),
        },
      ],
    }),

  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

  // Config actions
  setChatConfig: (config: Partial<ChatConfig>) =>
    set((state) => ({
      chatConfig: { ...state.chatConfig, ...config },
    })),

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  // Status actions
  setApiStatus: (status: ApiStatus) => set({ apiStatus: status }),
  setTokenUsage: (usage: TokenUsage) => set({ tokenUsage: usage }),
}));
