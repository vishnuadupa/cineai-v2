import type { Session } from '../api/client'

const STORAGE_KEY = 'cineai_history'
const MAX_SESSIONS = 20

export function getLocalHistory(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Session[] : []
  } catch {
    return []
  }
}

export function addLocalSession(session: Session): void {
  try {
    const sessions = [session, ...getLocalHistory()].slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch { /* storage unavailable — skip saving */ }
}

export function clearLocalHistory(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

/** Titles from the last 3 sessions, for the "avoid repeating" prompt context */
export function getRecentTitles(): string[] {
  return getLocalHistory()
    .slice(0, 3)
    .flatMap(s => s.recommendations.slice(0, 3).map(r => r.title))
}
