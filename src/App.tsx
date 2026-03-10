import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BoardProvider } from './context/BoardContext';
import { Header } from './components/board/Header';
import { BoardSidebar } from './components/board/BoardSidebar';
import { Board } from './components/board/Board';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { UpdatePrompt } from './components/ui/UpdatePrompt';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <BoardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Board />
        </main>
      </div>
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BoardProvider>
        <AppShell />
      </BoardProvider>
    </ThemeProvider>
  );
}

export default App;
