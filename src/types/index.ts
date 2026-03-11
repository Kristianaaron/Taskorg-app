export type TagColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  checklistItems: ChecklistItem[];
  tagIds: string[];
  columnId: string;
  order: number;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
}

export interface Board {
  id: string;
  title: string;
  visibility: 'private' | 'public';
  tags: Tag[];
  columns: Column[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  boards: Board[];
  activeBoardId: string | null;
}
