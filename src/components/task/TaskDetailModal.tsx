import { useState, useRef } from 'react';
import {
  AlignLeft, CheckSquare, Tag as TagIcon, Trash2, Plus, Check, X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/TagBadge';
import { useBoardContext } from '../../context/BoardContext';
import { TAG_COLOR_CLASSES, TAG_COLOR_OPTIONS } from '../../utils/tagColors';
import type { Task, Tag, TagColor } from '../../types';

interface Props {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
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
    createTag,
    deleteTag,
  } = useBoardContext();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  const allTags = activeBoard?.tags ?? [];
  const taskTags = allTags.filter(t => task.tagIds.includes(t.id));
  const availableTags = allTags.filter(t => !task.tagIds.includes(t.id));

  const save = (patch: Partial<Task>) => {
    updateTask({ ...task, ...patch });
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) save({ title: title.trim() });
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) save({ description });
  };

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    addChecklistItem(task, newChecklistText.trim());
    setNewChecklistText('');
    checklistInputRef.current?.focus();
  };

  const startEditItem = (itemId: string, text: string) => {
    setEditingItemId(itemId);
    setEditingItemText(text);
  };

  const saveEditItem = () => {
    if (!editingItemId) return;
    const item = task.checklistItems.find(i => i.id === editingItemId);
    if (item && editingItemText.trim()) {
      updateChecklistItem(task, { ...item, text: editingItemText.trim() });
    }
    setEditingItemId(null);
  };

  const toggleTag = (tag: Tag) => {
    if (task.tagIds.includes(tag.id)) {
      save({ tagIds: task.tagIds.filter(id => id !== tag.id) });
    } else {
      save({ tagIds: [...task.tagIds, tag.id] });
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor('blue');
  };

  const handleDeleteTask = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTask(task.id);
    onClose();
  };

  const completed = task.checklistItems.filter(i => i.completed).length;
  const total = task.checklistItems.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <input
            className="w-full text-xl font-bold bg-transparent border-0 border-b-2 border-transparent focus:border-indigo-500 focus:outline-none text-gray-900 dark:text-gray-100 pb-1 transition-colors"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
            placeholder="Task title"
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TagIcon size={15} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tags
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {taskTags.map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                onRemove={() => save({ tagIds: task.tagIds.filter(id => id !== tag.id) })}
              />
            ))}
            <button
              onClick={() => setShowTagPanel(p => !p)}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Plus size={12} />
              {taskTags.length === 0 ? 'Add tag' : 'Edit tags'}
            </button>
          </div>

          {showTagPanel && (
            <div className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3">
              {/* Available tags to toggle */}
              {availableTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Click to add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map(tag => {
                      const c = TAG_COLOR_CLASSES[tag.color];
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-opacity hover:opacity-80 ${c.bg} ${c.text} ${c.border}`}
                        >
                          <Plus size={10} />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Create new tag */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Create new tag:</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    className="flex-1 min-w-[100px] text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                  />
                  <select
                    value={newTagColor}
                    onChange={e => setNewTagColor(e.target.value as TagColor)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TAG_COLOR_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="primary" onClick={handleCreateTag}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Board tags management */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Board tags:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map(tag => {
                      const c = TAG_COLOR_CLASSES[tag.color];
                      const isOn = task.tagIds.includes(tag.id);
                      return (
                        <div key={tag.id} className="flex items-center gap-1">
                          <button
                            onClick={() => toggleTag(tag)}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${c.bg} ${c.text} ${c.border} ${isOn ? 'ring-2 ring-indigo-500 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                          >
                            {isOn && <Check size={10} />}
                            {tag.name}
                          </button>
                          <button
                            onClick={() => deleteTag(tag.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete tag from board"
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
            <AlignLeft size={15} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Description
            </span>
          </div>
          <textarea
            className="w-full text-sm bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 min-h-[80px]"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            rows={3}
          />
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={15} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Checklist
              </span>
            </div>
            {total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completed}/{total}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
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
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                {editingItemId === item.id ? (
                  <div className="flex-1 flex gap-1.5">
                    <input
                      autoFocus
                      className="flex-1 text-sm bg-gray-50 dark:bg-gray-900/40 border border-indigo-400 rounded px-2 py-0.5 text-gray-800 dark:text-gray-200 focus:outline-none"
                      value={editingItemText}
                      onChange={e => setEditingItemText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditItem();
                        if (e.key === 'Escape') setEditingItemId(null);
                      }}
                    />
                    <button onClick={saveEditItem} className="text-green-600 hover:text-green-700">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`flex-1 text-sm cursor-pointer ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => startEditItem(item.id, item.text)}
                  >
                    {item.text}
                  </span>
                )}
                <button
                  onClick={() => deleteChecklistItem(task, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                  aria-label="Delete item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add checklist item */}
          <div className="flex gap-2 mt-2">
            <input
              ref={checklistInputRef}
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Add an item..."
              value={newChecklistText}
              onChange={e => setNewChecklistText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
            />
            <Button size="sm" variant="secondary" onClick={handleAddChecklist}>
              <Plus size={14} />
              Add
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </p>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 dark:text-red-400">Are you sure?</span>
              <Button size="sm" variant="danger" onClick={handleDeleteTask}>
                Yes, delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" onClick={handleDeleteTask}>
              <Trash2 size={13} />
              Delete task
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
