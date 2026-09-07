import { getLocalHistory, addLocalSession, clearLocalHistory, getRecentTitles } from '../utils/localHistory'
import { getLocalWatchlist, isInLocalWatchlist, addToLocalWatchlist, removeFromLocalWatchlist } from '../utils/localWatchlist'

const BASE = '/api'

export interface Movie {
  id:       number | null   // TMDB id
  title:    string
  year:     number
  runtime:  number | null
  rating:   number | null
  match:    number          // 0–100 from the LLM
  genres:   string[]
  director: string | null
  cast:     string[]
  overview: string
  reason:   string          // LLM reasoning
  poster:   string | null
  backdrop: string | null
  accent:   string
}

export interface RecommendRequest {
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
    body:    JSON.stringify({ ...body, recentTitles: getRecentTitles() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { status?: number }
    throw Object.assign(new Error('API error'), { response: { status: res.status, ...err } })
  }
  const data = await res.json() as { recommendations: Movie[] }

  const sessionId = crypto.randomUUID()
  addLocalSession({
    sessionId,
    createdAt: new Date().toISOString(),
    input: {
      freeText:      body.feeling,
      mood:          body.mood,
      genres:        body.genres,
      recentWatches: body.liked,
    },
    recommendations: data.recommendations.map(r => ({
      title: r.title, year: r.year, poster: r.poster, rating: r.rating, genres: r.genres, reasoning: r.reason,
    })),
  })

  return { sessionId, recommendations: data.recommendations }
}

export async function getHistory(limit = 20): Promise<{ sessions: Session[] }> {
  return { sessions: getLocalHistory().slice(0, limit) }
}

export async function deleteHistory(): Promise<void> {
  clearLocalHistory()
}

const DETAIL_CACHE_KEY = (id: number) => `cineai_detail_${id}`
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function getMovieDetails(tmdbId: number): Promise<MovieDetails> {
  type ServerDetails = Omit<MovieDetails, 'inWatchlist'>

  // Check sessionStorage cache first
  let data: ServerDetails | null = null
  try {
    const cached = sessionStorage.getItem(DETAIL_CACHE_KEY(tmdbId))
    if (cached) {
      const { data: cachedData, ts } = JSON.parse(cached) as { data: ServerDetails; ts: number }
      if (Date.now() - ts < CACHE_TTL_MS) data = cachedData
    }
  } catch { /* ignore storage errors */ }

  if (!data) {
    const res = await fetch(`${BASE}/movie-details?tmdbId=${tmdbId}`)
    data = res.ok
      ? await res.json() as ServerDetails
      : { providers: [], trailerKey: null, keywords: [], certification: null, similar: [] }

    try { sessionStorage.setItem(DETAIL_CACHE_KEY(tmdbId), JSON.stringify({ data, ts: Date.now() })) } catch { /* ignore */ }
  }

  return { ...data, inWatchlist: isInLocalWatchlist(tmdbId) }
}

export async function lookupMovie(tmdbId: number): Promise<Movie | null> {
  const res = await fetch(`${BASE}/movie-lookup?tmdbId=${tmdbId}`)
  if (!res.ok) return null
  return res.json()
}

export async function addToWatchlist(movie: Movie): Promise<void> {
  if (movie.id == null) return
  addToLocalWatchlist({
    movieId:  movie.id,
    title:    movie.title,
    year:     movie.year,
    poster:   movie.poster,
    backdrop: movie.backdrop,
    genres:   movie.genres,
    rating:   movie.rating,
    runtime:  movie.runtime,
    overview: movie.overview,
    addedAt:  new Date().toISOString(),
  })
}

export async function removeFromWatchlist(movieId: number): Promise<void> {
  removeFromLocalWatchlist(movieId)
}

export async function getWatchlist(): Promise<{ items: WatchlistItem[] }> {
  return { items: getLocalWatchlist() }
}
