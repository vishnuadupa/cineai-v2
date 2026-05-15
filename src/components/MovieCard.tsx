import { useState } from 'react'
import type { Movie } from '../api/client'

interface Props { movie: Movie; index: number; onOpen: (m: Movie) => void }

export function MovieCard({ movie, index, onOpen }: Props) {
  const [hovered, setHovered] = useState(false)
  const delay = index * 70

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(movie)}
      style={{
        position: 'relative', background: 'transparent', border: 'none',
        padding: 0, cursor: 'pointer', textAlign: 'left',
        animation: 'cardIn 720ms cubic-bezier(.2,.8,.2,1) both',
        animationDelay: `${delay}ms`,
        zIndex: hovered ? 20 : 1,
      }}
    >
      <div style={{
        position: 'relative', aspectRatio: '2/3', borderRadius: 14, overflow: 'hidden',
        background: '#1a1614',
        boxShadow: hovered ? '0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(244,162,97,0.2)' : '0 8px 32px -8px rgba(0,0,0,0.6)',
        transform: hovered ? 'scale(1.08) translateY(-6px)' : 'scale(1)',
        transition: 'transform 420ms cubic-bezier(.2,.8,.2,1), box-shadow 420ms',
        willChange: 'transform',
      }}>
        {/* Poster */}
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: hovered ? 'saturate(1.1)' : 'saturate(0.92)', transition: 'filter 420ms' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.3 }}>🎬</div>
        }

        {/* Match badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12, padding: '4px 10px',
          background: 'linear-gradient(135deg, rgba(244,162,97,0.95), rgba(231,111,143,0.95))',
          backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 999, color: '#1a0e1d', fontSize: 11, fontWeight: 700,
          fontFamily: 'monospace', letterSpacing: '0.05em',
        }}>
          {movie.match}<span style={{ opacity: 0.7 }}>% match</span>
        </div>

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: hovered
            ? 'linear-gradient(0deg, rgba(11,9,8,0.96) 0%, rgba(11,9,8,0.7) 35%, rgba(11,9,8,0.1) 60%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(11,9,8,0.85) 0%, rgba(11,9,8,0.0) 45%)',
          transition: 'background 420ms',
        }}/>

        {/* Title block */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: '#f3ece1', pointerEvents: 'none' }}>
          <div style={{
            fontSize: hovered ? 22 : 19, lineHeight: 1.05, letterSpacing: '-0.01em',
            marginBottom: 6, fontFamily: 'Georgia, serif',
            transition: 'font-size 420ms cubic-bezier(.2,.8,.2,1)',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}>{movie.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(243,236,225,0.65)', fontFamily: 'Inter Tight, sans-serif' }}>
            <span>{movie.year}</span>
            <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/>
            {movie.runtime && <><span>{movie.runtime}m</span><span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/></>}
            <span style={{ color: '#f4a261' }}>★ {movie.rating?.toFixed(1) ?? '—'}</span>
          </div>

          {/* Hover reveal */}
          <div style={{
            maxHeight: hovered ? 200 : 0, opacity: hovered ? 1 : 0,
            overflow: 'hidden', transition: 'max-height 420ms cubic-bezier(.2,.8,.2,1), opacity 320ms 60ms',
            marginTop: hovered ? 10 : 0,
          }}>
            <div style={{ fontSize: 14, color: '#f4a261', lineHeight: 1.35, marginBottom: 8, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              "{movie.reason}"
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {movie.genres.slice(0, 3).map(g => (
                <span key={g} style={{ fontSize: 10, padding: '3px 7px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: 'rgba(243,236,225,0.75)', fontFamily: 'Inter Tight', letterSpacing: '0.02em' }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
