import { create } from 'zustand'
import type { Movie, Session } from '../api/client'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface RecsStore {
  // Stage: matches design's input | loading | results
  stage: 'input' | 'loading' | 'results'

  // Form state — matches design fields exactly
  mood: string
  genres: string[]
  era: string
  adult: boolean
  feeling: string      // was freeText
  liked: string[]      // was recentWatches

  // Results
  status: Status
  movies: Movie[]
  sessionId: string | null
  errorMessage: string

  // History
  history: Session[]

  // Actions
  setMood: (mood: string) => void
  toggleGenre: (genre: string) => void
  setEra: (era: string) => void
  setAdult: (adult: boolean) => void
  setFeeling: (feeling: string) => void
  setLiked: (liked: string[]) => void

  setLoading: () => void
  setSuccess: (movies: Movie[], sessionId: string) => void
  setError: (msg: string) => void
  reset: () => void

  setHistory: (sessions: Session[]) => void
  clearHistory: () => void
}

export const useRecsStore = create<RecsStore>((set) => ({
  stage: 'input',
  mood: 'melancholy',
  genres: ['Science Fiction', 'Drama'],
  era: 'any',
  adult: false,
  feeling: '',
  liked: [],

  status: 'idle',
  movies: [],
  sessionId: null,
  errorMessage: '',
  history: [],

  setMood: (mood) => set({ mood }),
  toggleGenre: (genre) => set((s) => ({
    genres: s.genres.includes(genre) ? s.genres.filter(g => g !== genre) : [...s.genres, genre]
  })),
  setEra: (era) => set({ era }),
  setAdult: (adult) => set({ adult }),
  setFeeling: (feeling) => set({ feeling }),
  setLiked: (liked) => set({ liked }),

  setLoading: () => set({ stage: 'loading', status: 'loading', errorMessage: '' }),
  setSuccess: (movies, sessionId) => set({ stage: 'results', status: 'success', movies, sessionId }),
  setError: (msg) => set({ stage: 'input', status: 'error', errorMessage: msg }),
  reset: () => set({ stage: 'input', status: 'idle', movies: [], sessionId: null, errorMessage: '' }),

  setHistory: (sessions) => set({ history: sessions }),
  clearHistory: () => set({ history: [] }),
}))
