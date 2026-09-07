import { useState, useEffect } from 'react'
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from '../api/client'
import { Brand } from './CineLogo'

interface Props {
  onBack: () => void
}

export function WatchlistPage({ onBack }: Props) {
  const [items, setItems]       = useState<WatchlistItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => {
    getWatchlist()
      .then(r => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (movieId: number) => {
    setRemoving(movieId)
    await removeFromWatchlist(movieId).catch(() => null)
    setItems(prev => prev.filter(i => i.movieId !== movieId))
    setRemoving(null)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 32px 100px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, animation: 'fadeUp 400ms' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Brand />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, fontFamily: 'Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' }}>
            Your watchlist
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: '8px 0 0', fontWeight: 300 }}>
            {items.length > 0 ? `${items.length} film${items.length !== 1 ? 's' : ''} saved` : 'Films you want to watch later'}
          </p>
        </div>
        <button onClick={onBack} style={navBtnStyle}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          Loading watchlist…
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Nothing saved yet — open a film and hit + Watchlist.
          </div>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 20, rowGap: 32,
        }}>
          {items.map((item, i) => (
            <WatchlistCard
              key={item.movieId}
              item={item}
              index={i}
              removing={removing === item.movieId}
              onRemove={() => handleRemove(item.movieId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WatchlistCard({
  item, index, removing, onRemove,
}: {
  item: WatchlistItem
  index: number
  removing: boolean
  onRemove: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        animation: `cardIn 500ms ${index * 50}ms both`,
        opacity: removing ? 0.4 : 1,
        transition: 'opacity 300ms',
      }}
    >
      <div
        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '2/3', marginBottom: 10, cursor: 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {item.poster
          ? <img
              src={item.poster}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 350ms', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          : <div style={{ width: '100%', height: '100%', background: '#14110f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
        }

        {/* Hover overlay with remove button */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,6,5,0.9) 0%, rgba(8,6,5,0.3) 50%, transparent 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10,
            animation: 'fadeIn 150ms',
          }}>
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              disabled={removing}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: '1px solid rgba(231,111,143,0.4)', background: 'rgba(231,111,143,0.12)',
                color: '#e76f8f', fontSize: 11, fontFamily: 'Inter Tight, sans-serif',
                cursor: removing ? 'default' : 'pointer', fontWeight: 600,
              }}
            >
              {removing ? 'Removing…' : '✕ Remove'}
            </button>
          </div>
        )}

        {/* Rating badge */}
        {item.rating && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            borderRadius: 6, padding: '3px 7px',
            fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace',
          }}>
            ★ {item.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Title & year */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, marginBottom: 3 }}>
        {item.title}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {item.year && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{item.year}</span>}
        {item.runtime && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{item.runtime}m</span>}
      </div>
      {item.genres?.slice(0, 2).map(g => (
        <span key={g} style={{ display: 'inline-block', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginRight: 4 }}>{g}</span>
      ))}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500,
  fontFamily: 'Inter Tight, sans-serif', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
}
