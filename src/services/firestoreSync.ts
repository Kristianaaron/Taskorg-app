import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppState } from '../types';

/**
 * Each signed-in user gets a single Firestore document:
 *   users/{uid}/data/appState
 *
 * The entire AppState is stored as one document for simplicity.
 * This keeps reads/writes cheap and avoids complex sub-collection queries.
 */
function stateDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'appState');
}

/** Save the full app state to Firestore (overwrite). */
export async function saveToCloud(uid: string, state: AppState): Promise<void> {
  await setDoc(stateDocRef(uid), { state: JSON.stringify(state) });
}

/** Load app state from Firestore once. Returns null if nothing stored yet. */
export async function loadFromCloud(uid: string): Promise<AppState | null> {
  const snap = await getDoc(stateDocRef(uid));
  if (!snap.exists()) return null;
  const raw = snap.data().state;
  if (typeof raw !== 'string') return null;
  return JSON.parse(raw) as AppState;
}

/** Subscribe to real-time changes from Firestore. Returns an unsubscribe function. */
export function subscribeToCloud(
  uid: string,
  callback: (state: AppState) => void,
): Unsubscribe {
  return onSnapshot(stateDocRef(uid), (snap) => {
    if (!snap.exists()) return;
    const raw = snap.data().state;
    if (typeof raw !== 'string') return;
    try {
      callback(JSON.parse(raw) as AppState);
    } catch {
      // ignore malformed data
    }
  });
}
