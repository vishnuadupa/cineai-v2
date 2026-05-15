export interface GeminiRecommendation {
  title: string
  year: number
  genres: string[]
  synopsis: string
  reasoning: string
  moodMatchScore: number
}
export interface GeminiResponse { recommendations: GeminiRecommendation[] }

const SYSTEM_PROMPT = `You are CineAI, a world-class film curator. Give thoughtful nuanced recommendations.
CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks. Schema:
{"recommendations":[{"title":"string","year":1997,"genres":["string"],"synopsis":"2 sentences","reasoning":"3-4 sentences","moodMatchScore":94}]}`

export async function getRecommendations(userPrompt: string, retries = 3): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt))
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0.8 },
      }),
    })
    if (res.status === 429 || res.status === 503) {
      lastError = Object.assign(new Error('Gemini busy'), { status: res.status })
      continue
    }
    if (!res.ok) {
      const t = await res.text()
      throw Object.assign(new Error(`Gemini API error ${res.status}: ${t.slice(0,200)}`), { status: res.status })
    }
    const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('Gemini empty response')
    const clean = rawText.replace(/^```jsons*/i, '').replace(/```s*$/i, '').trim()
    const parsed = JSON.parse(clean) as GeminiResponse
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0)
      throw new Error('Gemini missing recommendations')
    return parsed
  }
  throw lastError ?? new Error('Gemini failed')
}
