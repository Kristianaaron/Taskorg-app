import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { AppState, Board, Column, Task, Tag, ChecklistItem, TagColor } from '../types';
import { storageService, generateId } from '../services/storage';
import { useAuth } from './AuthContext';
import { saveToCloud, loadFromCloud, subscribeToCloud } from '../services/firestoreSync';

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ACTIVE_BOARD'; boardId: string }
  | { type: 'CREATE_BOARD'; title: string }
  | { type: 'UPDATE_BOARD_TITLE'; boardId: string; title: string }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'CREATE_COLUMN'; boardId: string; title: string }
  | { type: 'UPDATE_COLUMN_TITLE'; columnId: string; title: string }
  | { type: 'DELETE_COLUMN'; columnId: string }
  | { type: 'REORDER_COLUMNS'; boardId: string; columnIds: string[] }
  | { type: 'CREATE_TASK'; columnId: string; boardId: string; title: string }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'MOVE_TASK'; taskId: string; toColumnId: string; newOrder: number }
  | { type: 'REORDER_TASKS'; columnId: string; taskIds: string[] }
  | { type: 'MOVE_TASK_CROSS_COLUMN'; taskId: string; fromColumnId: string; toColumnId: string; newOrder: number }
  | { type: 'CREATE_TAG'; boardId: string; name: string; color: TagColor }
  | { type: 'UPDATE_TAG'; boardId: string; tag: Tag }
  | { type: 'DELETE_TAG'; boardId: string; tagId: string }
  | { type: 'UPDATE_BOARD_VISIBILITY'; boardId: string; visibility: 'private' | 'public' }
  | { type: 'IMPORT_BOARD'; board: Board }
  | { type: 'REPLACE_STATE'; state: AppState };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.boardId };

    case 'CREATE_BOARD': {
      const id = generateId();
      const col1 = generateId();
      const col2 = generateId();
      const col3 = generateId();
      const board: Board = {
        id,
        title: action.title,
        visibility: 'private',
        tags: [],
        columns: [
          { id: col1, title: 'To Do', order: 0, boardId: id },
          { id: col2, title: 'In Progress', order: 1, boardId: id },
          { id: col3, title: 'Done', order: 2, boardId: id },
        ],
        tasks: [],
        createdAt: now,
        updatedAt: now,
      };
      return {
        boards: [...state.boards, board],
        activeBoardId: id,
      };
    }

    case 'UPDATE_BOARD_TITLE':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.boardId ? { ...b, title: action.title, updatedAt: now } : b
        ),
      };

    case 'DELETE_BOARD': {
      const boards = state.boards.filter(b => b.id !== action.boardId);
      const activeBoardId = action.boardId === state.activeBoardId
        ? (boards[0]?.id ?? null)
        : state.activeBoardId;
      return { boards, activeBoardId };
    }

    case 'CREATE_COLUMN': {
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const order = b.columns.length;
          const col: Column = {
            id: generateId(),
            title: action.title,
            order,
            boardId: action.boardId,
          };
          return { ...b, columns: [...b.columns, col], updatedAt: now };
        }),
      };
    }

    case 'UPDATE_COLUMN_TITLE':
      return {
        ...state,
        boards: state.boards.map(b => ({
          ...b,
          columns: b.columns.map(c =>
            c.id === action.columnId ? { ...c, title: action.title } : c
          ),
          updatedAt: b.columns.some(c => c.id === action.columnId) ? now : b.updatedAt,
        })),
      };

    case 'DELETE_COLUMN':
      return {
        ...state,
        boards: state.boards.map(b => ({
          ...b,
          columns: b.columns.filter(c => c.id !== action.columnId),
          tasks: b.tasks.filter(t => t.columnId !== action.columnId),
          updatedAt: b.columns.some(c => c.id === action.columnId) ? now : b.updatedAt,
        })),
      };

    case 'REORDER_COLUMNS':
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const reordered = action.columnIds.map((id, idx) => {
            const col = b.columns.find(c => c.id === id)!;
            return { ...col, order: idx };
          });
          return { ...b, columns: reordered, updatedAt: now };
        }),
      };

    case 'CREATE_TASK': {
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const colTasks = b.tasks.filter(t => t.columnId === action.columnId);
          const task: Task = {
            id: generateId(),
            title: action.title,
            description: '',
            checklistItems: [],
            tagIds: [],
            columnId: action.columnId,
            order: colTasks.length,
            createdAt: now,
          };
          return { ...b, tasks: [...b.tasks, task], updatedAt: now };
        }),
      };
    }

    case 'UPDATE_TASK':
      return {
        ...state,
        boards: state.boards.map(b => ({
          ...b,
          tasks: b.tasks.map(t => t.id === action.task.id ? action.task : t),
          updatedAt: b.tasks.some(t => t.id === action.task.id) ? now : b.updatedAt,
        })),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        boards: state.boards.map(b => ({
          ...b,
          tasks: b.tasks.filter(t => t.id !== action.taskId),
          updatedAt: b.tasks.some(t => t.id === action.taskId) ? now : b.updatedAt,
        })),
      };

    case 'REORDER_TASKS':
      return {
        ...state,
        boards: state.boards.map(b => ({
          ...b,
          tasks: b.tasks.map(t => {
            const idx = action.taskIds.indexOf(t.id);
            if (idx === -1) return t;
            return { ...t, order: idx };
          }),
          updatedAt: now,
        })),
      };

    case 'MOVE_TASK_CROSS_COLUMN':
      return {
        ...state,
        boards: state.boards.map(b => {
          const involvedTasks = b.tasks.some(t => t.id === action.taskId);
          if (!involvedTasks) return b;
          return {
            ...b,
            tasks: b.tasks.map(t => {
              if (t.id === action.taskId) {
                return { ...t, columnId: action.toColumnId, order: action.newOrder };
              }
              return t;
            }),
            updatedAt: now,
          };
        }),
      };

    case 'CREATE_TAG':
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const tag: Tag = { id: generateId(), name: action.name, color: action.color };
          return { ...b, tags: [...b.tags, tag], updatedAt: now };
        }),
      };

    case 'UPDATE_TAG':
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          return {
            ...b,
            tags: b.tags.map(t => t.id === action.tag.id ? action.tag : t),
            updatedAt: now,
          };
        }),
      };

    case 'DELETE_TAG':
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          return {
            ...b,
            tags: b.tags.filter(t => t.id !== action.tagId),
            tasks: b.tasks.map(t => ({
              ...t,
              tagIds: t.tagIds.filter(id => id !== action.tagId),
            })),
            updatedAt: now,
          };
        }),
      };

    case 'UPDATE_BOARD_VISIBILITY':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.boardId ? { ...b, visibility: action.visibility, updatedAt: now } : b
        ),
      };

    case 'IMPORT_BOARD':
      return {
        boards: [...state.boards, action.board],
        activeBoardId: action.board.id,
      };

    case 'REPLACE_STATE':
      return action.state;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BoardContextValue {
  state: AppState;
  activeBoard: Board | null;
  dispatch: React.Dispatch<Action>;
  // Helpers
  createBoard: (title: string) => void;
  updateBoardTitle: (boardId: string, title: string) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string) => void;
  createColumn: (title: string) => void;
  updateColumnTitle: (columnId: string, title: string) => void;
  deleteColumn: (columnId: string) => void;
  createTask: (columnId: string, title: string) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addChecklistItem: (task: Task, text: string) => void;
  toggleChecklistItem: (task: Task, itemId: string) => void;
  deleteChecklistItem: (task: Task, itemId: string) => void;
  updateChecklistItem: (task: Task, item: ChecklistItem) => void;
  createTag: (name: string, color: TagColor) => void;
  updateTag: (tag: Tag) => void;
  deleteTag: (tagId: string) => void;
  updateBoardVisibility: (boardId: string, visibility: 'private' | 'public') => void;
  importBoard: (board: Board) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, () => storageService.load());
  const skipNextCloudWrite = useRef(false);

  // Persist to localStorage always (offline-first)
  useEffect(() => {
    storageService.save(state);
  }, [state]);

  // When user signs in, load cloud state (cloud wins if it exists)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadFromCloud(user.uid).then((cloudState) => {
      if (cancelled) return;
      if (cloudState && cloudState.boards.length > 0) {
        skipNextCloudWrite.current = true;
        dispatch({ type: 'REPLACE_STATE', state: cloudState });
      } else {
        // First sign-in: push local state to cloud
        saveToCloud(user.uid, state);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Real-time sync: listen for changes from other devices
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCloud(user.uid, (cloudState) => {
      skipNextCloudWrite.current = true;
      dispatch({ type: 'REPLACE_STATE', state: cloudState });
    });
    return unsub;
  }, [user]);

  // Save to cloud on every state change (debounced by React batching)
  useEffect(() => {
    if (!user) return;
    if (skipNextCloudWrite.current) {
      skipNextCloudWrite.current = false;
      return;
    }
    saveToCloud(user.uid, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user?.uid]);

  const activeBoard = state.boards.find(b => b.id === state.activeBoardId) ?? null;

  const createBoard = useCallback((title: string) => dispatch({ type: 'CREATE_BOARD', title }), []);
  const updateBoardTitle = useCallback((boardId: string, title: string) =>
    dispatch({ type: 'UPDATE_BOARD_TITLE', boardId, title }), []);
  const deleteBoard = useCallback((boardId: string) => dispatch({ type: 'DELETE_BOARD', boardId }), []);
  const setActiveBoard = useCallback((boardId: string) => dispatch({ type: 'SET_ACTIVE_BOARD', boardId }), []);

  const createColumn = useCallback((title: string) => {
    if (!activeBoard) return;
    dispatch({ type: 'CREATE_COLUMN', boardId: activeBoard.id, title });
  }, [activeBoard]);

  const updateColumnTitle = useCallback((columnId: string, title: string) =>
    dispatch({ type: 'UPDATE_COLUMN_TITLE', columnId, title }), []);

  const deleteColumn = useCallback((columnId: string) =>
    dispatch({ type: 'DELETE_COLUMN', columnId }), []);

  const createTask = useCallback((columnId: string, title: string) => {
    if (!activeBoard) return;
    dispatch({ type: 'CREATE_TASK', columnId, boardId: activeBoard.id, title });
  }, [activeBoard]);

  const updateTask = useCallback((task: Task) => dispatch({ type: 'UPDATE_TASK', task }), []);
  const deleteTask = useCallback((taskId: string) => dispatch({ type: 'DELETE_TASK', taskId }), []);

  const addChecklistItem = useCallback((task: Task, text: string) => {
    const item: ChecklistItem = { id: generateId(), text, completed: false };
    dispatch({ type: 'UPDATE_TASK', task: { ...task, checklistItems: [...task.checklistItems, item] } });
  }, []);

  const toggleChecklistItem = useCallback((task: Task, itemId: string) => {
    dispatch({
      type: 'UPDATE_TASK',
      task: {
        ...task,
        checklistItems: task.checklistItems.map(i =>
          i.id === itemId ? { ...i, completed: !i.completed } : i
        ),
      },
    });
  }, []);

  const deleteChecklistItem = useCallback((task: Task, itemId: string) => {
    dispatch({
      type: 'UPDATE_TASK',
      task: { ...task, checklistItems: task.checklistItems.filter(i => i.id !== itemId) },
    });
  }, []);

  const updateChecklistItem = useCallback((task: Task, item: ChecklistItem) => {
    dispatch({
      type: 'UPDATE_TASK',
      task: {
        ...task,
        checklistItems: task.checklistItems.map(i => i.id === item.id ? item : i),
      },
    });
  }, []);

  const createTag = useCallback((name: string, color: TagColor) => {
    if (!activeBoard) return;
    dispatch({ type: 'CREATE_TAG', boardId: activeBoard.id, name, color });
  }, [activeBoard]);

  const updateTag = useCallback((tag: Tag) => {
    if (!activeBoard) return;
    dispatch({ type: 'UPDATE_TAG', boardId: activeBoard.id, tag });
  }, [activeBoard]);

  const deleteTag = useCallback((tagId: string) => {
    if (!activeBoard) return;
    dispatch({ type: 'DELETE_TAG', boardId: activeBoard.id, tagId });
  }, [activeBoard]);

  const updateBoardVisibility = useCallback((boardId: string, visibility: 'private' | 'public') =>
    dispatch({ type: 'UPDATE_BOARD_VISIBILITY', boardId, visibility }), []);

  const importBoard = useCallback((board: Board) =>
    dispatch({ type: 'IMPORT_BOARD', board }), []);

  return (
    <BoardContext.Provider value={{
      state,
      activeBoard,
      dispatch,
      createBoard,
      updateBoardTitle,
      deleteBoard,
      setActiveBoard,
      createColumn,
      updateColumnTitle,
      deleteColumn,
      createTask,
      updateTask,
      deleteTask,
      addChecklistItem,
      toggleChecklistItem,
      deleteChecklistItem,
      updateChecklistItem,
      createTag,
      updateTag,
      deleteTag,
      updateBoardVisibility,
      importBoard,
    }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider');
  return ctx;
}
