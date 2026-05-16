import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Watchlist } from './_lib/mongodb'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin',  origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCORS(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

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
      const { movieId, title, year, poster, backdrop, genres, rating, runtime, overview } = body ?? {}
      if (!movieId || !title || typeof title !== 'string') {
        res.status(400).json({ error: 'invalid_request', message: 'movieId and title required' })
        return
      }
      await Watchlist.findOneAndUpdate(
        { userId, movieId: Number(movieId) },
        { userId, movieId: Number(movieId), title: String(title).slice(0, 200), year, poster, backdrop, genres, rating, runtime, overview, addedAt: new Date() },
        { upsert: true, new: true },
      )
      res.status(200).json({ success: true })
      return
    }

    // DELETE — remove from watchlist
    if (req.method === 'DELETE') {
      const movieId = parseInt(req.query.movieId as string)
      if (!movieId || isNaN(movieId)) {
        res.status(400).json({ error: 'invalid_request', message: 'movieId required' })
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
