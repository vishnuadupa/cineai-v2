const BASE = '/api'

export interface Movie {
  id:       number | null   // TMDB id
  title:    string
  year:     number
  runtime:  number | null
  rating:   number | null
  match:    number          // 0–100 from Gemini
  genres:   string[]
  director: string | null
  cast:     string[]
  overview: string
  reason:   string          // Gemini reasoning
  poster:   string | null
  backdrop: string | null
  accent:   string
}

export interface RecommendRequest {
  userId:  string
  mood:    string
  genres:  string[]
  era:     string           // "any" | "new" | "2010s" | "classics"
  adult:   boolean
  feeling: string
  liked:   string[]
}

export interface Session {
  sessionId: string
  createdAt: string | Date
  input: {
    freeText:      string
    mood:          string
    genres:        string[]
    recentWatches: string[]
  }
  recommendations: Array<{
    title:     string
    year:      number
    poster:    string | null
    rating:    number | null
    genres:    string[]
    reasoning: string
  }>
}

// ── Extra detail fetched lazily when user opens a film ──────────────────────

export interface WatchProvider {
  provider_id:   number
  provider_name: string
  logo_path:     string
}

export interface SimilarMovie {
  id:     number
  title:  string
  year:   number
  poster: string | null
  rating: number | null
}

export interface MovieDetails {
  providers:     WatchProvider[]
  trailerKey:    string | null
  keywords:      string[]
  certification: string | null
  similar:       SimilarMovie[]
  inWatchlist:   boolean
}

export interface WatchlistItem {
  movieId:  number
  title:    string
  year:     number
  poster:   string | null
  backdrop: string | null
  genres:   string[]
  rating:   number | null
  runtime:  number | null
  overview: string
  addedAt:  string | Date
}

// ── API functions ───────────────────────────────────────────────────────────

export async function postRecommend(body: RecommendRequest): Promise<{ sessionId: string; recommendations: Movie[] }> {
  const res = await fetch(`${BASE}/recommend`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { status?: number }
    throw Object.assign(new Error('API error'), { response: { status: res.status, ...err } })
  }
  return res.json()
}

export async function getHistory(userId: string, limit = 20): Promise<{ sessions: Session[] }> {
  const res = await fetch(`${BASE}/history?userId=${userId}&limit=${limit}`)
  if (!res.ok) return { sessions: [] }
  return res.json()
}

export async function deleteHistory(userId: string): Promise<void> {
  await fetch(`${BASE}/history?userId=${userId}`, { method: 'DELETE' })
}

const DETAIL_CACHE_KEY = (id: number) => `cineai_detail_${id}`
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function getMovieDetails(tmdbId: number, userId: string): Promise<MovieDetails> {
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(DETAIL_CACHE_KEY(tmdbId))
    if (cached) {
      const { data, ts } = JSON.parse(cached) as { data: MovieDetails; ts: number }
      if (Date.now() - ts < CACHE_TTL_MS) return data
    }
  } catch { /* ignore storage errors */ }

  const res = await fetch(`${BASE}/movie-details?tmdbId=${tmdbId}&userId=${encodeURIComponent(userId)}`)
  if (!res.ok) return { providers: [], trailerKey: null, keywords: [], certification: null, similar: [], inWatchlist: false }
  const data: MovieDetails = await res.json()

  // Cache in sessionStorage (best-effort)
  try { sessionStorage.setItem(DETAIL_CACHE_KEY(tmdbId), JSON.stringify({ data, ts: Date.now() })) } catch { /* ignore */ }

  return data
}

export async function lookupMovie(tmdbId: number): Promise<Movie | null> {
  const res = await fetch(`${BASE}/movie-lookup?tmdbId=${tmdbId}`)
  if (!res.ok) return null
  return res.json()
}

export async function addToWatchlist(userId: string, movie: Movie): Promise<void> {
  await fetch(`${BASE}/watchlist`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      userId,
      movieId:  movie.id,
      title:    movie.title,
      year:     movie.year,
      poster:   movie.poster,
      backdrop: movie.backdrop,
      genres:   movie.genres,
      rating:   movie.rating,
      runtime:  movie.runtime,
      overview: movie.overview,
    }),
  })
}

export async function removeFromWatchlist(userId: string, movieId: number): Promise<void> {
  await fetch(`${BASE}/watchlist?userId=${encodeURIComponent(userId)}&movieId=${movieId}`, { method: 'DELETE' })
}

export async function getWatchlist(userId: string): Promise<{ items: WatchlistItem[] }> {
  const res = await fetch(`${BASE}/watchlist?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) return { items: [] }
  return res.json()
}
