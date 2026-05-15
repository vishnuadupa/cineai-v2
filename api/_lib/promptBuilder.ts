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

  let historyContext = ''
  if (recentHistory.length > 0) {
    const lines = recentHistory.map(s => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const titles = s.recommendations.slice(0, 3).map(r => r.title).join(', ')
      const freeText = s.input.feeling ?? s.input.freeText ?? ''
      return `- ${date}: asked for "${freeText}" → got: ${titles}`
    })
    historyContext = `\n\nUser recent sessions (avoid repeating, understand evolving taste):\n${lines.join('\n')}`
  }

  const adultInstruction = adult
    ? 'You MAY include films with mature content, erotic themes, nudity, graphic violence, or adult romantic content if they genuinely fit the mood. Include NC-17 and unrated films if relevant.'
    : 'Do NOT include films rated NC-17 or with explicit sexual content. Keep recommendations suitable for general audiences.'
fix: 12 films + adult toggle mature/erotic content  return `You are a world-class film curator. A user wants exactly 12 film recommendations.

User signals:
- Mood: ${mood}
- Preferred genres: ${genres.length > 0 ? genres.join(', ') : 'no preference'}
- Era preference: ${ERA_MAP[era] ?? era}
- Films they have loved: ${liked.length > 0 ? liked.join(', ') : 'none provided'}
- Free-text context: "${feeling}"
- Adult content: ${adult ? 'YES - include mature/erotic/adult content if it fits' : 'NO - keep it clean'}
${historyContext}

IMPORTANT: You MUST return EXACTLY 12 recommendations. Not 5, not 10 - exactly 12.

${adultInstruction}

For each film reference SPECIFIC themes, tone, emotional beats, and cinematographic qualities. When the user has loved films, draw explicit connections. moodMatchScore = 0-100 how closely this film matches their EXACT request tonight.

Do not recommend films the user has already listed as loved.
Order best emotional fit first.

Return exactly 12 films as a JSON array.`
}
