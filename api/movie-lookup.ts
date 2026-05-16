import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchMovieById }         from './_lib/tmdb'
import { makeRateLimiter, getIp } from './_lib/rateLimit'

const checkRateLimit = makeRateLimiter(120, 60 * 60 * 1000) // 120/hr per IP

function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin',  origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'GET')    { res.status(405).json({ error: 'method_not_allowed' }); return }

  const ip = getIp(req.headers as Record<string, string | string[] | undefined>)
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'rate_limit', message: 'Too many requests. Please try again later.' })
    return
  }

  const tmdbId = parseInt(req.query.tmdbId as string)
  if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0 || tmdbId > 1_000_000_000) {
    res.status(400).json({ error: 'invalid_request', message: 'tmdbId must be a positive integer' })
    return
  }

  try {
    const movie = await fetchMovieById(tmdbId)
    if (!movie) { res.status(404).json({ error: 'not_found' }); return }
    res.status(200).json(movie)
  } catch (err: unknown) {
    console.error('MOVIE_LOOKUP ERROR:', (err as Error).message)
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' })
  }
}
