import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical, GripVertical, Trash2, Edit2, Check, X } from 'lucide-react';
import { TaskCard } from '../task/TaskCard';
import { useBoardContext } from '../../context/BoardContext';
import type { Column as ColumnType, Task } from '../../types';

interface Props {
  column: ColumnType;
  tasks: Task[];
}

export function Column({ column, tasks }: Props) {
  const { updateColumnTitle, deleteColumn, createTask } = useBoardContext();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column } });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  useEffect(() => {
    if (isAddingTask) addInputRef.current?.focus();
  }, [isAddingTask]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      setIsAddingTask(false);
      return;
    }
    createTask(column.id, newTaskTitle.trim());
    setNewTaskTitle('');
    addInputRef.current?.focus();
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      updateColumnTitle(column.id, editTitle.trim());
    } else {
      setEditTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const taskIds = tasks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(t => t.id);

  const sortedTasks = tasks.slice().sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex-shrink-0 w-72 sm:w-80 flex flex-col"
    >
      <div className={`bg-white/50 dark:bg-gray-800/40 border border-black/10 dark:border-gray-700 rounded-sm flex flex-col max-h-[calc(100vh-10rem)] transition-colors ${isOver ? 'bg-white/80 dark:bg-gray-800/60' : ''}`}>
        {/* Column header */}
        <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0 border-b border-black/6 dark:border-gray-700/60">
          <div
            {...listeners}
            {...attributes}
            className="p-0.5 text-gray-200 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>

          {isEditingTitle ? (
            <div className="flex-1 flex gap-1.5">
              <input
                ref={titleInputRef}
                className="flex-1 text-sm font-sans font-semibold bg-transparent border-b border-black/30 dark:border-gray-500 px-1 py-0.5 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setEditTitle(column.title); setIsEditingTitle(false); }
                }}
              />
              <button onClick={handleSaveTitle} className="text-gray-400 hover:text-gray-700">
                <Check size={13} />
              </button>
              <button onClick={() => { setEditTitle(column.title); setIsEditingTitle(false); }} className="text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            </div>
          ) : (
            <h3 className="flex-1 text-sm font-sans font-semibold text-gray-600 dark:text-gray-300 truncate">
              {column.title}
            </h3>
          )}

          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
            {tasks.length}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(p => !p)}
              className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-black/12 dark:border-gray-700 rounded-sm shadow-sm py-1 min-w-[140px]">
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                >
                  <Edit2 size={12} />
                  Rename column
                </button>
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => { deleteColumn(column.id); setShowMenu(false); }}
                >
                  <Trash2 size={12} />
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task list */}
        <div
          ref={setDroppableRef}
          className="flex-1 overflow-y-auto px-2 pt-2 pb-2 space-y-0 min-h-[60px]"
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {sortedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {tasks.length === 0 && !isAddingTask && (
            <div className={`flex items-center justify-center h-16 border border-dashed text-xs transition-colors ${isOver ? 'border-black/30 text-gray-500' : 'border-black/10 dark:border-gray-700 text-gray-300 dark:text-gray-600'}`}>
              {isOver ? 'Drop here' : 'Empty'}
            </div>
          )}
        </div>

        {/* Add task */}
        <div className="px-2 pb-2 flex-shrink-0">
          {isAddingTask ? (
            <div className="bg-white dark:bg-gray-900 border border-black/12 dark:border-gray-700 rounded-sm p-2.5">
              <input
                ref={addInputRef}
                className="w-full text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300 focus:outline-none mb-2"
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle(''); }
                }}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddTask}
                  className="flex-1 text-xs bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 px-2 py-1 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1.5 transition-colors"
            >
              <Plus size={13} />
              Add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
