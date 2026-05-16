import { useEffect, useState, useCallback } from 'react'
import type { Movie, MovieDetails } from '../api/client'
import { getMovieDetails, addToWatchlist, removeFromWatchlist } from '../api/client'
import { getUserId } from '../utils/userId'
import { useWindowWidth } from '../utils/useWindowWidth'

interface Props {
  movie:   Movie
  onClose: () => void
  onSimilarOpen?: (movieId: number, title: string) => void
}

const CERT_COLORS: Record<string, string> = {
  'G': '#4ade80', 'PG': '#86efac', 'PG-13': '#f4a261',
  'R': '#e76f8f', 'NC-17': '#c084fc', 'NR': 'rgba(255,255,255,0.3)',
}

export function DetailOverlay({ movie, onClose, onSimilarOpen }: Props) {
  const isMobile = useWindowWidth() < 680
  const [details, setDetails]         = useState<MovieDetails | null>(null)
  const [loadingDetails, setLoading]  = useState(false)
  const [watchlisted, setWatchlisted] = useState(false)
  const [wlPending, setWlPending]     = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  // Fetch extra details lazily
  useEffect(() => {
    if (!movie.id) return
    setLoading(true)
    getMovieDetails(movie.id, getUserId())
      .then(d => {
        setDetails(d)
        setWatchlisted(d.inWatchlist)
      })
      .catch(() => setDetails(null))
      .finally(() => setLoading(false))
  }, [movie.id])

  const handleWatchlist = useCallback(async () => {
    if (wlPending || !movie.id) return
    setWlPending(true)
    try {
      if (watchlisted) {
        await removeFromWatchlist(getUserId(), movie.id)
        setWatchlisted(false)
      } else {
        await addToWatchlist(getUserId(), movie)
        setWatchlisted(true)
      }
    } catch {
      // silent — don't disrupt the UX
    } finally {
      setWlPending(false)
    }
  }, [watchlisted, wlPending, movie])

  const certColor = details?.certification ? (CERT_COLORS[details.certification] ?? 'rgba(255,255,255,0.3)') : null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,6,5,0.88)',
        backdropFilter: 'blur(24px)', zIndex: 100,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : '24px 16px', animation: 'fadeIn 240ms',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 1100,
          maxHeight: isMobile ? '94vh' : '92vh',
          background: '#181412', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: isMobile ? '20px 20px 0 0' : 20, overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '340px 1fr',
          gridTemplateRows: isMobile ? 'auto 1fr' : '1fr',
          animation: 'detailIn 400ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 80px 160px -40px rgba(0,0,0,0.9)',
        }}
      >
        {/* Backdrop glow behind everything */}
        {movie.backdrop && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${movie.backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.12, filter: 'blur(48px) saturate(1.4)', zIndex: 0,
          }} />
        )}

        {/* ── LEFT / TOP: Poster ─────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1, flexShrink: 0,
          ...(isMobile ? { height: 200, overflow: 'hidden' } : {}),
        }}>
          {/* On mobile show the backdrop as a wide banner; on desktop show the portrait poster */}
          {isMobile ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {(movie.backdrop ?? movie.poster)
                ? <img src={movie.backdrop ?? movie.poster!} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: '#14110f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎬</div>
              }
              {/* Gradient fade into content below */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #181412 100%)' }} />
              {/* Poster thumbnail floated left on mobile */}
              {movie.poster && (
                <img src={movie.poster} alt={movie.title} style={{
                  position: 'absolute', bottom: 12, left: 16,
                  width: 64, height: 96, objectFit: 'cover', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }} />
              )}
              {details?.certification && certColor && (
                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  padding: '3px 8px', borderRadius: 5,
                  border: `1.5px solid ${certColor}`, color: certColor,
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                  background: 'rgba(0,0,0,0.65)',
                }}>{details.certification}</div>
              )}
            </div>
          ) : (
            <>
              {movie.poster
                ? <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', minHeight: 480, background: '#14110f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🎬</div>
              }
              {details?.certification && certColor && (
                <div style={{
                  position: 'absolute', bottom: 16, left: 16,
                  padding: '4px 10px', borderRadius: 6,
                  border: `1.5px solid ${certColor}`,
                  color: certColor, fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                }}>
                  {details.certification}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Scrollable content ──────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1,
          overflowY: 'auto', overflowX: 'hidden',
          padding: isMobile ? '20px 20px 40px' : '36px 40px 48px',
          background: 'linear-gradient(135deg, rgba(18,14,12,0.9), rgba(18,14,12,0.97))',
          backdropFilter: 'blur(20px)',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(244,162,97,0.25) transparent',
        }}>

          {/* Match + meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <span style={{
              padding: '5px 12px', background: 'rgba(244,162,97,0.14)',
              border: '1px solid rgba(244,162,97,0.35)', borderRadius: 999,
              color: '#f4a261', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em',
            }}>{movie.match}% MATCH</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.13em' }}>
              {movie.year}
              {movie.runtime ? ` · ${movie.runtime}m` : ''}
              {movie.rating  ? ` · ★ ${movie.rating.toFixed(1)}` : ''}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)', margin: '0 0 8px',
            lineHeight: 0.95, letterSpacing: '-0.02em',
            fontFamily: 'Georgia, serif', fontWeight: 400,
          }}>
            {movie.title}
          </h2>

          {/* Director / Cast */}
          {(movie.director || movie.cast.length > 0) && (
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              {movie.director && <>Directed by <span style={{ color: 'rgba(255,255,255,0.75)' }}>{movie.director}</span></>}
              {movie.cast.length > 0 && <> · {movie.cast.join(', ')}</>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            {/* Trailer button */}
            {(details?.trailerKey || loadingDetails) && (
              <button
                onClick={() => { if (details?.trailerKey) setTrailerOpen(v => !v) }}
                disabled={loadingDetails && !details?.trailerKey}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 999,
                  background: trailerOpen ? 'rgba(231,76,60,0.25)' : (loadingDetails && !details?.trailerKey ? 'rgba(255,255,255,0.04)' : 'rgba(231,76,60,0.12)'),
                  border: `1px solid ${loadingDetails && !details?.trailerKey ? 'rgba(255,255,255,0.1)' : 'rgba(231,76,60,0.4)'}`,
                  color: loadingDetails && !details?.trailerKey ? 'rgba(255,255,255,0.3)' : '#e74c3c',
                  fontSize: 13, fontWeight: 600, fontFamily: 'Inter Tight, sans-serif',
                  cursor: details?.trailerKey ? 'pointer' : 'default',
                  transition: 'all 200ms',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  {trailerOpen
                    ? <path d="M4 3h2v10H4zM10 3h2v10h-2z"/>
                    : <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>}
                </svg>
                {loadingDetails && !details?.trailerKey ? 'Loading…' : trailerOpen ? 'Hide Trailer' : 'Watch Trailer'}
              </button>
            )}

            {/* Watchlist button */}
            <button
              onClick={handleWatchlist}
              disabled={wlPending || !movie.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 999,
                background: watchlisted ? 'rgba(244,162,97,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${watchlisted ? 'rgba(244,162,97,0.5)' : 'rgba(255,255,255,0.12)'}`,
                color: watchlisted ? '#f4a261' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter Tight, sans-serif',
                cursor: wlPending || !movie.id ? 'default' : 'pointer',
                transition: 'all 220ms', opacity: wlPending ? 0.6 : 1,
              }}
            >
              {watchlisted ? (
                <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12l-4.5 2.4 1-5-3.7-3.5 5-.7L8 1l2.2 4.2 5 .7-3.7 3.5 1 5z"/></svg> Saved</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 12l-4.5 2.4 1-5-3.7-3.5 5-.7L8 1l2.2 4.2 5 .7-3.7 3.5 1 5z"/></svg> {loadingDetails ? '...' : '+ Watchlist'}</>
              )}
            </button>
          </div>

          {/* Inline trailer embed */}
          {trailerOpen && details?.trailerKey && (
            <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${details.trailerKey}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                title={`${movie.title} trailer`}
              />
            </div>
          )}

          {/* Gemini reasoning */}
          <div style={{
            padding: '16px 20px', background: 'rgba(244,162,97,0.06)',
            border: '1px solid rgba(244,162,97,0.18)', borderRadius: 12, marginBottom: 24,
          }}>
            <div style={{ color: '#f4a261', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'monospace' }}>
              WHY GEMINI PICKED THIS
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.45, color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {'"'}{movie.reason}{'"'}
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div style={{ marginBottom: 26 }}>
              <SectionLabel>OVERVIEW</SectionLabel>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.48)', margin: 0, fontWeight: 300 }}>
                {movie.overview}
              </p>
            </div>
          )}

          {/* Genres */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {movie.genres.map(g => (
              <Chip key={g}>{g}</Chip>
            ))}
          </div>

          {/* ── LAZY-LOADED SECTIONS ──────────────────────────────────────── */}

          {loadingDetails && !details && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, marginBottom: 20 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }} fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" strokeOpacity="0.2"/>
                <path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/>
              </svg>
              Loading more details…
            </div>
          )}

          {details && (
            <>
              {/* Where to Watch */}
              {details.providers.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionLabel>WHERE TO WATCH</SectionLabel>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {details.providers.map(p => (
                      <div key={p.provider_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <img
                          src={p.logo_path}
                          alt={p.provider_name}
                          title={p.provider_name}
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', maxWidth: 48, textAlign: 'center', lineHeight: 1.2 }}>
                          {p.provider_name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {details.keywords.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionLabel>THEMES &amp; KEYWORDS</SectionLabel>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {details.keywords.map(kw => (
                      <Chip key={kw} dim>{kw}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* More Like This */}
              {details.similar.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <SectionLabel>MORE LIKE THIS</SectionLabel>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
                    {details.similar.map(s => (
                      <button
                        key={s.id}
                        onClick={() => onSimilarOpen?.(s.id, s.title)}
                        style={{
                          flexShrink: 0, width: 90, background: 'none', border: 'none',
                          padding: 0, cursor: onSimilarOpen ? 'pointer' : 'default',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 6, aspectRatio: '2/3' }}>
                          {s.poster
                            ? <img src={s.poster} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms' }}
                                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
                                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
                            : <div style={{ width: '100%', height: '100%', background: '#14110f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
                          }
                          {s.rating && (
                            <div style={{
                              position: 'absolute', bottom: 4, right: 4,
                              background: 'rgba(0,0,0,0.7)', borderRadius: 4,
                              fontSize: 9, padding: '2px 5px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace',
                            }}>★ {s.rating.toFixed(1)}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, fontWeight: 500, padding: '0 2px' }}>
                          {s.title.length > 18 ? s.title.slice(0, 16) + '…' : s.title}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', padding: '0 2px' }}>
                          {s.year || ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 34, height: 34, borderRadius: 999, border: 'none',
            background: 'rgba(8,6,5,0.75)', backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 200ms, color 200ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,6,5,0.75)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)' }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Small helper components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 10, fontFamily: 'monospace' }}>
      {children}
    </div>
  )
}

function Chip({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span style={{
      fontSize: 12, padding: '5px 11px',
      background: dim ? 'transparent' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${dim ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.09)'}`,
      borderRadius: 999,
      color: dim ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.45)',
    }}>
      {children}
    </span>
  )
}
