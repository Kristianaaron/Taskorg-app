import { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, Monitor, Check, X, Link, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBoardContext } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import { ShareModal } from './ShareModal';
import { SignInModal } from '../ui/SignInModal';

interface Props {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: Props) {
  const { theme, setTheme } = useTheme();
  const { activeBoard, updateBoardTitle } = useBoardContext();
  const { user, signOut } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(activeBoard?.title ?? '');
  const [shareOpen, setShareOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="flex-shrink-0 safe-area-top bg-canvas dark:bg-gray-900 border-b border-black/10 dark:border-gray-800 z-20">
        <div className="h-14 flex items-center px-4 gap-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center flex-shrink-0">
            <span className="font-sans font-bold text-gray-900 dark:text-gray-100 text-base hidden sm:block tracking-tight">TaskOrg</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-black/10 dark:bg-gray-700" />

          <div className="flex-1 flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  className="text-base font-sans font-semibold bg-transparent border-b border-black/30 dark:border-gray-500 px-1 py-0.5 text-gray-800 dark:text-gray-100 focus:outline-none w-48"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button onClick={handleSaveTitle} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Check size={15} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="text-gray-300 hover:text-gray-500">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTitleValue(activeBoard?.title ?? ''); setIsEditingTitle(true); }}
                className="text-base font-sans font-semibold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors truncate"
              >
                {activeBoard?.title ?? 'No board'}
              </button>
            )}
          </div>

          {/* Share button */}
          {activeBoard && (
            <button
              onClick={() => setShareOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-sm border transition-colors flex-shrink-0 ${
                activeBoard.visibility === 'public'
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                  : 'border-black/15 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/8'
              }`}
              title="Share board"
            >
              <Link size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Auth */}
          {user ? (
            <div className="relative flex-shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-sm border border-black/15 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
                title={user.displayName ?? user.email ?? 'Signed in'}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                    {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[80px]">
                  {user.displayName?.split(' ')[0] ?? 'Me'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-900 border border-black/10 dark:border-gray-700 rounded-sm shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-black/8 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-green-500 mt-0.5">● Syncing to cloud</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-sm border border-black/15 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/8 transition-colors flex-shrink-0"
            >
              <div className="w-4 h-4 rounded-full border border-dashed border-gray-400 dark:border-gray-500" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}

          <button
            onClick={cycleTheme}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            title={`Theme: ${theme}. Click to cycle.`}
            aria-label="Toggle theme"
          >
            <ThemeIcon size={17} />
          </button>
        </div>
      </header>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
