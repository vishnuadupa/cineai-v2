// Shared in-process rate limiter.
// Each Vercel function is its own process so this map is local to one instance —
// that's accepted as "best-effort". It still stops naive scripted abuse.

interface Bucket { count: number; resetAt: number }

export function makeRateLimiter(maxPerWindow: number, windowMs: number) {
  const map = new Map<string, Bucket>()

  return function check(ip: string): boolean {
    const now   = Date.now()
    const entry = map.get(ip)
    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (entry.count >= maxPerWindow) return false
    entry.count++
    return true
  }
}

export function getIp(headers: Record<string, string | string[] | undefined>): string {
  const fwd = headers['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  // x-forwarded-for can be a comma-separated list; take the first (client) IP
  return raw?.split(',')[0]?.trim() ?? 'unknown'
}
