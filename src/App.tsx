import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BoardProvider } from './context/BoardContext';
import { Header } from './components/board/Header';
import { BoardSidebar } from './components/board/BoardSidebar';
import { Board } from './components/board/Board';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { UpdatePrompt } from './components/ui/UpdatePrompt';
import { VoiceCommand } from './components/ui/VoiceCommand';
import { useBoardContext } from './context/BoardContext';
import { getShareParam, clearShareParam, decodeBoard, cloneBoardForImport } from './utils/boardShare';
import type { Board as BoardType } from './types';
import { X, Download } from 'lucide-react';

function ImportBanner() {
  const { importBoard } = useBoardContext();
  const [pending, setPending] = useState<BoardType | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const param = getShareParam();
    if (!param) return;
    try {
      const board = decodeBoard(param);
      setPending(board);
    } catch {
      setError(true);
      clearShareParam();
    }
  }, []);

  if (error) return (
    <div className="flex-shrink-0 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 px-4 py-2.5 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
      <span className="flex-1">Invalid share link — could not import board.</span>
      <button onClick={() => setError(false)} className="p-1 hover:opacity-70"><X size={14} /></button>
    </div>
  );

  if (!pending) return null;

  const handleImport = () => {
    importBoard(cloneBoardForImport(pending));
    clearShareParam();
    setPending(null);
  };

  const handleDismiss = () => {
    clearShareParam();
    setPending(null);
  };

  return (
    <div className="flex-shrink-0 bg-black dark:bg-white border-b border-black/10 px-4 py-2.5 flex items-center gap-3">
      <Download size={14} className="text-white dark:text-black flex-shrink-0" />
      <span className="flex-1 text-sm text-white dark:text-black">
        Someone shared <strong>"{pending.title}"</strong> with you.
      </span>
      <button
        onClick={handleImport}
        className="text-xs font-medium px-2.5 py-1 bg-white dark:bg-black text-black dark:text-white rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
      >
        Import board
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-white/60 dark:text-black/50 hover:text-white dark:hover:text-black transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-canvas dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <ImportBanner />
      <div className="flex flex-1 overflow-hidden">
        <BoardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-hidden safe-area-bottom">
          <Board />
        </main>
      </div>
      <InstallPrompt />
      <UpdatePrompt />
      <VoiceCommand />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BoardProvider>
          <AppShell />
        </BoardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
