// Shared types for the recommend pipeline (gemini → tmdb → promptBuilder → recommend).

export interface LLMRecommendation {
  title:          string
  year:           number
  genres:         string[]
  synopsis:       string
  reasoning:      string
  moodMatchScore: number
}

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
