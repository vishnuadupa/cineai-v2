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
        boxShadow: hovered
          ? '0 40px 100px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(244,162,97,0.25)'
          : '0 8px 32px -8px rgba(0,0,0,0.6)',
        transform: hovered ? 'scale(1.13) translateY(-8px)' : 'scale(1)',
        transition: 'transform 380ms cubic-bezier(.2,.8,.2,1), box-shadow 380ms',
        willChange: 'transform',
      }}>
        {/* Poster */}
        {movie.poster
          ? <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                filter: hovered ? 'saturate(1.15) brightness(1.05)' : 'saturate(0.9)',
                transition: 'filter 380ms',
              }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
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

        {/* Bottom gradient + title — always visible */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(0deg, rgba(11,9,8,0.9) 0%, rgba(11,9,8,0.4) 40%, transparent 70%)',
        }}/>

        {/* Hover tap hint */}
        {hovered && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            width: 30, height: 30, borderRadius: 999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 200ms',
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3M8 11v.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Title block */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: '#f3ece1', pointerEvents: 'none' }}>
          <div style={{
            fontSize: 18, lineHeight: 1.1, letterSpacing: '-0.01em',
            marginBottom: 6, fontFamily: 'Georgia, serif',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}>
            {movie.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(243,236,225,0.6)', fontFamily: 'Inter Tight, sans-serif' }}>
            <span>{movie.year}</span>
            <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/>
            {movie.runtime && <><span>{movie.runtime}m</span><span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/></>}
            <span style={{ color: '#f4a261' }}>★ {movie.rating?.toFixed(1) ?? '—'}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
