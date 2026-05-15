import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'cineai_user_id'

export function getUserId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = uuidv4()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // localStorage unavailable (SSR, private mode edge case)
    return uuidv4()
  }
}

export function clearUserId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
