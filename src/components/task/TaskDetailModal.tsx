import { useState, useRef, useCallback, useMemo } from 'react';
import {
  AlignLeft, CheckSquare, Tag as TagIcon, Trash2, Plus, Check, X,
  Link as LinkIcon, MessageSquare, Send, ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/TagBadge';
import { useBoardContext } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import { TAG_COLOR_CLASSES, TAG_COLOR_OPTIONS } from '../../utils/tagColors';
import type { Task, Tag, TagColor } from '../../types';

interface Props {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

function getLinkLabel(url: string): string {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes('figma.com')) return 'Figma';
    if (hostname.includes('github.com')) return 'GitHub';
    if (hostname.includes('notion.so')) return 'Notion';
    if (hostname.includes('drive.google.com')) return 'Google Drive';
    if (hostname.includes('docs.google.com')) return 'Google Docs';
    if (hostname.includes('linear.app')) return 'Linear';
    if (hostname.includes('jira')) return 'Jira';
    return hostname.replace('www.', '');
  } catch {
    return url.slice(0, 30);
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function TaskDetailModal({ task, isOpen, onClose }: Props) {
  const {
    activeBoard,
    updateTask,
    deleteTask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    updateChecklistItem,
    addComment,
    deleteComment,
    addLink,
    removeLink,
    createTag,
    deleteTag,
  } = useBoardContext();
  const { user } = useAuth();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newLinkText, setNewLinkText] = useState('');
  const [commentText, setCommentText] = useState('');

  const checklistInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const allTags = useMemo(() => activeBoard?.tags ?? [], [activeBoard?.tags]);
  const taskTags = useMemo(() => allTags.filter(t => task.tagIds.includes(t.id)), [allTags, task.tagIds]);
  const availableTags = useMemo(() => allTags.filter(t => !task.tagIds.includes(t.id)), [allTags, task.tagIds]);
  const comments = task.comments ?? [];
  const links = task.links ?? [];

  const save = useCallback((patch: Partial<Task>) => {
    updateTask({ ...task, ...patch });
  }, [task, updateTask]);

  const handleTitleBlur = useCallback(() => {
    if (title.trim() && title !== task.title) save({ title: title.trim() });
  }, [title, task.title, save]);

  const handleDescriptionBlur = useCallback(() => {
    if (description !== task.description) save({ description });
  }, [description, task.description, save]);

  const handleAddChecklist = useCallback(() => {
    if (!newChecklistText.trim()) return;
    addChecklistItem(task, newChecklistText.trim());
    setNewChecklistText('');
    checklistInputRef.current?.focus();
  }, [newChecklistText, task, addChecklistItem]);

  const startEditItem = useCallback((itemId: string, text: string) => {
    setEditingItemId(itemId);
    setEditingItemText(text);
  }, []);

  const saveEditItem = useCallback(() => {
    if (!editingItemId) return;
    const item = task.checklistItems.find(i => i.id === editingItemId);
    if (item && editingItemText.trim()) {
      updateChecklistItem(task, { ...item, text: editingItemText.trim() });
    }
    setEditingItemId(null);
  }, [editingItemId, editingItemText, task, updateChecklistItem]);

  const toggleTag = useCallback((tag: Tag) => {
    if (task.tagIds.includes(tag.id)) {
      save({ tagIds: task.tagIds.filter(id => id !== tag.id) });
    } else {
      save({ tagIds: [...task.tagIds, tag.id] });
    }
  }, [task.tagIds, save]);

  const handleCreateTag = useCallback(() => {
    if (!newTagName.trim()) return;
    createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor('blue');
  }, [newTagName, newTagColor, createTag]);

  const handleAddLink = useCallback(() => {
    const url = newLinkText.trim();
    if (!url) return;
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    addLink(task, withProtocol);
    setNewLinkText('');
  }, [newLinkText, task, addLink]);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;
    const authorName = user?.displayName ?? user?.email ?? 'Anonymous';
    const authorId = user?.uid ?? 'guest';
    addComment(task, commentText.trim(), authorName, authorId);
    setCommentText('');
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [commentText, user, task, addComment]);

  const handleDeleteTask = useCallback(() => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteTask(task.id);
    onClose();
  }, [confirmDelete, task.id, deleteTask, onClose]);

  const handleSave = useCallback(() => {
    if (title.trim() && title !== task.title) save({ title: title.trim() });
    if (description !== task.description) save({ description });
    onClose();
  }, [title, task.title, description, task.description, save, onClose]);

  const completed = task.checklistItems.filter(i => i.completed).length;
  const total = task.checklistItems.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {/* Full-height flex column layout */}
      <div className="flex flex-col h-full">

        {/* ── Header: editable title ─────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 border-b border-black/8 dark:border-gray-800 flex-shrink-0 pr-10">
          <input
            className="w-full text-lg font-bold bg-transparent border-0 border-b border-transparent focus:border-black/25 dark:focus:border-gray-500 focus:outline-none text-gray-900 dark:text-gray-100 pb-1 transition-colors"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="Task title"
          />
        </div>

        {/* ── Body: two panels ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Left panel — details */}
          <div className="flex-1 md:basis-[60%] md:max-w-[60%] overflow-y-auto p-5 space-y-5 border-b md:border-b-0 md:border-r border-black/8 dark:border-gray-800">

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon size={13} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {taskTags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    onRemove={() => save({ tagIds: task.tagIds.filter(id => id !== tag.id) })}
                  />
                ))}
                <button
                  onClick={() => setShowTagPanel(p => !p)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-200 transition-colors"
                >
                  <Plus size={11} />
                  {taskTags.length === 0 ? 'Add tag' : 'Edit'}
                </button>
              </div>

              {showTagPanel && (
                <div className="mt-2 p-3 border border-black/10 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 space-y-3">
                  {availableTags.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Click to add:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTags.map(tag => {
                          const c = TAG_COLOR_CLASSES[tag.color];
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag(tag)}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-opacity hover:opacity-80 ${c.bg} ${c.text} ${c.border}`}
                            >
                              <Plus size={10} /> {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Create tag:</p>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        className="flex-1 min-w-[100px] text-xs px-2.5 py-1.5 border border-black/15 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-black/40"
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                      />
                      <select
                        value={newTagColor}
                        onChange={e => setNewTagColor(e.target.value as TagColor)}
                        className="text-xs px-2 py-1.5 border border-black/15 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                      >
                        {TAG_COLOR_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="primary" onClick={handleCreateTag}>Add</Button>
                    </div>
                  </div>
                  {allTags.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Board tags:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map(tag => {
                          const c = TAG_COLOR_CLASSES[tag.color];
                          const isOn = task.tagIds.includes(tag.id);
                          return (
                            <div key={tag.id} className="flex items-center gap-1">
                              <button
                                onClick={() => toggleTag(tag)}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${c.bg} ${c.text} ${c.border} ${isOn ? 'ring-2 ring-black dark:ring-white ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                              >
                                {isOn && <Check size={10} />} {tag.name}
                              </button>
                              <button
                                onClick={() => deleteTag(tag.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Remove tag from board"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft size={13} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</span>
              </div>
              <textarea
                className="w-full text-sm bg-gray-50/60 dark:bg-gray-900/40 border border-black/10 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:border-black/25 placeholder-gray-300 dark:placeholder-gray-600 min-h-[80px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon size={13} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Links</span>
              </div>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {links.map(url => (
                    <div
                      key={url}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-black/10 dark:border-gray-700 group"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={10} />
                        {getLinkLabel(url)}
                      </a>
                      <button
                        onClick={() => removeLink(task, url)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className="flex-1 text-xs bg-gray-50/60 dark:bg-gray-900/40 border border-black/10 dark:border-gray-700 px-2.5 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-black/25 placeholder-gray-300 dark:placeholder-gray-600"
                  placeholder="Paste a link (Figma, GitHub...)"
                  value={newLinkText}
                  onChange={e => setNewLinkText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                />
                <Button size="sm" variant="secondary" onClick={handleAddLink}>
                  <Plus size={12} /> Add
                </Button>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Checklist</span>
                </div>
                {total > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{completed}/{total}</span>
                )}
              </div>
              {total > 0 && (
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 mb-3 overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white transition-all duration-300"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                {task.checklistItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(task, item.id)}
                      className="mt-0.5 h-3.5 w-3.5 border-gray-300 dark:border-gray-600 text-black focus:ring-black cursor-pointer flex-shrink-0"
                    />
                    {editingItemId === item.id ? (
                      <div className="flex-1 flex gap-1.5">
                        <input
                          autoFocus
                          className="flex-1 text-sm bg-transparent border-b border-black/25 dark:border-gray-500 px-1 py-0.5 text-gray-800 dark:text-gray-200 focus:outline-none"
                          value={editingItemText}
                          onChange={e => setEditingItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditItem();
                            if (e.key === 'Escape') setEditingItemId(null);
                          }}
                        />
                        <button onClick={saveEditItem} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                        <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                      </div>
                    ) : (
                      <span
                        className={`flex-1 text-sm cursor-pointer select-none ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
                        onClick={() => startEditItem(item.id, item.text)}
                      >
                        {item.text}
                      </span>
                    )}
                    <button
                      onClick={() => deleteChecklistItem(task, item.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  ref={checklistInputRef}
                  className="flex-1 text-sm bg-gray-50/60 dark:bg-gray-900/40 border border-black/10 dark:border-gray-700 px-2.5 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-black/25 placeholder-gray-300 dark:placeholder-gray-600"
                  placeholder="Add an item..."
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
                />
                <Button size="sm" variant="secondary" onClick={handleAddChecklist}>
                  <Plus size={12} /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Right panel — comments */}
          <div className="flex-1 md:basis-[40%] md:max-w-[40%] flex flex-col min-h-[250px] md:min-h-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/8 dark:border-gray-800 flex-shrink-0">
              <MessageSquare size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {comments.length === 0 && (
                <p className="text-xs text-gray-300 dark:text-gray-600 text-center pt-4">
                  No comments yet. Share the board with your team and leave notes here.
                </p>
              )}
              {comments.map(comment => (
                <div key={comment.id} className="group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{comment.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-300 dark:text-gray-600">{formatRelativeTime(comment.createdAt)}</span>
                      {(user?.uid === comment.authorId || comment.authorId === 'guest') && (
                        <button
                          onClick={() => deleteComment(task, comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-6.5 whitespace-pre-wrap">
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
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-300 dark:text-gray-600">⌘↵ to send</span>
                <Button size="sm" variant="primary" onClick={handleAddComment} disabled={!commentText.trim()}>
                  <Send size={11} /> Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-black/8 dark:border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-500 dark:text-red-400">Are you sure?</span>
                <Button size="sm" variant="danger" onClick={handleDeleteTask}>Yes, delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="sm" variant="danger" onClick={handleDeleteTask}>
                <Trash2 size={12} /> Delete
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={handleSave}>
              <Check size={12} /> Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
