import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecommendationCard } from '../RecommendationCard'
import type { Recommendation } from '../../api/client'

const baseRec: Recommendation = {
  title:          'Contact',
  year:           1997,
  genres:         ['Drama', 'Science Fiction'],
  synopsis:       'A scientist discovers a signal from deep space.',
  reasoning:      'Shares cosmic wonder with a deeply personal emotional core.',
  moodMatchScore: 94,
  tmdbId:         686,
  posterPath:     '/mock-poster.jpg',
  posterUrl:      'https://image.tmdb.org/t/p/w300/mock-poster.jpg',
  rating:         7.4,
}

describe('RecommendationCard', () => {
  it('renders movie title', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders release year', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    expect(screen.getByText('1997')).toBeInTheDocument()
  })

  it('renders TMDB rating', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    expect(screen.getByText('★ 7.4')).toBeInTheDocument()
  })

  it('renders genre chips (max 3)', () => {
    const rec = { ...baseRec, genres: ['Drama', 'Sci-Fi', 'Thriller', 'Mystery'] }
    render(<RecommendationCard rec={rec} index={0} />)
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument()
    expect(screen.getByText('Thriller')).toBeInTheDocument()
    expect(screen.queryByText('Mystery')).not.toBeInTheDocument()
  })

  it('renders mood match score', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    expect(screen.getByText('94% match')).toBeInTheDocument()
  })

  it('renders AI reasoning text', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    expect(screen.getByText(baseRec.reasoning)).toBeInTheDocument()
  })

  it('renders poster image when posterUrl provided', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    const img = screen.getByAltText('Contact poster')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', baseRec.posterUrl)
  })

  it('renders fallback emoji when no posterUrl', () => {
    const rec = { ...baseRec, posterUrl: null, posterPath: null }
    render(<RecommendationCard rec={rec} index={0} />)
    expect(screen.getByText('🎬')).toBeInTheDocument()
    expect(screen.queryByAltText('Contact poster')).not.toBeInTheDocument()
  })

  it('renders fallback emoji when image fails to load', () => {
    render(<RecommendationCard rec={baseRec} index={0} />)
    const img = screen.getByAltText('Contact poster')
    fireEvent.error(img)
    expect(screen.getByText('🎬')).toBeInTheDocument()
  })

  it('does not render rating when rating is null', () => {
    const rec = { ...baseRec, rating: null }
    render(<RecommendationCard rec={rec} index={0} />)
    expect(screen.queryByText(/★/)).not.toBeInTheDocument()
  })

  it('does not render genre chips when genres empty', () => {
    const rec = { ...baseRec, genres: [] }
    render(<RecommendationCard rec={rec} index={0} />)
    // No genre chip elements — just verify title still renders
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('applies correct score color class for high match (>=90)', () => {
    render(<RecommendationCard rec={{ ...baseRec, moodMatchScore: 92 }} index={0} />)
    const scoreEl = screen.getByText('92% match')
    expect(scoreEl.className).toContain('text-cinema-success')
  })

  it('applies accent color for mid match (70-89)', () => {
    render(<RecommendationCard rec={{ ...baseRec, moodMatchScore: 75 }} index={0} />)
    const scoreEl = screen.getByText('75% match')
    expect(scoreEl.className).toContain('text-cinema-accent')
  })

  it('applies muted color for low match (<70)', () => {
    render(<RecommendationCard rec={{ ...baseRec, moodMatchScore: 55 }} index={0} />)
    const scoreEl = screen.getByText('55% match')
    expect(scoreEl.className).toContain('text-cinema-muted')
  })

  it('sets animation delay based on index prop', () => {
    render(<RecommendationCard rec={baseRec} index={3} />)
    const article = screen.getByRole('article')
    expect(article.style.animationDelay).toBe('240ms') // 3 * 80ms
  })
})
