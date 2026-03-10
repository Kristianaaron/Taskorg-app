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
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:shadow-none lg:flex-shrink-0`}
      >
        <div className="safe-area-top flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">My Boards</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {state.boards.map(board => (
            <div key={board.id} className="group flex items-center gap-1 mb-0.5">
              <button
                onClick={() => { setActiveBoard(board.id); onClose(); }}
                className={`flex-1 text-left text-sm px-3 py-2 rounded-lg transition-colors truncate ${
                  board.id === activeBoard?.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {board.title}
              </button>
              {confirmDeleteId === board.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(board.id)}
                    className="text-xs text-red-600 dark:text-red-400 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDelete(board.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded"
                  title="Delete board"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          {isCreating ? (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-indigo-300 dark:border-indigo-700">
              <input
                autoFocus
                className="w-full text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none mb-2"
                placeholder="Board name..."
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewBoardName(''); }
                }}
              />
              <div className="flex gap-1">
                <button
                  onClick={handleCreate}
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-1 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewBoardName(''); }}
                  className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mt-1 flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Plus size={14} />
              New board
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
