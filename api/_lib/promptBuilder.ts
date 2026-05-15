export interface RecommendRequest {
  userId:   string
  mood:     string
  genres:   string[]
  era:      string        // "any" | "new" | "2010s" | "classics"
  adult:    boolean
  feeling:  string        // free text (was freeText)
  liked:    string[]      // film titles (was recentWatches)
}

export interface HistorySession {
  createdAt: Date | string
  input: { freeText?: string; feeling?: string }
  recommendations: Array<{ title: string }>
}

const ERA_MAP: Record<string, string> = {
  any:      'any era',
  new:      'released in the last 5 years (2020–2025)',
  '2010s':  'released between 2010 and 2019',
  classics: 'released before 2000',
}

export function buildPrompt(request: RecommendRequest, history: HistorySession[]): string {
  const { mood, genres, era, adult, feeling, liked } = request
  const recentHistory = history.slice(-3)

  let historyContext = ''
  if (recentHistory.length > 0) {
    const lines = recentHistory.map(s => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const titles = s.recommendations.slice(0, 3).map(r => r.title).join(', ')
      const freeText = s.input.feeling ?? s.input.freeText ?? ''
      return `- ${date}: asked for "${freeText}" → got: ${titles}`
    })
    historyContext = `\n\nUser's recent sessions (avoid repeating, understand evolving taste):\n${lines.join('\n')}`
  }

  return `You are a world-class film curator. A user is asking for film recommendations.

User signals:
- Mood: ${mood}
- Preferred genres: ${genres.length > 0 ? genres.join(', ') : 'no preference'}
- Era preference: ${ERA_MAP[era] ?? era}
- Films they've loved: ${liked.length > 0 ? liked.join(', ') : 'none provided'}
- Free-text context: "${feeling}"
- Include 18+ titles: ${adult ? 'yes' : 'no — keep it suitable for all audiences'}
${historyContext}

Generate exactly 5 film recommendations. For each film reference SPECIFIC themes, tone, emotional beats, and cinematographic qualities. When the user has loved films, draw explicit connections. moodMatchScore = 0-100, how closely this film matches their EXACT request tonight.

${!adult ? 'Do not include films with NC-17 ratings or explicit adult content.' : ''}
Do not recommend films the user has already listed as loved.
Order best emotional fit first.`
}
