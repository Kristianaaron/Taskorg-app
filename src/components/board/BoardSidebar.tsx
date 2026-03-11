import { useState } from 'react';
import { Plus, LayoutDashboard, Trash2, X } from 'lucide-react';
import { useBoardContext } from '../../context/BoardContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BoardSidebar({ isOpen, onClose }: Props) {
  const { state, activeBoard, createBoard, setActiveBoard, deleteBoard } = useBoardContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newBoardName.trim()) return;
    createBoard(newBoardName.trim());
    setNewBoardName('');
    setIsCreating(false);
    onClose();
  };

  const handleDelete = (boardId: string) => {
    if (confirmDeleteId === boardId) {
      deleteBoard(boardId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(boardId);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-60 bg-canvas dark:bg-gray-900 border-r border-black/10 dark:border-gray-800 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:flex-shrink-0`}
      >
        <div className="safe-area-top flex items-center justify-between px-4 py-4 border-b border-black/8 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={15} className="text-gray-400 dark:text-gray-500" />
            <span className="font-sans font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-widest">My Boards</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3">
          {state.boards.map(board => (
            <div key={board.id} className="group flex items-center gap-1 mb-px">
              <button
                onClick={() => { setActiveBoard(board.id); onClose(); }}
                className={`flex-1 text-left text-sm font-sans px-2.5 py-1.5 transition-colors truncate ${
                  board.id === activeBoard?.id
                    ? 'text-black dark:text-white font-medium border-l-2 border-black dark:border-white pl-2'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 pl-3'
                }`}
              >
                {board.title}
              </button>
              {confirmDeleteId === board.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(board.id)}
                    className="text-xs text-red-500 dark:text-red-400 px-1.5 py-0.5 hover:underline transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-gray-400 px-1.5 py-0.5 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDelete(board.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                  title="Delete board"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {isCreating ? (
            <div className="mt-3 p-2.5 border border-black/10 dark:border-gray-700 rounded-sm bg-white/40 dark:bg-gray-800/40">
              <input
                autoFocus
                className="w-full text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300 focus:outline-none mb-2"
                placeholder="Board name..."
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewBoardName(''); }
                }}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleCreate}
                  className="flex-1 text-xs bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 px-2 py-1 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewBoardName(''); }}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mt-2 flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Plus size={13} />
              New board
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
