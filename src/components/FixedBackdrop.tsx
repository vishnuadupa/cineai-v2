interface Film { backdrop: string; title: string }
interface Props { films: Film[]; i: number; scrollY: number }

export function FixedBackdrop({ films, i, scrollY }: Props) {
  const heroH = typeof window !== 'undefined' ? Math.max(window.innerHeight, 680) : 800
  const t = Math.min(1, Math.max(0, scrollY / heroH))
  const dim = 0.55 + t * 0.4
  const blur = t * 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `blur(${blur}px)`, transform: `scale(${1 + t * 0.04})`, transition: 'filter 200ms linear, transform 200ms linear' }}>
        {films.map((pv, idx) => (
          <div key={pv.title + idx} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${pv.backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: idx === i ? 1 : 0,
            transform: idx === i ? 'scale(1.06)' : 'scale(1)',
            transition: 'opacity 1400ms ease, transform 7000ms ease-out',
          }}/>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 65%, rgba(139,92,246,.30) 0%, transparent 55%), linear-gradient(180deg, rgba(18,8,21,.55) 0%, rgba(18,8,21,.15) 35%, rgba(18,8,21,${dim}) 100%)` }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(18,8,21,.85) 0%, transparent 55%)', opacity: 1 - t * 0.5, transition: 'opacity 200ms' }}/>
      <div style={{ position: 'absolute', inset: 0, background: '#0c0510', opacity: t * 0.5, transition: 'opacity 200ms' }}/>
    </div>
  )
}
