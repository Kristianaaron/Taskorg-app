/**
 * Storage service — abstracts localStorage today.
 * Replace the implementation here to plug in a REST/GraphQL backend later.
 */
import type { AppState, Board } from '../types';

const STORAGE_KEY = 'taskorg_app_state';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { generateId };

function getDefaultState(): AppState {
  const defaultBoard: Board = {
    id: generateId(),
    title: 'My Board',
    visibility: 'private',
    tags: [
      { id: generateId(), name: 'Bug', color: 'red' },
      { id: generateId(), name: 'Feature', color: 'green' },
      { id: generateId(), name: 'Design', color: 'purple' },
      { id: generateId(), name: 'Urgent', color: 'orange' },
    ],
    columns: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const col1Id = generateId();
  const col2Id = generateId();
  const col3Id = generateId();

  defaultBoard.columns = [
    { id: col1Id, title: 'To Do', order: 0, boardId: defaultBoard.id },
    { id: col2Id, title: 'In Progress', order: 1, boardId: defaultBoard.id },
    { id: col3Id, title: 'Done', order: 2, boardId: defaultBoard.id },
  ];

  defaultBoard.tasks = [
    {
      id: generateId(),
      title: 'Welcome to TaskOrg!',
      description: 'This is a sample task. Click on it to see all the details.',
      checklistItems: [
        { id: generateId(), text: 'Read the description', completed: true },
        { id: generateId(), text: 'Create your first task', completed: false },
        { id: generateId(), text: 'Add a checklist item', completed: false },
      ],
      tagIds: [defaultBoard.tags[1].id],
      columnId: col1Id,
      order: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Try dragging cards',
      description: 'Drag this card between columns using the drag handle.',
      checklistItems: [],
      tagIds: [defaultBoard.tags[0].id],
      columnId: col2Id,
      order: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    boards: [defaultBoard],
    activeBoardId: defaultBoard.id,
  };
}

export const storageService = {
  load(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw) as AppState;
      // Backfill visibility for boards created before this field was added
      parsed.boards = parsed.boards.map(b =>
        b.visibility ? b : { ...b, visibility: 'private' as const }
      );
      return parsed;
    } catch {
      return getDefaultState();
    }
  },

  save(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
