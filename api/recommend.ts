import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Session }  from './_lib/mongodb'
import { getRecommendations }  from './_lib/openrouter'
import { enrichWithTMDB, type EnrichedMovie } from './_lib/tmdb'
import { buildPrompt, type RecommendRequest, type HistorySession } from './_lib/promptBuilder'
import { makeRateLimiter, getIp } from './_lib/rateLimit'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// Genres that naturally go together — so related picks don't get filtered out
// e.g. user picks Action → Adventure/Thriller are fine. User picks Animation → Family/Fantasy are fine.
const GENRE_AFFINITIES: Record<string, string[]> = {
  'Action':           ['Adventure', 'Thriller', 'Science Fiction', 'Crime'],
  'Adventure':        ['Action', 'Fantasy', 'Family', 'Animation', 'Science Fiction'],
  'Animation':        ['Family', 'Adventure', 'Comedy', 'Fantasy'],
  'Comedy':           ['Romance', 'Family', 'Animation', 'Drama'],
  'Crime':            ['Thriller', 'Drama', 'Mystery', 'Action'],
  'Drama':            ['Romance', 'History', 'Crime', 'Mystery', 'Music'],
  'Family':           ['Animation', 'Adventure', 'Comedy', 'Fantasy'],
  'Fantasy':          ['Adventure', 'Animation', 'Family', 'Science Fiction'],
  'History':          ['Drama', 'War', 'Documentary'],
  'Horror':           ['Thriller', 'Mystery', 'Science Fiction'],
  'Music':            ['Drama', 'Documentary', 'Comedy'],
  'Mystery':          ['Thriller', 'Crime', 'Horror', 'Drama'],
  'Romance':          ['Drama', 'Comedy'],
  'Science Fiction':  ['Action', 'Adventure', 'Thriller', 'Fantasy', 'Horror'],
  'Thriller':         ['Horror', 'Mystery', 'Crime', 'Action', 'Drama'],
  'War':              ['History', 'Drama', 'Action'],
  'Western':          ['Action', 'Adventure', 'Drama'],
  'Documentary':      ['History', 'Music'],
}

function filterAndTrim(
  films: EnrichedMovie[],
  requestedGenres: string[],
  adult: boolean
): EnrichedMovie[] {
  let results = films

  if (requestedGenres.length > 0) {
    // Build affinity set for fallback (adjacent genres e.g. Action→Adventure)
    const affinities = new Set<string>()
    requestedGenres.forEach(g => {
      const related = GENRE_AFFINITIES[g] ?? []
      related.forEach(r => affinities.add(r))
    })

    results = results.filter(film => {
      if (film.genres.length === 0) return true // no TMDB data — give benefit of doubt

      // PRIMARY: film must have at least one of the user's exact requested genres
      const directMatch = film.genres.some(g => requestedGenres.includes(g))
      if (directMatch) return true

      // SECONDARY: allow affinity genres ONLY if they don't contradict the request
      // e.g. user wants Horror → Thriller is fine. But Animation→live action Family is NOT.
      const affinityMatch = film.genres.some(g => affinities.has(g))

      // Block affinity-only matches when user picked a format-defining genre
      // (Animation, Documentary) — these are specific formats, not just themes
      const formatGenres = ['Animation', 'Documentary']
      const userPickedFormat = requestedGenres.some(g => formatGenres.includes(g))
      if (userPickedFormat) return false // must be exact match for format genres

      return affinityMatch
    })
  }

  // Adult toggle: only strip TMDB-tagged explicit "Adult" content when adult=false
  if (!adult) {
    results = results.filter(film => !film.genres.includes('Adult'))
  }

  return results.slice(0, 6)
}

// UUID v4 validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 10 recommend requests per IP per hour (LLM calls are expensive)
const checkRateLimit = makeRateLimiter(10, 60 * 60 * 1000)

// Allowlists for enum fields — stops arbitrary strings reaching the prompt
const VALID_MOODS = new Set(['melancholy','thrilled','curious','comfort','awe','unsettled','tender','playful'])
const VALID_ERAS  = new Set(['any','new','2010s','classics'])

// C2 fix: restrict CORS to own domain instead of wildcard
function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function isValidRequest(body: unknown): body is RecommendRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    // Identity
    typeof b.userId  === 'string' && UUID_RE.test(b.userId) &&
    // Enum fields — must match the UI values exactly; stops arbitrary prompt injection
    typeof b.mood    === 'string' && VALID_MOODS.has(b.mood) &&
    typeof b.era     === 'string' && VALID_ERAS.has(b.era) &&
    // Boolean — must be actual boolean, not a truthy string bypassing adult filter
    typeof b.adult   === 'boolean' &&
    // Free text — non-empty and length-capped
    typeof b.feeling === 'string' && b.feeling.trim().length > 0 && b.feeling.length <= 500 &&
    // Arrays — capped count and per-item length
    Array.isArray(b.genres) && b.genres.length <= 17 &&
    (b.genres as unknown[]).every(g => typeof g === 'string' && g.length <= 50) &&
    Array.isArray(b.liked) && b.liked.length <= 10 &&
    (b.liked as unknown[]).every(l => typeof l === 'string' && l.trim().length > 0 && l.length <= 100)
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method_not_allowed' }); return }

  const ip = getIp(req.headers as Record<string, string | string[] | undefined>)
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'rate_limit', message: 'Too many requests. Please try again later.' })
    return
  }

  if (!isValidRequest(req.body)) {
    res.status(400).json({ error: 'invalid_request', message: 'Invalid request parameters' })
    return
  }

  const request = req.body as RecommendRequest

  try {
    await connectDB()

    const history = await Session.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(5).lean()
    const userPrompt = buildPrompt(request, history as unknown as HistorySession[])
    // LLM returns 9 candidates
    const llmResponse = await getRecommendations(userPrompt)
    // TMDB enriches all 9 with real genres, ratings, posters
    const enriched = await enrichWithTMDB(llmResponse.recommendations)
    // Filter by TMDB genres vs what user actually asked for, then trim to 6
    const filtered = filterAndTrim(enriched, request.genres, request.adult)

    const session = await Session.create({
      userId:    request.userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
      input: {
        mood:          request.mood,
        genres:        request.genres,
        recentWatches: request.liked,
        freeText:      request.feeling,
      },
      recommendations: filtered.map(r => ({
        title:          r.title,
        year:           r.year,
        genres:         r.genres,
        synopsis:       r.overview,
        reasoning:      r.reason,
        tmdbId:         r.id,
        posterPath:     r.poster,
        rating:         r.rating,
        moodMatchScore: r.match,
      })),
    })

    res.status(200).json({ sessionId: String(session._id), recommendations: filtered })

  } catch (err: unknown) {
    const error = err as Error & { status?: number }
    // L3 fix: log message only, no stack trace with file paths
    console.error('RECOMMEND ERROR:', error.message)
    if (error.status === 429) { res.status(429).json({ error: 'rate_limit', message: 'Too many requests' }); return }
    if (error.status === 503) { res.status(503).json({ error: 'service_unavailable', message: 'Model provider is overloaded' }); return }
    // H2 fix: never leak internal error.message to the client
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' })
  }
}
