import type { Board } from '../types';
import { generateId } from '../services/storage';

export function encodeBoard(board: Board): string {
  return btoa(encodeURIComponent(JSON.stringify(board)));
}

export function decodeBoard(encoded: string): Board {
  return JSON.parse(decodeURIComponent(atob(encoded))) as Board;
}

export function getShareUrl(board: Board): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?share=${encodeBoard(board)}`;
}

export function getShareParam(): string | null {
  return new URLSearchParams(window.location.search).get('share');
}

export function clearShareParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}

/** Returns a fresh copy of the board with a new top-level ID to avoid collisions. */
export function cloneBoardForImport(board: Board): Board {
  return { ...board, id: generateId(), visibility: 'private' };
}
