import type { LLMRecommendation } from './types'
export type { LLMRecommendation }

const SYSTEM_PROMPT = `You are CineAI, a world-class film curator. Give thoughtful nuanced recommendations.
CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks. Schema:
{"recommendations":[{"title":"string","year":1997,"genres":["string"],"synopsis":"2 sentences","reasoning":"3-4 sentences","moodMatchScore":94}]}`

const OPENROUTER_URL = `https://openrouter.ai/api/v1/chat/completions`
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-haiku-4.5'

/**
 * Scans streamed text for complete top-level objects inside the "recommendations"
 * array — quote/escape-aware brace counting — and returns each as soon as its
 * closing brace arrives, without waiting for the rest of the JSON response.
 */
class RecommendationStreamParser {
  private buffer  = ''
  private pos     = 0
  private started = false // seen the '[' that opens the recommendations array
  private depth   = 0
  private objStart = -1
  private inString = false
  private escape    = false

  push(chunk: string): LLMRecommendation[] {
    this.buffer += chunk
    const results: LLMRecommendation[] = []

    for (; this.pos < this.buffer.length; this.pos++) {
      const ch = this.buffer[this.pos]

      if (!this.started) {
        if (ch === '[') this.started = true
        continue
      }
      if (this.objStart === -1) {
        if (ch === '{') { this.objStart = this.pos; this.depth = 1; this.inString = false; this.escape = false }
        continue
      }
      if (this.inString) {
        if (this.escape) this.escape = false
        else if (ch === '\\') this.escape = true
        else if (ch === '"') this.inString = false
        continue
      }
      if (ch === '"') { this.inString = true; continue }
      if (ch === '{') { this.depth++; continue }
      if (ch === '}') {
        this.depth--
        if (this.depth === 0) {
          const objText = this.buffer.slice(this.objStart, this.pos + 1)
          this.objStart = -1
          try { results.push(JSON.parse(objText) as LLMRecommendation) } catch { /* incomplete/malformed — skip */ }
        }
      }
    }

    return results
  }
}

/** Streams recommendations from the LLM one at a time, as each finishes generating. */
export async function* streamRecommendations(userPrompt: string): AsyncGenerator<LLMRecommendation> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

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
      stream:           true,
    }),
  })

  if (res.status === 429) throw Object.assign(new Error('OpenRouter rate limited'), { status: 429 })
  if (res.status === 503) throw Object.assign(new Error('OpenRouter overloaded'), { status: 503 })
  if (!res.ok) {
    const t = await res.text()
    throw Object.assign(new Error(`OpenRouter error ${res.status}: ${t.slice(0, 200)}`), { status: res.status })
  }
  if (!res.body) throw new Error('OpenRouter returned no stream body')

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  const parser  = new RecommendationStreamParser()
  let sseBuffer = ''
  let count = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    sseBuffer += decoder.decode(value, { stream: true })

    let idx: number
    while ((idx = sseBuffer.indexOf('\n')) >= 0) {
      const line = sseBuffer.slice(0, idx).trim()
      sseBuffer = sseBuffer.slice(idx + 1)
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') continue

      let json: { choices?: Array<{ delta?: { content?: string } }> }
      try { json = JSON.parse(payload) } catch { continue }
      const delta = json.choices?.[0]?.delta?.content
      if (!delta) continue

      for (const rec of parser.push(delta)) {
        count++
        yield rec
      }
    }
  }

  if (count === 0) throw new Error('OpenRouter returned no recommendations')
}
