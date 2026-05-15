import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Session }  from './_lib/mongodb'
import { getRecommendations }  from './_lib/gemini'
import { enrichWithTMDB }      from './_lib/tmdb'
import { buildPrompt, type RecommendRequest } from './_lib/promptBuilder'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function setCORS(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function isValidRequest(body: unknown): body is RecommendRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.userId  === 'string' && b.userId.trim().length > 0 &&
    typeof b.feeling === 'string' && b.feeling.trim().length > 0 &&
    Array.isArray(b.genres) &&
    Array.isArray(b.liked)
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method_not_allowed' }); return }
  if (!isValidRequest(req.body)) {
    res.status(400).json({ error: 'invalid_request', message: 'userId and feeling required' })
    return
  }

  const request = req.body as RecommendRequest

  try {
    await connectDB()

    // Get history for context
    const history = await Session.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(5).lean()

    // Build prompt with all new fields
    const userPrompt = buildPrompt(request, history as any)

    // Call Gemini
    const geminiResponse = await getRecommendations(userPrompt)

    // Enrich with TMDB — now returns full shape with runtime, director, cast, backdrop
    const enriched = await enrichWithTMDB(geminiResponse.recommendations)

    // Save session — store both old and new field names for backwards compatibility
    const session = await Session.create({
      userId:    request.userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
      input: {
        mood:          request.mood,
        genres:        request.genres,
        era:           request.era,
        adult:         request.adult,
        feeling:       request.feeling,
        freeText:      request.feeling,   // backwards compat
        recentWatches: request.liked,
        liked:         request.liked,
      },
      recommendations: enriched.map(r => ({
        title:    r.title,
        year:     r.year,
        runtime:  r.runtime,
        rating:   r.rating,
        match:    r.match,
        genres:   r.genres,
        director: r.director,
        cast:     r.cast,
        overview: r.overview,
        reason:   r.reason,
        poster:   r.poster,
        backdrop: r.backdrop,
        accent:   r.accent,
        // also store old field names
        synopsis:       r.overview,
        reasoning:      r.reason,
        moodMatchScore: r.match,
        posterPath:     r.poster,
        tmdbId:         r.id,
      })),
    })

    res.status(200).json({ sessionId: String(session._id), recommendations: enriched })

  } catch (err: unknown) {
    const error = err as Error & { status?: number }
    console.error('RECOMMEND ERROR:', error.message, error.stack)
    if (error.status === 429) { res.status(429).json({ error: 'rate_limit', message: 'Too many requests' }); return }
    if (error.status === 503) { res.status(503).json({ error: 'service_unavailable', message: 'Gemini is overloaded' }); return }
    res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
