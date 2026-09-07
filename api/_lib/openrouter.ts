import type { LLMRecommendation } from './types'
export type { LLMRecommendation }
export interface LLMResponse { recommendations: LLMRecommendation[] }

const SYSTEM_PROMPT = `You are CineAI, a world-class film curator. Give thoughtful nuanced recommendations.
CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks. Schema:
{"recommendations":[{"title":"string","year":1997,"genres":["string"],"synopsis":"2 sentences","reasoning":"3-4 sentences","moodMatchScore":94}]}`

const OPENROUTER_URL = `https://openrouter.ai/api/v1/chat/completions`
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-haiku-4.5'

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function jitter(ms: number): number {
  return Math.floor(ms * (0.75 + Math.random() * 0.5))
}

export async function getRecommendations(userPrompt: string): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  // Vercel timeout is 30s. One call takes ~8-15s.
  // Realistic budget: 2 attempts with a short wait between them.
  const MAX_ATTEMPTS = 2

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(OPENROUTER_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer':  process.env.FRONTEND_URL ?? 'http://localhost:5173',
        'X-Title':       'CineAI',
      },
      body: JSON.stringify({
        model:           OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens:       8192,
        temperature:      0.8,
      }),
    })

    // 429 — rate limit. Retry-After is often not honourable inside a serverless timeout.
    if (res.status === 429) {
      if (attempt < MAX_ATTEMPTS - 1) {
        const retryAfterSec = parseInt(res.headers.get('Retry-After') ?? '0')
        const waitMs = retryAfterSec > 0
          ? retryAfterSec * 1000
          : jitter(3000)
        if (waitMs <= 8000) {
          await sleep(waitMs)
          continue
        }
      }
      throw Object.assign(new Error('OpenRouter rate limited'), { status: 429 })
    }

    // 503 — transient overload; one quick retry
    if (res.status === 503) {
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(jitter(1500))
        continue
      }
      throw Object.assign(new Error('OpenRouter overloaded'), { status: 503 })
    }

    if (!res.ok) {
      const t = await res.text()
      throw Object.assign(new Error(`OpenRouter error ${res.status}: ${t.slice(0, 200)}`), { status: res.status })
    }

    const data    = await res.json() as { choices: Array<{ message: { content: string } }> }
    const rawText = data.choices?.[0]?.message?.content
    if (!rawText) throw new Error('OpenRouter returned empty response')

    const clean  = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean) as LLMResponse
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0)
      throw new Error('OpenRouter returned no recommendations')

    return parsed
  }

  throw Object.assign(new Error('OpenRouter failed after retries'), { status: 429 })
}
