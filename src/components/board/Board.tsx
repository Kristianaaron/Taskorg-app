import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column } from './Column';
import { TaskCard } from '../task/TaskCard';
import { useBoardContext } from '../../context/BoardContext';
import type { Column as ColumnType, Task } from '../../types';

export function Board() {
  const { activeBoard, dispatch, createColumn } = useBoardContext();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  if (!activeBoard) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>No board selected</p>
      </div>
    );
  }

  const sortedColumns = useMemo(
    () => [...activeBoard.columns].sort((a, b) => a.order - b.order),
    [activeBoard.columns]
  );

  const columnIds = sortedColumns.map(c => c.id);

  const getTasksForColumn = (columnId: string) =>
    activeBoard.tasks.filter(t => t.columnId === columnId).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task as Task);
    } else if (active.data.current?.type === 'column') {
      setActiveColumn(active.data.current.column as ColumnType);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Task dragged over a different column or task
    if (activeType === 'task') {
      const activeTask = active.data.current?.task as Task;
      let overColumnId: string;

      if (overType === 'task') {
        const overTask = over.data.current?.task as Task;
        overColumnId = overTask.columnId;
      } else if (overType === 'column') {
        overColumnId = over.id as string;
      } else {
        overColumnId = over.id as string;
      }

      if (activeTask.columnId !== overColumnId) {
        // Move task to new column
        dispatch({
          type: 'MOVE_TASK_CROSS_COLUMN',
          taskId: activeTask.id,
          fromColumnId: activeTask.columnId,
          toColumnId: overColumnId,
          newOrder: getTasksForColumn(overColumnId).length,
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Reorder columns
    if (activeType === 'column' && overType === 'column') {
      const oldIdx = columnIds.indexOf(active.id as string);
      const newIdx = columnIds.indexOf(over.id as string);
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = [...columnIds];
        reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, active.id as string);
        dispatch({ type: 'REORDER_COLUMNS', boardId: activeBoard.id, columnIds: reordered });
      }
      return;
    }

    // Reorder tasks within same column
    if (activeType === 'task' && overType === 'task') {
      const activeTask = active.data.current?.task as Task;
      const overTask = over.data.current?.task as Task;

      if (activeTask.columnId === overTask.columnId) {
        const colTasks = getTasksForColumn(activeTask.columnId).map(t => t.id);
        const oldIdx = colTasks.indexOf(activeTask.id);
        const newIdx = colTasks.indexOf(overTask.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = [...colTasks];
          reordered.splice(oldIdx, 1);
          reordered.splice(newIdx, 0, activeTask.id);
          dispatch({ type: 'REORDER_TASKS', columnId: activeTask.columnId, taskIds: reordered });
        }
      }
    }
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      setIsAddingColumn(false);
      return;
    }
    createColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 md:p-6 h-full items-start min-w-max">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {sortedColumns.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={getTasksForColumn(column.id)}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          {isAddingColumn ? (
            <div className="flex-shrink-0 w-72 sm:w-80">
              <div className="bg-white/60 dark:bg-gray-800/60 border border-black/10 dark:border-gray-700 p-3">
                <input
                  autoFocus
                  className="w-full text-sm font-semibold bg-transparent border-0 border-b border-black/20 dark:border-gray-600 pb-1 mb-3 text-gray-800 dark:text-gray-100 placeholder-gray-300 focus:outline-none"
                  placeholder="Column title..."
                  value={newColumnTitle}
                  onChange={e => setNewColumnTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') { setIsAddingColumn(false); setNewColumnTitle(''); }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="flex-1 text-sm bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 px-3 py-1.5 transition-colors"
                  >
                    Add column
                  </button>
                  <button
                    onClick={() => { setIsAddingColumn(false); setNewColumnTitle(''); }}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex-shrink-0 w-72 sm:w-80 flex items-center gap-2 px-4 py-3 hover:bg-white/40 dark:hover:bg-gray-800/40 border border-dashed border-black/15 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Plus size={16} />
              Add column
            </button>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isOverlay />}
        {activeColumn && (
          <div className="flex-shrink-0 w-72 sm:w-80 bg-white/70 dark:bg-gray-800 border border-black/15 dark:border-gray-600 shadow-md px-4 py-3 opacity-80 rotate-1">
            <h3 className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-200">{activeColumn.title}</h3>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
