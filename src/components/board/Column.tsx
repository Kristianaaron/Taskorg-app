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
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isAddingTask) addInputRef.current?.focus();
  }, [isAddingTask]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  // Close menu when clicking outside
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
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[calc(100vh-10rem)] shadow-sm">
        {/* Column header */}
        <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0">
          <div
            {...listeners}
            {...attributes}
            className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing rounded"
            title="Drag to reorder"
          >
            <GripVertical size={15} />
          </div>

          {isEditingTitle ? (
            <div className="flex-1 flex gap-1.5">
              <input
                ref={titleInputRef}
                className="flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-indigo-400 rounded px-2 py-0.5 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setEditTitle(column.title); setIsEditingTitle(false); }
                }}
              />
              <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={() => { setEditTitle(column.title); setIsEditingTitle(false); }} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <h3 className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
              {column.title}
            </h3>
          )}

          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {tasks.length}
          </span>

          {/* Column menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(p => !p)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical size={15} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                >
                  <Edit2 size={13} />
                  Rename column
                </button>
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => { deleteColumn(column.id); setShowMenu(false); }}
                >
                  <Trash2 size={13} />
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task list */}
        <div
          ref={setDroppableRef}
          className={`flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px] rounded-b-xl transition-colors ${
            isOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
          }`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {sortedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {tasks.length === 0 && !isAddingTask && (
            <div className={`flex items-center justify-center h-16 rounded-lg border-2 border-dashed text-xs text-gray-400 dark:text-gray-600 transition-colors ${isOver ? 'border-indigo-400 text-indigo-400' : 'border-gray-200 dark:border-gray-700'}`}>
              {isOver ? 'Drop here' : 'No tasks yet'}
            </div>
          )}
        </div>

        {/* Add task */}
        <div className="px-2 pb-2 flex-shrink-0">
          {isAddingTask ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-indigo-400 p-2 shadow-sm">
              <input
                ref={addInputRef}
                className="w-full text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none mb-2"
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
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-1 transition-colors"
                >
                  Add task
                </button>
                <button
                  onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 rounded-lg px-2 py-1.5 transition-colors"
            >
              <Plus size={14} />
              Add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
