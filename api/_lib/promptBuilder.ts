export interface RecommendRequest {
  userId:   string
  mood:     string
  genres:   string[]
  era:      string
  adult:    boolean
  feeling:  string
  liked:    string[]
}

export interface HistorySession {
  createdAt: Date | string
  input: { freeText?: string; feeling?: string }
  recommendations: Array<{ title: string }>
}

const ERA_MAP: Record<string, string> = {
  any:      'any era',
  new:      'released in the last 5 years (2020-2025)',
  '2010s':  'released between 2010 and 2019',
  classics: 'released before 2000',
}

export function buildPrompt(request: RecommendRequest, history: HistorySession[]): string {
  const { mood, genres, era, adult, feeling, liked } = request
  const recentHistory = history.slice(-3)

  // M1 fix: sanitize and truncate history data before injecting into prompt
  const sanitize = (s: string, max: number) => s.slice(0, max).replace(/["`\\]/g, "'")

  let historyContext = ''
  if (recentHistory.length > 0) {
    const lines = recentHistory.map(s => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const titles = s.recommendations.slice(0, 3).map(r => sanitize(r.title, 80)).join(', ')
      const freeText = sanitize(s.input.feeling ?? s.input.freeText ?? '', 200)
      return `- ${date}: asked for "${freeText}" and got: ${titles}`
    })
    historyContext = `\n\nUser recent sessions (avoid repeating):\n${lines.join('\n')}`
  }

  const adultInstruction = adult
    ? 'You MAY include films with mature content, erotic themes, explicit romance, nudity, or graphic violence if they fit the mood. NC-17 and unrated films are allowed.'
    : 'Do NOT include horror, slasher, gore, psychological horror, or any film primarily designed to frighten or disturb. Do NOT include NC-17 or films with explicit sexual content. Keep all recommendations family-friendly and emotionally safe.'

  const toneInstruction = liked.length > 0
    ? `IMPORTANT: The user listed films they love. Use these to infer their preferred tone, audience level, and style. If their liked films are family-friendly animated movies, do NOT recommend horror, dark thrillers, or adult dramas — stay tonally consistent with what they already love.`
    : ''

  return `You are a world-class film curator. Return EXACTLY 9 film recommendations as JSON.

User signals:
- Mood: ${mood}
- Preferred genres: ${genres.length > 0 ? genres.join(', ') : 'no preference'}
- Era preference: ${ERA_MAP[era] ?? 'any era'}
- Films they have loved: ${liked.length > 0 ? liked.join(', ') : 'none provided'}
- What they want tonight: "${feeling}"${historyContext}

RULES:
1. Return EXACTLY 9 recommendations - not 6, not 12, exactly 9
2. ${adultInstruction}
3. ${toneInstruction}
4. Do not recommend films the user already listed as loved
5. Order by best emotional fit first
6. For each film reference specific themes, tone, and emotional beats
7. moodMatchScore = 0-100 how closely it matches their exact request`
        }
