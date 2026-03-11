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
    opacity: isDragging ? 0.35 : 1,
  };

  const tags = (activeBoard?.tags ?? []).filter(t => task.tagIds.includes(t.id));
  const checklistTotal = task.checklistItems.length;
  const checklistDone = task.checklistItems.filter(i => i.completed).length;
  const hasDescription = task.description.trim().length > 0;

  const cardContent = (
    <>
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 p-0.5 text-gray-200 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to move"
      >
        <GripVertical size={13} />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug pr-5">
        {task.title}
      </p>

      {(hasDescription || checklistTotal > 0) && (
        <div className="flex items-center gap-3 mt-2">
          {hasDescription && (
            <span className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600">
              <MessageSquare size={11} />
            </span>
          )}
          {checklistTotal > 0 && (
            <span
              className={`flex items-center gap-1 text-xs ${
                checklistDone === checklistTotal
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            >
              <CheckSquare size={11} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (isOverlay) {
    return (
      <div className="relative group bg-white dark:bg-gray-800 border border-black/20 dark:border-gray-600 rounded-sm shadow-md p-3 cursor-grabbing rotate-1 scale-102">
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
        className="relative group bg-white dark:bg-gray-800 border border-black/8 dark:border-gray-700 hover:border-black/20 dark:hover:border-gray-500 rounded-sm p-3 cursor-pointer transition-colors mt-2 first:mt-0"
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
