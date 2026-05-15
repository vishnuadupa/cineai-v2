import { useState } from 'react'
import type { Recommendation } from '../api/client'
import { cn } from '../utils/cn'

interface Props { rec: Recommendation; index: number }

export function RecommendationCard({ rec, index }: Props) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const scoreColor =
    rec.moodMatchScore >= 90 ? 'text-cinema-success' :
    rec.moodMatchScore >= 70 ? 'text-cinema-gold' : 'text-cinema-muted'

  const barWidth = `${rec.moodMatchScore}%`

  return (
    <article
      className={cn(
        'group relative flex gap-0 overflow-hidden rounded-card',
        'bg-cinema-card border border-cinema-border',
        'hover:border-cinema-border-gold hover:shadow-card-hover',
        'transition-all duration-300 animate-card-enter'
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {/* Left accent line */}
      <div className="w-0.5 flex-shrink-0 bg-gradient-to-b from-cinema-gold/60 via-cinema-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Poster */}
      <div className="relative w-24 flex-shrink-0 bg-cinema-elevated overflow-hidden">
        {rec.posterUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={rec.posterUrl}
              alt={`${rec.title} poster`}
              className={cn(
                'w-full h-full object-cover transition-all duration-500',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              style={{ minHeight: '140px' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
            />
            {/* Poster hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cinema-card/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full flex items-center justify-center bg-cinema-elevated" style={{minHeight:'140px'}}>
            <span className="text-3xl opacity-30">🎬</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">

        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-light text-cinema-text leading-tight group-hover:text-white transition-colors duration-200">
              {rec.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-cinema-muted text-xs font-mono">{rec.year}</span>
              {rec.rating && (
                <>
                  <span className="text-cinema-border text-xs">·</span>
                  <span className="text-cinema-gold text-xs font-mono">★ {rec.rating.toFixed(1)}</span>
                </>
              )}
            </div>
          </div>
          <span className={cn('text-xs font-mono flex-shrink-0 mt-0.5', scoreColor)}>
            {rec.moodMatchScore}%
          </span>
        </div>

        {/* Match bar */}
        <div className="h-px bg-cinema-border rounded-full overflow-hidden">
          <div
            className="h-full bg-cinema-gold rounded-full transition-all duration-1000 ease-out"
            style={{ width: barWidth, transitionDelay: `${index * 90 + 200}ms` }}
          />
        </div>

        {/* Genres */}
        {rec.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rec.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-cinema-elevated border border-cinema-border text-cinema-muted uppercase tracking-wide">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <p className="text-cinema-muted text-sm leading-relaxed line-clamp-3">
          {rec.reasoning}
        </p>
      </div>
    </article>
  )
}
