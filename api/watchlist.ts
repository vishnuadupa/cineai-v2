import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Watchlist } from './_lib/mongodb'
import { makeRateLimiter, getIp } from './_lib/rateLimit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Watchlist reads/writes are cheap but still need a guard against scripted abuse
const checkRateLimit = makeRateLimiter(120, 60 * 60 * 1000) // 120/hr per IP

function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin',  origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

/** Clamp and sanitize a string field; returns null if not a non-empty string */
function str(val: unknown, maxLen: number): string | null {
  if (typeof val !== 'string' || val.trim().length === 0) return null
  return val.slice(0, maxLen)
}

/** Sanitize a number field; returns null if not a finite positive number */
function num(val: unknown, max = 1_000_000): number | null {
  const n = Number(val)
  if (!isFinite(n) || n < 0 || n > max) return null
  return n
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const ip = getIp(req.headers as Record<string, string | string[] | undefined>)
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'rate_limit', message: 'Too many requests. Please try again later.' })
    return
  }

  const userId = (
    typeof req.query.userId === 'string' ? req.query.userId : (req.body as Record<string, unknown>)?.userId
  ) as string | undefined

  if (!userId || !UUID_RE.test(userId)) {
    res.status(400).json({ error: 'invalid_request', message: 'Valid userId required' })
    return
  }

  try {
    await connectDB()

    // GET — list watchlist
    if (req.method === 'GET') {
      const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).limit(200).lean()
      res.status(200).json({ items })
      return
    }

    // POST — add to watchlist
    if (req.method === 'POST') {
      const body = req.body as Record<string, unknown>

      const movieId = num(body?.movieId, 1_000_000_000)
      const title   = str(body?.title, 200)

      if (!movieId || !title) {
        res.status(400).json({ error: 'invalid_request', message: 'Valid movieId and title required' })
        return
      }

      // Sanitize every optional field — no raw passthrough
      const year     = num(body?.year, 2100) ?? undefined
      const rating   = num(body?.rating, 10) ?? undefined
      const runtime  = num(body?.runtime, 1000) ?? undefined
      const poster   = str(body?.poster, 500) ?? undefined
      const backdrop = str(body?.backdrop, 500) ?? undefined
      const overview = str(body?.overview, 2000) ?? undefined
      const genres   = Array.isArray(body?.genres)
        ? (body.genres as unknown[]).slice(0, 20).filter((g): g is string => typeof g === 'string').map(g => g.slice(0, 50))
        : []

      await Watchlist.findOneAndUpdate(
        { userId, movieId },
        { userId, movieId, title, year, poster, backdrop, genres, rating, runtime, overview, addedAt: new Date() },
        { upsert: true, new: true },
      )
      res.status(200).json({ success: true })
      return
    }

    // DELETE — remove from watchlist
    if (req.method === 'DELETE') {
      const movieId = num(req.query.movieId as string, 1_000_000_000)
      if (!movieId) {
        res.status(400).json({ error: 'invalid_request', message: 'Valid movieId required' })
        return
      }
      await Watchlist.deleteOne({ userId, movieId })
      res.status(200).json({ success: true })
      return
    }

    res.status(405).json({ error: 'method_not_allowed' })
  } catch (err: unknown) {
    console.error('WATCHLIST ERROR:', (err as Error).message)
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' })
  }
}
