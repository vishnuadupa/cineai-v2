import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB, Session } from './_lib/mongodb'

function setCORS(res: VercelResponse): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  setCORS(res)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const userId = req.query.userId as string | undefined
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    res.status(400).json({ error: 'invalid_request', message: 'userId query param required' })
    return
  }

  try {
    await connectDB()

    if (req.method === 'GET') {
      const limitParam = req.query.limit
      const limit = Math.min(
        parseInt(typeof limitParam === 'string' ? limitParam : '5', 10) || 5,
        20 // hard cap
      )

      const sessions = await Session
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()

      res.status(200).json({
        sessions: sessions.map(s => ({
          sessionId:       String(s._id),
          createdAt:       s.createdAt,
          input:           s.input,
          recommendations: s.recommendations,
        })),
      })
      return
    }

    if (req.method === 'DELETE') {
      const result = await Session.deleteMany({ userId })
      res.status(200).json({
        deleted: result.deletedCount,
        message: 'History cleared',
      })
      return
    }

    res.status(405).json({ error: 'method_not_allowed' })
  } catch {
    res.status(500).json({ error: 'internal_error' })
  }
}
