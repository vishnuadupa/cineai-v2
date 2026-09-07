import type { WatchlistItem } from '../api/client'

const STORAGE_KEY = 'cineai_watchlist'

export function getLocalWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as WatchlistItem[] : []
  } catch {
    return []
  }
}

function saveLocalWatchlist(items: WatchlistItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function isInLocalWatchlist(movieId: number): boolean {
  return getLocalWatchlist().some(i => i.movieId === movieId)
}

export function addToLocalWatchlist(item: WatchlistItem): void {
  const items = getLocalWatchlist().filter(i => i.movieId !== item.movieId)
  saveLocalWatchlist([{ ...item, addedAt: new Date().toISOString() }, ...items])
}

export function removeFromLocalWatchlist(movieId: number): void {
  saveLocalWatchlist(getLocalWatchlist().filter(i => i.movieId !== movieId))
}
