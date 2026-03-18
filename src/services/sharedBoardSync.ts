import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Board } from '../types';

export interface GuestComment {
  id: string;
  taskId: string;
  text: string;
  authorName: string;
  createdAt: string;
}

/**
 * Publish a board snapshot to sharedBoards/{boardId} so guests can read it.
 * Only the authenticated owner calls this.
 */
export async function publishSharedBoard(board: Board): Promise<void> {
  await setDoc(doc(db, 'sharedBoards', board.id), {
    data: JSON.stringify(board),
    updatedAt: new Date().toISOString(),
  });
}

/** Subscribe to a live board snapshot (guests and owner). */
export function subscribeToSharedBoard(
  boardId: string,
  callback: (board: Board) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'sharedBoards', boardId), (snap) => {
    if (!snap.exists()) return;
    try {
      callback(JSON.parse(snap.data().data) as Board);
    } catch {
      // ignore malformed data
    }
  });
}

/** Subscribe to guest comments for a shared board, ordered by time. */
export function subscribeToGuestComments(
  boardId: string,
  callback: (comments: GuestComment[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'sharedBoards', boardId, 'guestComments'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GuestComment, 'id'>) })),
    );
  });
}

/** Post a guest comment — no auth required. */
export async function postGuestComment(
  boardId: string,
  taskId: string,
  text: string,
  authorName: string,
): Promise<void> {
  await addDoc(collection(db, 'sharedBoards', boardId, 'guestComments'), {
    taskId,
    text,
    authorName,
    createdAt: new Date().toISOString(),
  });
}
