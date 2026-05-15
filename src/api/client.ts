const BASE = '/api'

export interface Movie {
  id: number | null        // TMDB id
  title: string
  year: number
  runtime: number | null
  rating: number | null
  match: number            // 0–100 from Gemini (was moodMatchScore)
  genres: string[]
  director: string | null
  cast: string[]
  overview: string         // TMDB overview (was synopsis)
  reason: string           // Gemini reasoning (was reasoning)
  poster: string | null    // full URL (was posterUrl)
  backdrop: string | null  // TMDB backdrop URL — new
  accent: string           // derived color
}

export interface RecommendRequest {
  userId: string
  mood: string
  genres: string[]
  era: string              // new: "any" | "new" | "2010s" | "classics"
  adult: boolean           // new: include 18+
  feeling: string          // was freeText
  liked: string[]          // was recentWatches
}

export interface Session {
  sessionId: string
  input: {
    freeText: string
    mood: string
    genres: string[]
    recentWatches: string[]
  }
  recommendations: Movie[]
}

export async function postRecommend(body: RecommendRequest): Promise<{ sessionId: string; recommendations: Movie[] }> {
  const res = await fetch(`${BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { status?: number }
    throw Object.assign(new Error('API error'), { response: { status: res.status, ...err } })
  }
  return res.json()
}

export async function getHistory(userId: string, limit = 5): Promise<{ sessions: Session[] }> {
  const res = await fetch(`${BASE}/history?userId=${userId}&limit=${limit}`)
  if (!res.ok) return { sessions: [] }
  return res.json()
}

export async function deleteHistory(userId: string): Promise<void> {
  await fetch(`${BASE}/history?userId=${userId}`, { method: 'DELETE' })
}
