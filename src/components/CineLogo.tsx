export function CineLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cine-grad-main" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f4a261"/>
          <stop offset="55%" stopColor="#e76f8f"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect x="10" y="26" width="44" height="28" rx="4" fill="none" stroke="url(#cine-grad-main)" strokeWidth="3"/>
      <g transform="translate(10,14) rotate(-12)">
        <rect x="0" y="0" width="44" height="10" rx="3" fill="url(#cine-grad-main)"/>
        <rect x="0" y="0" width="6" height="10" fill="#1a0e1d" opacity="0.5"/>
        <rect x="12" y="0" width="6" height="10" fill="#1a0e1d" opacity="0.5"/>
        <rect x="24" y="0" width="6" height="10" fill="#1a0e1d" opacity="0.5"/>
        <rect x="36" y="0" width="6" height="10" fill="#1a0e1d" opacity="0.5"/>
      </g>
      <path d="M20 4 L15 4 L14 -4 Z" fill="#fef4d4" transform="translate(30,36)"/>
    </svg>
  )
}

export function Brand() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <CineLogo size={32} />
      <span style={{ fontFamily: 'Inter Tight, sans-serif', fontWeight: 500, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Cine<span style={{ color: 'rgba(255,255,255,0.4)' }}> / </span>
        <span style={{ background: 'linear-gradient(135deg, #f4a261, #e76f8f, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ai</span>
      </span>
    </div>
  )
}
