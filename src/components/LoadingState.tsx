export function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-center gap-4 mb-7">
        <div className="h-px flex-1 bg-cinema-border animate-pulse" />
        <span className="text-cinema-muted text-[10px] font-mono tracking-[0.2em] uppercase animate-pulse">
          Curating your picks…
        </span>
        <div className="h-px flex-1 bg-cinema-border animate-pulse" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-0 overflow-hidden rounded-card border border-cinema-border bg-cinema-card"
          style={{ animationDelay: `${i * 100}ms` }}>
          {/* Accent line */}
          <div className="w-0.5 flex-shrink-0 bg-cinema-border" />
          {/* Poster skeleton */}
          <div className="w-24 flex-shrink-0 skeleton" style={{ minHeight: '140px' }} />
          {/* Content skeleton */}
          <div className="flex-1 p-4 space-y-3">
            <div>
              <div className="h-5 skeleton rounded w-3/4 mb-1.5" />
              <div className="h-3 skeleton rounded w-1/4" />
            </div>
            <div className="h-px skeleton rounded w-full" />
            <div className="flex gap-1.5">
              <div className="h-4 skeleton rounded w-12" />
              <div className="h-4 skeleton rounded w-14" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 skeleton rounded w-full" />
              <div className="h-3 skeleton rounded w-5/6" />
              <div className="h-3 skeleton rounded w-4/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
