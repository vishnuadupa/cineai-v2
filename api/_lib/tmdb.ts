import type { LLMRecommendation as LLMRec } from './types'

const TMDB_BASE     = 'https://api.themoviedb.org/3'
const POSTER_BASE   = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'
const LOGO_BASE     = 'https://image.tmdb.org/t/p/w92'

export interface EnrichedMovie {
  id:       number | null
  title:    string
  year:     number
  runtime:  number | null
  rating:   number | null
  match:    number          // from the LLM
  genres:   string[]
  director: string | null
  cast:     string[]
  overview: string
  reason:   string          // from the LLM
  poster:   string | null
  backdrop: string | null
  accent:   string
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

export interface WatchProvider {
  provider_id:   number
  provider_name: string
  logo_path:     string   // full URL
}

export interface SimilarMovie {
  id:     number
  title:  string
  year:   number
  poster: string | null
  rating: number | null
}

export interface MovieDetails {
  providers:     WatchProvider[]
  trailerKey:    string | null
  keywords:      string[]
  certification: string | null
  similar:       SimilarMovie[]
}

export async function getMovieDetails(tmdbId: number, country = 'US'): Promise<MovieDetails> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return { providers: [], trailerKey: null, keywords: [], certification: null, similar: [] }

  const [providersRes, videosRes, keywordsRes, releaseDatesRes, similarRes] = await Promise.allSettled([
    fetch(`${TMDB_BASE}/movie/${tmdbId}/watch/providers?api_key=${apiKey}`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/videos?api_key=${apiKey}`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/keywords?api_key=${apiKey}`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/release_dates?api_key=${apiKey}`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/similar?api_key=${apiKey}&page=1`),
  ])

  // Watch providers — prefer streaming (flatrate), fallback rent → buy
  let providers: WatchProvider[] = []
  if (providersRes.status === 'fulfilled' && providersRes.value.ok) {
    const data = await providersRes.value.json() as { results?: Record<string, { flatrate?: TMDBProvider[]; rent?: TMDBProvider[]; buy?: TMDBProvider[] }> }
    const regionData = data.results?.[country] ?? data.results?.['US']
    const raw: TMDBProvider[] = regionData?.flatrate ?? regionData?.rent ?? regionData?.buy ?? []
    providers = raw.slice(0, 5).map(p => ({
      provider_id:   p.provider_id,
      provider_name: p.provider_name,
      logo_path:     `${LOGO_BASE}${p.logo_path}`,
    }))
  }

  // Trailer — prefer official YouTube trailer, then teaser
  let trailerKey: string | null = null
  if (videosRes.status === 'fulfilled' && videosRes.value.ok) {
    const data = await videosRes.value.json() as { results?: TMDBVideo[] }
    const trailer =
      data.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
      data.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
      data.results?.find(v => v.site === 'YouTube' && v.type === 'Teaser')
    trailerKey = trailer?.key ?? null
  }

  // Keywords
  let keywords: string[] = []
  if (keywordsRes.status === 'fulfilled' && keywordsRes.value.ok) {
    const data = await keywordsRes.value.json() as { keywords?: Array<{ name: string }> }
    keywords = (data.keywords ?? []).slice(0, 14).map(k => k.name)
  }

  // Certification (e.g. PG-13) — try user's country first, fallback US
  let certification: string | null = null
  if (releaseDatesRes.status === 'fulfilled' && releaseDatesRes.value.ok) {
    const data = await releaseDatesRes.value.json() as { results?: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string }> }> }
    const entry = data.results?.find(r => r.iso_3166_1 === country) ?? data.results?.find(r => r.iso_3166_1 === 'US')
    certification = entry?.release_dates?.find(rd => rd.certification)?.certification ?? null
  }

  // Similar movies — top 6
  let similar: SimilarMovie[] = []
  if (similarRes.status === 'fulfilled' && similarRes.value.ok) {
    const data = await similarRes.value.json() as { results?: Array<{ id: number; title: string; release_date: string; poster_path: string | null; vote_average: number }> }
    similar = (data.results ?? []).slice(0, 6).map(m => ({
      id:     m.id,
      title:  m.title,
      year:   m.release_date ? parseInt(m.release_date.split('-')[0]) : 0,
      poster: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : null,
      rating: m.vote_average ?? null,
    }))
  }

  return { providers, trailerKey, keywords, certification, similar }
}

// Internal TMDB types for getMovieDetails
interface TMDBProvider { provider_id: number; provider_name: string; logo_path: string }
interface TMDBVideo    { site: string; type: string; official: boolean; key: string }

/** Fetch a single movie by TMDB id — returns a full EnrichedMovie or null if not found */
export async function fetchMovieById(tmdbId: number): Promise<EnrichedMovie | null> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return null

  const [detailRes, creditsRes] = await Promise.allSettled([
    fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${apiKey}`),
  ])

  if (detailRes.status !== 'fulfilled' || !detailRes.value.ok) return null
  const detail: TMDBMovie  = await detailRes.value.json()
  const credits: TMDBCredits = creditsRes.status === 'fulfilled' && creditsRes.value.ok
    ? await creditsRes.value.json()
    : { crew: [], cast: [] }

  const director = credits.crew.find(c => c.job === 'Director')?.name ?? null
  const cast     = credits.cast.slice(0, 3).map(c => c.name)
  const genres   = detail.genres?.map(g => g.name) ?? []

  return {
    id:       detail.id,
    title:    detail.title,
    year:     detail.release_date ? parseInt(detail.release_date.split('-')[0]) : 0,
    runtime:  detail.runtime ?? null,
    rating:   detail.vote_average ?? null,
    match:    0,     // unknown — not from the LLM
    genres,
    director,
    cast,
    overview: detail.overview ?? '',
    reason:   '',    // no LLM reasoning for lookup results
    poster:   detail.poster_path   ? `${POSTER_BASE}${detail.poster_path}`   : null,
    backdrop: detail.backdrop_path ? `${BACKDROP_BASE}${detail.backdrop_path}` : null,
    accent:   ACCENTS[0],
  }
}

// TMDB's fixed movie genre ids — needed for /discover/movie (it takes ids, not names)
const GENRE_IDS: Record<string, number> = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
  'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749,
  'Science Fiction': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752, 'Western': 37,
}

const ERA_RANGES: Record<string, { gte?: string; lte?: string }> = {
  any:      {},
  new:      { gte: '2020-01-01' },
  '2010s':  { gte: '2010-01-01', lte: '2019-12-31' },
  classics: { lte: '1999-12-31' },
}

export interface DiscoverCandidate { title: string; year: number }

/**
 * Builds a real candidate pool from TMDB /discover/movie using the user's actual structured
 * constraints (genre, era, adult) plus keyword ids pulled from their liked films (e.g. "biography",
 * "entrepreneur") — replaces asking the LLM to invent titles from memory, which hallucinates
 * (fake/wrong-genre films) and TMDB's "similar movies" grounding, which was too noisy (genre/
 * popularity based — a niche biopic's "similar" list is just unrelated generic dramas).
 */
export async function discoverCandidates(params: {
  genres: string[]; era: string; adult: boolean; likedTitles: string[]
}): Promise<DiscoverCandidate[]> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return []

  const keywordIds = new Set<number>()
  if (params.likedTitles.length > 0) {
    await Promise.allSettled(
      params.likedTitles.slice(0, 6).map(async title => {
        const searchRes = await fetch(`${TMDB_BASE}/search/movie?${new URLSearchParams({ api_key: apiKey, query: title })}`)
        if (!searchRes.ok) return
        const searchData = await searchRes.json() as { results: TMDBMovie[] }
        const match = searchData.results?.[0]
        if (!match) return
        const kwRes = await fetch(`${TMDB_BASE}/movie/${match.id}/keywords?api_key=${apiKey}`)
        if (!kwRes.ok) return
        const kwData = await kwRes.json() as { keywords?: Array<{ id: number }> }
        kwData.keywords?.slice(0, 6).forEach(k => keywordIds.add(k.id))
      })
    )
  }

  const genreIds = params.genres.map(g => GENRE_IDS[g]).filter((id): id is number => id !== undefined)
  const dateRange = ERA_RANGES[params.era] ?? {}

  const query = new URLSearchParams({
    api_key:            apiKey,
    sort_by:            'popularity.desc',
    'vote_count.gte':   '50',
    include_adult:      String(params.adult),
    page:               String(1 + Math.floor(Math.random() * 3)), // vary results across requests
  })
  if (genreIds.length > 0) query.set('with_genres', genreIds.join('|'))       // OR
  if (keywordIds.size > 0) query.set('with_keywords', [...keywordIds].join('|')) // OR
  if (dateRange.gte) query.set('primary_release_date.gte', dateRange.gte)
  if (dateRange.lte) query.set('primary_release_date.lte', dateRange.lte)

  const res = await fetch(`${TMDB_BASE}/discover/movie?${query}`)
  if (!res.ok) return []
  const data = await res.json() as { results?: Array<{ title: string; release_date: string }> }
  return (data.results ?? []).slice(0, 20).map(m => ({
    title: m.title,
    year:  m.release_date ? parseInt(m.release_date.split('-')[0]) : 0,
  }))
}

// Simple accent color from position
const ACCENTS = ['#d2691e','#c8884c','#7a8a8e','#8b7a6e','#6a8a7a','#c47a6b']

/** Enriches one LLM recommendation with real TMDB data — used to enrich as each streams in. */
export async function enrichOneWithTMDB(rec: LLMRec, index: number): Promise<EnrichedMovie> {
  const apiKey = process.env.TMDB_API_KEY
  const fallback = (): EnrichedMovie => ({
    id: null, title: rec.title, year: rec.year, runtime: null, rating: null,
    match: rec.moodMatchScore, genres: rec.genres, director: null, cast: [],
    overview: rec.synopsis, reason: rec.reasoning, poster: null, backdrop: null, accent: ACCENTS[index % ACCENTS.length],
  })
  if (!apiKey) return fallback()

  try {
    // Search by title only (no year filter — more reliable)
    const searchParams = new URLSearchParams({ api_key: apiKey, query: rec.title })
    const searchRes = await fetch(`${TMDB_BASE}/search/movie?${searchParams}`)
    const searchData = searchRes.ok
      ? await searchRes.json() as { results: TMDBMovie[] }
      : { results: [] }

    const tmdb = searchData.results?.[0] ?? null
    if (!tmdb) return fallback()

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
      accent:   ACCENTS[index % ACCENTS.length],
    }
  } catch {
    return fallback()
  }
}
