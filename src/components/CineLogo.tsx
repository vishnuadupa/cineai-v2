import { useState, useEffect } from 'react'

export function CineLogo({ size = 32 }: { size?: number }) {
  const [winking, setWinking] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setWinking(true); setTimeout(() => setWinking(false), 240) }, 3800)
    return () => clearInterval(t)
  }, [])
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cine-grad-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4a261"/>
          <stop offset="55%" stopColor="#e76f8f"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#cine-grad-main)"/>
      {[10,20,30,40,50].map((x,i) => <rect key={i} x={x} y="9" width={i===4?4:6} height="3" rx="1.2" fill="#1a0e1d" opacity="0.35"/>)}
      <rect x="20" y={winking ? 30 : 25} width="6" height={winking ? 2 : 11} rx="2.5" fill="#1a0e1d" style={{ transition: 'height 180ms, y 180ms' }}/>
      <rect x="38" y="25" width="6" height="11" rx="2.5" fill="#1a0e1d"/>
      <path d="M22 44 Q32 52 42 44" stroke="#1a0e1d" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <g transform="translate(48, 18)">
        <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fef4d4"/>
      </g>
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
