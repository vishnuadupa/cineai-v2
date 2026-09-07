import { useState, useEffect } from 'react'
import { getHistory, deleteHistory, type Session } from '../api/client'
import { Brand } from './CineLogo'

interface Props {
  onBack: () => void
}

export function HistoryPage({ onBack }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared]   = useState(false)

  useEffect(() => {
    getHistory(20)
      .then(r => setSessions(r.sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const handleClear = async () => {
    if (!confirm('Clear all your search history? This cannot be undone.')) return
    setClearing(true)
    await deleteHistory().catch(() => null)
    setSessions([])
    setCleared(true)
    setClearing(false)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 32px 100px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, animation: 'fadeUp 400ms' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Brand />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, fontFamily: 'Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' }}>
            Your search history
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: '8px 0 0', fontWeight: 300 }}>
            Sessions are stored in this browser only — the last 20 searches, no expiry.
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
          Loading history…
        </div>
      )}

      {/* Empty */}
      {!loading && sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {cleared ? 'History cleared.' : 'No history yet — make your first search.'}
          </div>
        </div>
      )}

      {/* Sessions timeline */}
      {sessions.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {sessions.map((s, i) => (
              <SessionCard key={s.sessionId} session={s} index={i} />
            ))}
          </div>

          {/* Clear button */}
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <button
              onClick={handleClear}
              disabled={clearing}
              style={{
                padding: '10px 22px', borderRadius: 999,
                border: '1px solid rgba(231,111,143,0.25)', background: 'rgba(231,111,143,0.05)',
                color: 'rgba(231,111,143,0.6)', fontSize: 13, fontFamily: 'Inter Tight, sans-serif',
                cursor: clearing ? 'default' : 'pointer', transition: 'all 200ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e76f8f'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(231,111,143,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(231,111,143,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(231,111,143,0.25)' }}
            >
              {clearing ? 'Clearing…' : 'Clear all history'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const date = new Date(session.createdAt)
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const mood    = session.input.mood
  const genres  = session.input.genres ?? []
  const feeling = (session.input as { feeling?: string; freeText?: string }).feeling ?? session.input.freeText ?? ''
  const recs    = session.recommendations ?? []

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '24px 28px',
      animation: `fadeUp 400ms ${index * 60}ms both`,
    }}>
      {/* Date + meta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{dateLabel}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{timeLabel}</span>
        {mood && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(244,162,97,0.1)', border: '1px solid rgba(244,162,97,0.2)', borderRadius: 999, color: '#f4a261', fontFamily: 'monospace' }}>{mood}</span>}
        {genres.slice(0, 2).map(g => (
          <span key={g} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{g}</span>
        ))}
      </div>

      {/* Feeling text */}
      {feeling && (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif', fontStyle: 'italic', margin: '0 0 18px', lineHeight: 1.5 }}>
          {'"'}{feeling.slice(0, 180)}{feeling.length > 180 ? '…' : ''}{'"'}
        </p>
      )}

      {/* Film posters strip */}
      {recs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {recs.slice(0, 8).map((r, ri) => (
            <div key={ri} style={{ flexShrink: 0, width: 60, textAlign: 'center' }}>
              <div style={{ width: 60, height: 88, borderRadius: 7, overflow: 'hidden', marginBottom: 5, background: '#14110f' }}>
                {r.poster
                  ? <img src={r.poster} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                }
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.2 }}>
                {r.title.length > 10 ? r.title.slice(0, 9) + '…' : r.title}
              </div>
            </div>
          ))}
        </div>
      )}
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
