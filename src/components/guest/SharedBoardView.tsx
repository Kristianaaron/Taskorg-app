import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Tag as TagIcon, AlignLeft, CheckSquare,
  Link as LinkIcon, ExternalLink, Check, X,
} from 'lucide-react';
import {
  subscribeToSharedBoard,
  subscribeToGuestComments,
  postGuestComment,
  type GuestComment,
} from '../../services/sharedBoardSync';
import type { Board, Task } from '../../types';
import { TAG_COLOR_CLASSES } from '../../utils/tagColors';
import { GuestNameModal } from './GuestNameModal';

const GUEST_NAME_KEY = 'taskorg_guest_name';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Guest task detail modal ──────────────────────────────────────────────────

interface GuestTaskModalProps {
  task: Task;
  board: Board;
  guestComments: GuestComment[];
  guestName: string;
  onClose: () => void;
}

function GuestTaskModal({ task, board, guestComments, guestName, onClose }: GuestTaskModalProps) {
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const taskTags = board.tags.filter(t => task.tagIds.includes(t.id));
  const taskGuestComments = guestComments.filter(c => c.taskId === task.id);

  // Merge board comments + guest comments, sorted by time
  const allComments = [
    ...(task.comments ?? []).map(c => ({ id: c.id, text: c.text, authorName: c.authorName, createdAt: c.createdAt })),
    ...taskGuestComments.map(c => ({ id: c.id, text: c.text, authorName: c.authorName, createdAt: c.createdAt })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSend = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      await postGuestComment(board.id, task.id, commentText.trim(), guestName);
      setCommentText('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-sm shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-black/8 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 pr-4">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — details (read-only) */}
          <div className="overflow-y-auto p-5 space-y-5 border-r border-black/8 dark:border-gray-800" style={{ flex: '3 1 0' }}>

            {taskTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {taskTags.map(tag => (
                    <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLOR_CLASSES[tag.color]}`}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>
            )}

            {(task.links ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Links</span>
                </div>
                <div className="space-y-1.5">
                  {(task.links ?? []).map(link => (
                    <a key={link} href={link} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                      <ExternalLink size={11} />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {task.checklistItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Checklist</span>
                </div>
                <div className="space-y-1.5">
                  {task.checklistItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-black dark:bg-white border-transparent' : 'border-gray-300 dark:border-gray-600'}`}>
                        {item.completed && <Check size={9} className="text-white dark:text-black" />}
                      </div>
                      <span className={`text-xs ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!task.description && taskTags.length === 0 && task.checklistItems.length === 0 && (task.links ?? []).length === 0 && (
              <p className="text-xs text-gray-300 dark:text-gray-600">No details added yet.</p>
            )}
          </div>

          {/* Right — comments */}
          <div className="flex flex-col" style={{ flex: '2 1 0' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/8 dark:border-gray-800 flex-shrink-0">
              <MessageSquare size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Comments {allComments.length > 0 && `(${allComments.length})`}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {allComments.length === 0 && (
                <p className="text-xs text-gray-300 dark:text-gray-600 text-center pt-4">
                  No comments yet. Be the first.
                </p>
              )}
              {allComments.map(comment => (
                <div key={comment.id}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{comment.authorName}</span>
                    <span className="text-xs text-gray-300 dark:text-gray-600">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-6 whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div className="px-4 py-3 border-t border-black/8 dark:border-gray-800 flex-shrink-0">
              <textarea
                className="w-full text-xs bg-gray-50/60 dark:bg-gray-900/40 border border-black/10 dark:border-gray-700 px-2.5 py-2 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:border-black/25 placeholder-gray-300 dark:placeholder-gray-600"
                placeholder="Write a comment..."
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-300 dark:text-gray-600">⌘↵ to send</span>
                <button
                  onClick={handleSend}
                  disabled={!commentText.trim() || sending}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-black dark:bg-white text-white dark:text-black disabled:opacity-40 hover:opacity-80 transition-opacity rounded-sm"
                >
                  <Send size={11} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/8 dark:border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Created {new Date(task.createdAt).toLocaleDateString()} · Viewing as{' '}
            <span className="font-medium text-gray-500 dark:text-gray-400">{guestName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main shared board view ───────────────────────────────────────────────────

interface Props {
  boardId: string;
}

export function SharedBoardView({ boardId }: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const [guestComments, setGuestComments] = useState<GuestComment[]>([]);
  const [guestName, setGuestName] = useState<string>(() => localStorage.getItem(GUEST_NAME_KEY) ?? '');
  const [showNameModal, setShowNameModal] = useState(!localStorage.getItem(GUEST_NAME_KEY));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let found = false;
    const unsub = subscribeToSharedBoard(boardId, (b) => {
      found = true;
      setBoard(b);
      setLoading(false);
    });
    const timeout = setTimeout(() => {
      if (!found) {
        setLoading(false);
        setNotFound(true);
      }
    }, 6000);
    return () => { unsub(); clearTimeout(timeout); };
  }, [boardId]);

  useEffect(() => {
    const unsub = subscribeToGuestComments(boardId, setGuestComments);
    return unsub;
  }, [boardId]);

  // Sync selected task with latest board data so comments appear live
  useEffect(() => {
    if (!selectedTask || !board) return;
    const updated = board.tasks.find(t => t.id === selectedTask.id);
    if (updated) setSelectedTask(updated);
  }, [board]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetName = (name: string) => {
    localStorage.setItem(GUEST_NAME_KEY, name);
    setGuestName(name);
    setShowNameModal(false);
  };

  if (showNameModal) {
    return <GuestNameModal onConfirm={handleSetName} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas dark:bg-gray-950">
        <p className="text-sm text-gray-400">Loading board…</p>
      </div>
    );
  }

  if (notFound || !board) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas dark:bg-gray-950">
        <p className="text-sm text-gray-400">Board not found or no longer shared.</p>
      </div>
    );
  }

  const columns = [...board.columns].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-screen bg-canvas dark:bg-gray-950 overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/8 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{board.title}</h1>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            View only
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {guestName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{guestName}</span>
          <button
            onClick={() => setShowNameModal(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Change
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4 p-4 min-w-max">
          {columns.map(col => {
            const colTasks = board.tasks
              .filter(t => t.columnId === col.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={col.id} className="flex flex-col w-72 flex-shrink-0">
                <div className="flex items-center justify-between px-1 py-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {col.title}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2">
                  {colTasks.map(task => {
                    const commentCount =
                      (task.comments?.length ?? 0) +
                      guestComments.filter(c => c.taskId === task.id).length;
                    const taskTags = board.tags.filter(t => task.tagIds.includes(t.id));

                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="text-left bg-white dark:bg-gray-900 border border-black/8 dark:border-gray-800 rounded-sm p-3 hover:border-black/20 dark:hover:border-gray-600 transition-colors shadow-sm"
                      >
                        {taskTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {taskTags.map(tag => (
                              <span key={tag.id} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TAG_COLOR_CLASSES[tag.color]}`}>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-800 dark:text-gray-200">{task.title}</p>
                        {commentCount > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <MessageSquare size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-400">{commentCount}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <GuestTaskModal
          task={selectedTask}
          board={board}
          guestComments={guestComments}
          guestName={guestName}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
