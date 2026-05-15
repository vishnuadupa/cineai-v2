const GEMINI_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

export interface GeminiRecommendation {
  title:          string
  year:           number
  genres:         string[]
  synopsis:       string
  reasoning:      string
  moodMatchScore: number
}

export interface GeminiResponse {
  recommendations: GeminiRecommendation[]
}

const SYSTEM_PROMPT = `You are CineAI, a world-class film curator with encyclopedic knowledge of cinema across all genres, eras, and cultures. You give thoughtful, nuanced recommendations and explain your reasoning in a warm, intelligent voice — like a brilliant friend who has seen every movie ever made.

CRITICAL: Respond ONLY with a valid JSON object. No markdown, no backticks, no preamble. Exact schema:
{
  "recommendations": [
    {
      "title": "string",
      "year": 1997,
      "genres": ["string"],
      "synopsis": "string — 2 sentences max",
      "reasoning": "string — 3-4 sentences, specific to this user's request",
      "moodMatchScore": 94
    }
  ]
}`

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getRecommendations(
  userPrompt: string,
  retries = 2
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')

  const url = `${GEMINI_BASE}?key=${apiKey}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      temperature: 0.8,
    },
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 2s, 4s
      await sleep(2000 * attempt)
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      lastError = Object.assign(new Error('Gemini rate limit exceeded'), { status: 429 })
      continue
    }

    if (!res.ok) {
      const text = await res.text()
      throw Object.assign(
        new Error(`Gemini API error ${res.status}: ${text.slice(0, 200)}`),
        { status: res.status }
      )
    }

    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('Gemini returned empty response')

    // Strip markdown fences if present despite instructions
    const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    const parsed = JSON.parse(clean) as GeminiResponse

    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      throw new Error('Gemini response missing recommendations array')
    }

    return parsed
  }

  throw lastError ?? new Error('Gemini request failed after retries')
}
