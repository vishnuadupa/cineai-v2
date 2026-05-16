export interface GeminiRecommendation {
  title:          string
  year:           number
  genres:         string[]
  synopsis:       string
  reasoning:      string
  moodMatchScore: number
}
export interface GeminiResponse { recommendations: GeminiRecommendation[] }

const SYSTEM_PROMPT = `You are CineAI, a world-class film curator. Give thoughtful nuanced recommendations.
CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks. Schema:
{"recommendations":[{"title":"string","year":1997,"genres":["string"],"synopsis":"2 sentences","reasoning":"3-4 sentences","moodMatchScore":94}]}`

// Gemini 2.0 Flash: 15 RPM / 1,500 RPD on free tier (vs 2.5-flash-preview: 10 RPM / 500 RPD)
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Max total wait we're willing to burn on retries (Vercel function timeout is 30s)
const MAX_RETRY_MS  = 18_000
// Base backoff: 800ms, 1.6s, 3.2s — fast enough to fit inside the budget
const BASE_DELAY_MS = 800

function jitter(ms: number): number {
  // ±25% random jitter to avoid thundering herd
  return ms * (0.75 + Math.random() * 0.5)
}

export async function getRecommendations(userPrompt: string): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const MAX_ATTEMPTS = 4
  let lastError: Error & { status?: number } = new Error('Gemini failed')
  let totalWaited = 0

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with jitter; bail early if we'd exceed the budget
      const delay = jitter(BASE_DELAY_MS * Math.pow(2, attempt - 1))
      if (totalWaited + delay > MAX_RETRY_MS) break
      await new Promise(r => setTimeout(r, delay))
      totalWaited += delay
    }

    const res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents:         [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig:  { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0.8 },
      }),
    })

    // 429 — rate limited. Respect Retry-After if provided, otherwise back off
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0') * 1000
      const wait = retryAfter > 0 ? Math.min(retryAfter, MAX_RETRY_MS - totalWaited) : jitter(BASE_DELAY_MS * Math.pow(2, attempt))
      lastError = Object.assign(new Error('Gemini rate limited'), { status: 429 })
      if (totalWaited + wait > MAX_RETRY_MS) break
      await new Promise(r => setTimeout(r, wait))
      totalWaited += wait
      continue
    }

    // 503 — transient overload, retry quickly
    if (res.status === 503) {
      lastError = Object.assign(new Error('Gemini overloaded'), { status: 503 })
      continue
    }

    if (!res.ok) {
      const t = await res.text()
      throw Object.assign(new Error(`Gemini API error ${res.status}: ${t.slice(0, 200)}`), { status: res.status })
    }

    const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('Gemini empty response')

    const clean  = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean) as GeminiResponse
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0)
      throw new Error('Gemini missing recommendations')

    return parsed
  }

  throw lastError
}
