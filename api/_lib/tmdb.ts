const TMDB_BASE  = 'https://api.themoviedb.org/3'
const POSTER_BASE   = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

export interface EnrichedMovie {
  id:       number | null
  title:    string
  year:     number
  runtime:  number | null
  rating:   number | null
  match:    number          // from Gemini
  genres:   string[]
  director: string | null
  cast:     string[]
  overview: string
  reason:   string          // from Gemini
  poster:   string | null
  backdrop: string | null
  accent:   string
}

interface GeminiRec {
  title:          string
  year:           number
  genres:         string[]
  synopsis:       string
  reasoning:      string
  moodMatchScore: number
}

interface TMDBMovie {
  id:            number
  title:         string
  overview:      string
  poster_path:   string | null
  backdrop_path: string | null
  vote_average:  number
  runtime:       number | null
  release_date:  string
  genres:        Array<{ id: number; name: string }>
}

interface TMDBCredits {
  crew: Array<{ job: string; name: string }>
  cast: Array<{ name: string; order: number }>
}

// Simple accent color from position
const ACCENTS = ['#d2691e','#c8884c','#7a8a8e','#8b7a6e','#6a8a7a','#c47a6b']

export async function enrichWithTMDB(recommendations: GeminiRec[]): Promise<EnrichedMovie[]> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return recommendations.map((r, i) => ({
      id: null, title: r.title, year: r.year, runtime: null, rating: null,
      match: r.moodMatchScore, genres: r.genres, director: null, cast: [],
      overview: r.synopsis, reason: r.reasoning, poster: null, backdrop: null, accent: ACCENTS[i % ACCENTS.length],
    }))
  }

  const results = await Promise.allSettled(
    recommendations.map(async (rec, i): Promise<EnrichedMovie> => {
      try {
        // Search by title only (no year filter — more reliable)
        const searchParams = new URLSearchParams({ api_key: apiKey, query: rec.title })
        const searchRes = await fetch(`${TMDB_BASE}/search/movie?${searchParams}`)
        const searchData = searchRes.ok
          ? await searchRes.json() as { results: TMDBMovie[] }
          : { results: [] }

        const tmdb = searchData.results?.[0] ?? null

        if (!tmdb) {
          return {
            id: null, title: rec.title, year: rec.year, runtime: null, rating: null,
            match: rec.moodMatchScore, genres: rec.genres, director: null, cast: [],
            overview: rec.synopsis, reason: rec.reasoning, poster: null, backdrop: null, accent: ACCENTS[i % ACCENTS.length],
          }
        }

        // Fetch full details for runtime + credits
        const [detailRes, creditsRes] = await Promise.allSettled([
          fetch(`${TMDB_BASE}/movie/${tmdb.id}?api_key=${apiKey}`),
          fetch(`${TMDB_BASE}/movie/${tmdb.id}/credits?api_key=${apiKey}`),
        ])

        const detail: TMDBMovie = detailRes.status === 'fulfilled' && detailRes.value.ok
          ? await detailRes.value.json()
          : tmdb

        const credits: TMDBCredits = creditsRes.status === 'fulfilled' && creditsRes.value.ok
          ? await creditsRes.value.json()
          : { crew: [], cast: [] }

        const director = credits.crew.find(c => c.job === 'Director')?.name ?? null
        const cast = credits.cast.slice(0, 3).map(c => c.name)
        const genres = detail.genres?.map(g => g.name) ?? rec.genres

        return {
          id:       detail.id,
          title:    detail.title ?? rec.title,
          year:     detail.release_date ? parseInt(detail.release_date.split('-')[0]) : rec.year,
          runtime:  detail.runtime ?? null,
          rating:   detail.vote_average ?? null,
          match:    rec.moodMatchScore,
          genres,
          director,
          cast,
          overview: detail.overview || rec.synopsis,
          reason:   rec.reasoning,
          poster:   detail.poster_path   ? `${POSTER_BASE}${detail.poster_path}`   : null,
          backdrop: detail.backdrop_path ? `${BACKDROP_BASE}${detail.backdrop_path}` : null,
          accent:   ACCENTS[i % ACCENTS.length],
        }
      } catch {
        return {
          id: null, title: rec.title, year: rec.year, runtime: null, rating: null,
          match: rec.moodMatchScore, genres: rec.genres, director: null, cast: [],
          overview: rec.synopsis, reason: rec.reasoning, poster: null, backdrop: null, accent: ACCENTS[i % ACCENTS.length],
        }
      }
    })
  )

  return results.map((s, i) =>
    s.status === 'fulfilled' ? s.value : {
      id: null, title: recommendations[i].title, year: recommendations[i].year, runtime: null, rating: null,
      match: recommendations[i].moodMatchScore, genres: recommendations[i].genres, director: null, cast: [],
      overview: recommendations[i].synopsis, reason: recommendations[i].reasoning, poster: null, backdrop: null, accent: ACCENTS[i % ACCENTS.length],
    }
  )
}
