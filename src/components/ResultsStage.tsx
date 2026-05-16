import type { Movie } from '../api/client'
import { MovieCard } from './MovieCard'
import { MOODS } from '../data/heroFilms'
import { Brand } from './CineLogo'

interface Params { mood: string; genres: string[]; liked: string[] }
interface Props {
  params:       Params
  movies:       Movie[]
  onReset:      () => void
  onOpen:       (m: Movie) => void
  onHistory:    () => void
  onWatchlist:  () => void
}

export function ResultsStage({ params, movies, onReset, onOpen, onHistory, onWatchlist }: Props) {
  const moodLabel = MOODS.find(m => m.id === params.mood)?.label.toLowerCase() ?? 'quiet'

  return (
    <div style={{ padding: '40px 32px 120px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, marginBottom: 48, animation: 'fadeUp 500ms cubic-bezier(.2,.7,.2,1)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Brand />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {movies.length} films · curated by gemini
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            For a{' '}
            <span style={{ background: 'linear-gradient(135deg, #f4a261, #e76f8f, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic' }}>
              {moodLabel}
            </span>
            {' '}night —
          </h2>
          <p style={{ marginTop: 14, color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 300, maxWidth: 560, lineHeight: 1.5 }}>
            {params.genres.length > 0 ? params.genres.join(' / ') : 'across genres'}
            {params.liked.length > 0 && (
              <>, with the DNA of{' '}
                <span style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {params.liked.slice(0, 2).join(', ')}
                </span>
                {params.liked.length > 2 && ` + ${params.liked.length - 2} more`}
              </>
            )}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <NavBtn onClick={onHistory} icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }>History</NavBtn>
          <NavBtn onClick={onWatchlist} icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 12l-4.5 2.4 1-5-3.7-3.5 5-.7L8 1l2.2 4.2 5 .7-3.7 3.5 1 5z"/>
            </svg>
          }>Watchlist</NavBtn>
          <NavBtn onClick={onReset} icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }>New search</NavBtn>
        </div>
      </div>

      {/* Fewer than 6 notice */}
      {movies.length > 0 && movies.length < 6 && (
        <div style={{
          marginBottom: 24, padding: '12px 18px', borderRadius: 10,
          background: 'rgba(244,162,97,0.06)', border: '1px solid rgba(244,162,97,0.15)',
          color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.5,
          animation: 'fadeUp 500ms',
        }}>
          Gemini found <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{movies.length} film{movies.length !== 1 ? 's' : ''}</strong> that exactly match your genre and era — try broadening your filters for more results.
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24, rowGap: 40 }}>
        {movies.map((m, i) => <MovieCard key={m.id ?? i} movie={m} index={i} onOpen={onOpen}/>)}
      </div>
    </div>
  )
}

function NavBtn({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px', borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)',
        color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500,
        fontFamily: 'Inter Tight, sans-serif', cursor: 'pointer',
        transition: 'all 200ms', display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
    >
      {icon}
      {children}
    </button>
  )
}
