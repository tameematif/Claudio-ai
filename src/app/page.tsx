'use client';

import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import CodeEditor from '@/components/CodeEditor';
import ChatPanel from '@/components/ChatPanel';
import SettingsModal from '@/components/SettingsModal';

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopNav />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <CodeEditor />
        <ChatPanel />
      </div>
      <SettingsModal />
    </div>
  );
}
