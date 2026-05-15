import { useEffect } from 'react'
import type { Movie } from '../api/client'

interface Props { movie: Movie; onClose: () => void }

export function DetailOverlay({ movie, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(11,9,8,0.85)',
      backdropFilter: 'blur(20px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, animation: 'fadeIn 260ms',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 1100, maxHeight: '88vh',
        background: '#1a1614', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '380px 1fr',
        animation: 'detailIn 420ms cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 80px 160px -40px rgba(0,0,0,0.8)',
      }}>
        {/* Backdrop blur layer */}
        {movie.backdrop && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${movie.backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.15, filter: 'blur(40px) saturate(1.2)', zIndex: 0,
          }}/>
        )}

        {/* Poster */}
        <div style={{ position: 'relative', zIndex: 1, aspectRatio: '2/3' }}>
          {movie.poster
            ? <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: '100%', background: '#1a1614', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎬</div>
          }
        </div>

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1, padding: '40px 44px', overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(20,17,15,0.85), rgba(20,17,15,0.95))',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{
              padding: '5px 12px', background: 'rgba(244,162,97,0.14)',
              border: '1px solid rgba(244,162,97,0.35)', borderRadius: 999,
              color: '#f4a261', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em',
            }}>{movie.match}% MATCH</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em' }}>
              {movie.year} · {movie.runtime ? `${movie.runtime}m` : '—'} · ★ {movie.rating?.toFixed(1) ?? '—'}
            </span>
          </div>

          <h2 style={{ fontSize: 56, margin: '0 0 8px', lineHeight: 0.95, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            {movie.title}
          </h2>

          {(movie.director || movie.cast.length > 0) && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28 }}>
              {movie.director && <>Directed by <span style={{ color: 'rgba(255,255,255,0.8)' }}>{movie.director}</span></>}
              {movie.cast.length > 0 && <> · {movie.cast.join(', ')}</>}
            </div>
          )}

          {/* Why Gemini picked this */}
          <div style={{
            padding: '18px 22px', background: 'rgba(244,162,97,0.06)',
            border: '1px solid rgba(244,162,97,0.2)', borderRadius: 12, marginBottom: 24,
          }}>
            <div style={{ color: '#f4a261', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'monospace' }}>
              WHY GEMINI PICKED THIS
            </div>
            <div style={{ fontSize: 19, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              "{movie.reason}"
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 10, fontFamily: 'monospace' }}>OVERVIEW</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 300 }}>{movie.overview}</p>
            </div>
          )}

          {/* Genres */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {movie.genres.map(g => (
              <span key={g} style={{
                fontSize: 12, padding: '6px 12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 999, color: 'rgba(255,255,255,0.5)',
              }}>{g}</span>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              flex: 1, padding: '14px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #f4a261, #e76f8f)',
              color: '#1a0e1d', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Inter Tight, sans-serif',
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
              Watch trailer
            </button>
            <button style={{ padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter Tight, sans-serif' }}>+ Watchlist</button>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, zIndex: 5,
          width: 36, height: 36, borderRadius: 999, border: 'none',
          background: 'rgba(11,9,8,0.7)', backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
