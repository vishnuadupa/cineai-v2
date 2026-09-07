import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamRecommendations }  from './_lib/openrouter'
import { enrichOneWithTMDB, discoverCandidates, type EnrichedMovie } from './_lib/tmdb'
import { buildPrompt, type RecommendRequest } from './_lib/promptBuilder'
import { makeRateLimiter, getIp } from './_lib/rateLimit'

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

function passesFilter(film: EnrichedMovie, requestedGenres: string[], adult: boolean): boolean {
  if (requestedGenres.length > 0 && film.genres.length > 0) {
    // PRIMARY: film must have at least one of the user's exact requested genres
    const directMatch = film.genres.some(g => requestedGenres.includes(g))
    if (!directMatch) {
      // SECONDARY: allow affinity genres ONLY if they don't contradict the request
      // e.g. user wants Horror → Thriller is fine. But Animation→live action Family is NOT.
      const affinities = new Set<string>()
      requestedGenres.forEach(g => (GENRE_AFFINITIES[g] ?? []).forEach(r => affinities.add(r)))
      const affinityMatch = film.genres.some(g => affinities.has(g))

      // Block affinity-only matches when user picked a format-defining genre
      // (Animation, Documentary) — these are specific formats, not just themes
      const formatGenres = ['Animation', 'Documentary']
      const userPickedFormat = requestedGenres.some(g => formatGenres.includes(g))
      if (userPickedFormat || !affinityMatch) return false
    }
  }

  // Adult toggle: only strip TMDB-tagged explicit "Adult" content when adult=false
  if (!adult && film.genres.includes('Adult')) return false

  return true
}

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
    (b.liked as unknown[]).every(l => typeof l === 'string' && l.trim().length > 0 && l.length <= 100) &&
    Array.isArray(b.recentTitles) && b.recentTitles.length <= 15 &&
    (b.recentTitles as unknown[]).every(t => typeof t === 'string' && t.length <= 200)
  )
}

const MAX_ACCEPTED = 6

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

  // Streams movies down as newline-delimited JSON as soon as each is enriched and
  // passes the genre/adult filter — the client renders cards as they arrive instead
  // of waiting ~10-15s for the LLM to finish generating all candidates.
  let streaming = false
  try {
    const candidates = await discoverCandidates({
      genres: request.genres, era: request.era, adult: request.adult, likedTitles: request.liked,
    })
    const userPrompt = buildPrompt(request, candidates)
    let index = 0
    let accepted = 0

    for await (const rec of streamRecommendations(userPrompt)) {
      if (accepted >= MAX_ACCEPTED) break

      const movie = await enrichOneWithTMDB(rec, index++)
      if (!passesFilter(movie, request.genres, request.adult)) continue

      if (!streaming) {
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8' })
        streaming = true
      }
      res.write(JSON.stringify(movie) + '\n')
      accepted++
    }

    if (!streaming) res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8' })
    res.end()

  } catch (err: unknown) {
    const error = err as Error & { status?: number }
    // L3 fix: log message only, no stack trace with file paths
    console.error('RECOMMEND ERROR:', error.message)
    if (streaming) { res.end(); return } // already sent partial results — just close

    if (error.status === 429) { res.status(429).json({ error: 'rate_limit', message: 'Too many requests' }); return }
    if (error.status === 503) { res.status(503).json({ error: 'service_unavailable', message: 'Model provider is overloaded' }); return }
    // H2 fix: never leak internal error.message to the client
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' })
  }
}
