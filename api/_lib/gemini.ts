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

// Gemini 2.0 Flash: 15 RPM / 1,500 RPD on free tier
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function jitter(ms: number): number {
  return Math.floor(ms * (0.75 + Math.random() * 0.5))
}

export async function getRecommendations(userPrompt: string): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  // Vercel timeout is 30s. One Gemini call takes ~8-15s.
  // Realistic budget: 2 attempts with a short wait between them.
  // If rate-limited (429), Google's Retry-After is typically 60s — we cannot
  // honour that inside a serverless function, so we fail fast and let the
  // client show a "try again" message rather than hanging until timeout.

  const MAX_ATTEMPTS = 2

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents:          [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig:  { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0.8 },
      }),
    })

    // 429 — RPM rate limit. Retry-After is usually 60s which we can't honour.
    // Wait only if we have time (≤8s); otherwise surface the error immediately.
    if (res.status === 429) {
      if (attempt < MAX_ATTEMPTS - 1) {
        const retryAfterSec = parseInt(res.headers.get('Retry-After') ?? '0')
        const waitMs = retryAfterSec > 0
          ? retryAfterSec * 1000          // honour server hint if present
          : jitter(3000)                  // default: ~3s with jitter
        if (waitMs <= 8000) {
          await sleep(waitMs)
          continue                        // one more try
        }
      }
      throw Object.assign(new Error('Gemini rate limited'), { status: 429 })
    }

    // 503 — transient overload; one quick retry
    if (res.status === 503) {
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(jitter(1500))
        continue
      }
      throw Object.assign(new Error('Gemini overloaded'), { status: 503 })
    }

    if (!res.ok) {
      const t = await res.text()
      throw Object.assign(new Error(`Gemini error ${res.status}: ${t.slice(0, 200)}`), { status: res.status })
    }

    const data     = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
    const rawText  = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('Gemini returned empty response')

    const clean  = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean) as GeminiResponse
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0)
      throw new Error('Gemini returned no recommendations')

    return parsed
  }

  throw Object.assign(new Error('Gemini failed after retries'), { status: 429 })
}
