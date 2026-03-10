import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckSquare, MessageSquare } from 'lucide-react';
import { TagBadge } from '../ui/TagBadge';
import { TaskDetailModal } from './TaskDetailModal';
import { useBoardContext } from '../../context/BoardContext';
import type { Task } from '../../types';

interface Props {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay = false }: Props) {
  const { activeBoard } = useBoardContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const tags = (activeBoard?.tags ?? []).filter(t => task.tagIds.includes(t.id));
  const checklistTotal = task.checklistItems.length;
  const checklistDone = task.checklistItems.filter(i => i.completed).length;
  const hasDescription = task.description.trim().length > 0;

  const cardContent = (
    <>
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to move"
      >
        <GripVertical size={14} />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug pr-5">
        {task.title}
      </p>

      {/* Meta */}
      {(hasDescription || checklistTotal > 0) && (
        <div className="flex items-center gap-3 mt-2">
          {hasDescription && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <MessageSquare size={12} />
            </span>
          )}
          {checklistTotal > 0 && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                checklistDone === checklistTotal
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <CheckSquare size={12} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (isOverlay) {
    return (
      <div className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-3 cursor-grabbing rotate-2 scale-105">
        {cardContent}
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => !isDragging && setIsModalOpen(true)}
        className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md p-3 cursor-pointer transition-shadow"
      >
        {cardContent}
      </div>

      {isModalOpen && (
        <TaskDetailModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
