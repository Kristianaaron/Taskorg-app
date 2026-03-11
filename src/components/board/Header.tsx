import { useState } from 'react';
import { Menu, Sun, Moon, Monitor, Edit2, Check, X, Trello } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBoardContext } from '../../context/BoardContext';

interface Props {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: Props) {
  const { theme, setTheme } = useTheme();
  const { activeBoard, updateBoardTitle } = useBoardContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(activeBoard?.title ?? '');

  const handleSaveTitle = () => {
    if (titleValue.trim() && activeBoard) {
      updateBoardTitle(activeBoard.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="flex-shrink-0 safe-area-top bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-20">
      <div className="h-14 flex items-center px-4 gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Trello size={20} className="text-black dark:text-white" />
          <span className="font-serif font-bold text-gray-900 dark:text-gray-100 text-base hidden sm:block tracking-tight">TaskOrg</span>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Board title */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                className="text-sm font-serif font-semibold bg-gray-50 dark:bg-gray-800 border border-black dark:border-gray-400 rounded-lg px-2 py-0.5 text-gray-800 dark:text-gray-100 focus:outline-none w-48"
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-700">
                <Check size={15} />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setTitleValue(activeBoard?.title ?? ''); setIsEditingTitle(true); }}
              className="flex items-center gap-1.5 text-sm font-serif font-semibold text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors group truncate"
            >
              <span className="truncate">{activeBoard?.title ?? 'No board'}</span>
              <Edit2 size={13} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          title={`Theme: ${theme}. Click to cycle.`}
          aria-label="Toggle theme"
        >
          <ThemeIcon size={17} />
        </button>
      </div>
    </header>
  );
}
