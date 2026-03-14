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
  const id = generateId();
  const now = new Date().toISOString();

  const defaultBoard: Board = {
    id,
    title: 'My Board',
    visibility: 'private',
    tags: [],
    columns: [
      { id: generateId(), title: 'To Do', order: 0, boardId: id },
      { id: generateId(), title: 'In Progress', order: 1, boardId: id },
      { id: generateId(), title: 'Closed', order: 2, boardId: id },
    ],
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };

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
