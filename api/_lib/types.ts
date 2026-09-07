// Shared types for the recommend pipeline (openrouter → tmdb → promptBuilder → recommend).

export interface LLMRecommendation {
  title:          string
  year:           number
  genres:         string[]
  synopsis:       string
  reasoning:      string
  moodMatchScore: number
}

export interface RecommendRequest {
  mood:         string
  genres:       string[]
  era:          string
  adult:        boolean
  feeling:      string
  liked:        string[]
  recentTitles: string[]  // titles from the client's local history — avoid repeating these
}
