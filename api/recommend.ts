import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Session }  from './_lib/mongodb'
import { getRecommendations }  from './_lib/gemini'
import { enrichWithTMDB, type EnrichedMovie } from './_lib/tmdb'
import { buildPrompt, type RecommendRequest, type HistorySession } from './_lib/promptBuilder'

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

// Simple in-memory rate limiter (best-effort — resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 10
const RATE_WINDOW   = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// C2 fix: restrict CORS to own domain instead of wildcard
function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// H1 + M2 fix: enforce length limits and UUID format
function isValidRequest(body: unknown): body is RecommendRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.userId  === 'string' && UUID_RE.test(b.userId) &&
    typeof b.feeling === 'string' && b.feeling.trim().length > 0 && b.feeling.length <= 500 &&
    Array.isArray(b.genres) && b.genres.length <= 20 &&
    (b.genres as unknown[]).every(g => typeof g === 'string' && g.length <= 100) &&
    Array.isArray(b.liked) && b.liked.length <= 20 &&
    (b.liked as unknown[]).every(l => typeof l === 'string' && l.length <= 100)
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method_not_allowed' }); return }

  // H3 fix: rate limit by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown'
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
    // Gemini returns 9 candidates
    const geminiResponse = await getRecommendations(userPrompt)
    // TMDB enriches all 9 with real genres, ratings, posters
    const enriched = await enrichWithTMDB(geminiResponse.recommendations)
    // Filter by TMDB genres vs what user actually asked for, then trim to 6
    const filtered = filterAndTrim(enriched, request.genres, request.adult)

    const session = await Session.create({
      userId:    request.userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
      input: {
        mood:          request.mood,
        genres:        request.genres,
        era:           request.era,
        adult:         request.adult,
        feeling:       request.feeling,
        freeText:      request.feeling,
        recentWatches: request.liked,
        liked:         request.liked,
      },
      recommendations: filtered.map(r => ({
        title:          r.title,
        year:           r.year,
        runtime:        r.runtime,
        rating:         r.rating,
        match:          r.match,
        genres:         r.genres,
        director:       r.director,
        cast:           r.cast,
        overview:       r.overview,
        reason:         r.reason,
        poster:         r.poster,
        backdrop:       r.backdrop,
        accent:         r.accent,
        synopsis:       r.overview,
        reasoning:      r.reason,
        moodMatchScore: r.match,
        posterPath:     r.poster,
        tmdbId:         r.id,
      })),
    })

    res.status(200).json({ sessionId: String(session._id), recommendations: filtered })

  } catch (err: unknown) {
    const error = err as Error & { status?: number }
    // L3 fix: log message only, no stack trace with file paths
    console.error('RECOMMEND ERROR:', error.message)
    if (error.status === 429) { res.status(429).json({ error: 'rate_limit', message: 'Too many requests' }); return }
    if (error.status === 503) { res.status(503).json({ error: 'service_unavailable', message: 'Gemini is overloaded' }); return }
    // H2 fix: never leak internal error.message to the client
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' })
  }
}
