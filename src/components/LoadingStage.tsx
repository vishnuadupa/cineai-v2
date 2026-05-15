import { useState, useEffect } from 'react'

function FilmPerfs({ side }: { side: 'left' | 'right' }) {
  const perfs = Array.from({ length: 14 }, (_, i) => i)
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      [side]: 0, width: 56,
      background: 'linear-gradient(180deg, rgba(0,0,0,.5), rgba(0,0,0,.2), rgba(0,0,0,.5))',
      borderRight: side === 'left' ? '1px solid rgba(254,244,212,.08)' : 'none',
      borderLeft: side === 'right' ? '1px solid rgba(254,244,212,.08)' : 'none',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-around', alignItems: 'center',
      padding: '20px 0',
      animation: 'reelTravel 0.6s linear infinite',
    }}>
      {perfs.map(p => (
        <div key={p} style={{ width: 26, height: 18, background: '#0a0608', borderRadius: 4, border: '1px solid rgba(254,244,212,.1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.5)' }}/>
      ))}
    </div>
  )
}

function LeaderCircle({ count }: { count: number }) {
  const size = 380, r = 170
  const display = count > 0 ? String(count) : '●'
  return (
    <svg width={size} height={size} viewBox="-200 -200 400 400" style={{ filter: 'drop-shadow(0 0 60px rgba(244,162,97,.25))' }}>
      <circle r={r + 12} fill="none" stroke="rgba(254,244,212,.15)" strokeWidth="1"/>
      <circle r={r} fill="rgba(10,6,8,.6)" stroke="rgba(254,244,212,.85)" strokeWidth="3"/>
      <circle r={r - 32} fill="none" stroke="rgba(254,244,212,.35)" strokeWidth="1.5"/>
      <circle r={r - 64} fill="none" stroke="rgba(254,244,212,.18)" strokeWidth="1"/>
      <line x1={-r + 4} y1="0" x2={r - 4} y2="0" stroke="rgba(254,244,212,.45)" strokeWidth="1.5"/>
      <line x1="0" y1={-r + 4} x2="0" y2={r - 4} stroke="rgba(254,244,212,.45)" strokeWidth="1.5"/>
      <g style={{ transformOrigin: 'center', animation: 'sweep 1s linear infinite' }}>
        <path d={`M 0 0 L 0 ${-r} A ${r} ${r} 0 0 1 ${r * Math.sin(Math.PI / 2)} ${-r * Math.cos(Math.PI / 2)} Z`} fill="url(#wedgeGrad)"/>
      </g>
      <defs>
        <linearGradient id="wedgeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(244,162,97,.5)"/>
          <stop offset="100%" stopColor="rgba(244,162,97,0)"/>
        </linearGradient>
      </defs>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x1 = Math.sin(a) * (r - 6), y1 = -Math.cos(a) * (r - 6)
        const x2 = Math.sin(a) * (r + 4), y2 = -Math.cos(a) * (r + 4)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(254,244,212,.6)" strokeWidth={i % 3 === 0 ? 2 : 1}/>
      })}
      <text key={display} x="0" y="0" textAnchor="middle" dominantBaseline="central"
        fontSize="180" fontFamily="Georgia, serif" fill="#fef4d4"
        style={{ animation: 'leaderNum 480ms ease-out' }}>{display}</text>
      <text x="0" y="105" textAnchor="middle" dominantBaseline="central"
        fontSize="11" fontFamily="monospace" fill="rgba(254,244,212,.5)" letterSpacing="4">CINE/AI</text>
    </svg>
  )
}

export function LoadingStage() {
  const [count, setCount] = useState(10)
  const [statusIdx, setStatusIdx] = useState(0)

  useEffect(() => {
    if (count <= 0) return
    const t = setTimeout(() => setCount(c => c - 1), 800)
    return () => clearTimeout(t)
  }, [count])

  useEffect(() => {
    const t = setInterval(() => setStatusIdx(s => s + 1), 600)
    return () => clearInterval(t)
  }, [])

  const lines = [
    "Threading the reel",
    "Reading your taste profile",
    "Querying Gemini 2.5",
    "Cross-referencing TMDB",
    "Ranking by emotional fit",
    "Striking the print",
  ]
  const status = lines[statusIdx % lines.length]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'radial-gradient(ellipse at 50% 50%, #2a1812 0%, #0a0608 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      animation: 'leaderFlicker 110ms steps(1) infinite',
    }}>
      <FilmPerfs side="left" />
      <FilmPerfs side="right" />
      <div className="scratch s1"/>
      <div className="scratch s2"/>
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center',
        fontSize: 11, letterSpacing: '.4em', color: 'rgba(244,162,97,.85)',
        fontFamily: 'monospace',
      }}>
        NOW&nbsp;&nbsp;ROLLING — CINE&nbsp;/&nbsp;AI
      </div>
      <LeaderCircle count={count} />
      <div style={{ marginTop: 44, textAlign: 'center' }}>
        <div style={{ fontSize: 28, color: '#fef4d4', letterSpacing: '-0.01em', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {status}<span style={{ animation: 'blink 1s steps(2,end) infinite', color: '#f4a261' }}>…</span>
        </div>
        <div style={{ color: 'rgba(254,244,212,.45)', fontSize: 11, letterSpacing: '.2em', marginTop: 14, fontFamily: 'monospace' }}>
          REEL 01 · {String(6 - count).padStart(2, '0')} / 05
        </div>
      </div>
      <div className="film-grain"/>
    </div>
  )
}
