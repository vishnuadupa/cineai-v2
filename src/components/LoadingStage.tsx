import { useState, useEffect } from 'react'

const FUN_FACTS = [
  "The shower scene in Psycho used 70 camera setups for just 45 seconds of footage.",
  "The roar of the T-Rex in Jurassic Park is a baby elephant mixed with a tiger and alligator.",
  "Heath Ledger stayed alone in a hotel room for 6 weeks to develop the Joker character.",
  "Titanic (1997) cost more to make than the actual Titanic ship did to build.",
  "The Lord of the Rings trilogy was shot over 438 consecutive days.",
  "Stanley Kubrick required 127 takes for a single scene in The Shining.",
  "The original Star Wars was rejected by every major studio except 20th Century Fox.",
  "Inception's iconic 'BRAAAM' sound is now used in almost every blockbuster trailer.",
  "Alfred Hitchcock never won an Academy Award for directing.",
  "The sound of lightsabers in Star Wars comes from a TV set mixed with a film projector.",
  "Clint Eastwood was 88 when he directed The Mule — and starred in it.",
  "The smoke in the Blade Runner world was added because Harrison Ford kept smoking on set.",
  "Over 27,000 bees were used in the filming of The Swarm (1978).",
  "Pulp Fiction's $8M budget was spent mostly on cast salaries — the sets were mostly real locations.",
  "The dancing penguin in Happy Feet required a real tap dancer to wear a motion capture suit.",
  "There are more possible games of chess than atoms in the observable universe — like film plots.",
  "Pixar's 'RenderFarm' took 29 hours to render a single frame of Monsters University.",
  "The Wilhelm Scream has been used in over 400 films since 1951.",
  "John Williams composed the Jaws theme in just two notes — one of cinema's most iconic scores.",
  "The Matrix lobby shootout scene took 10 days to film and used 12 cameras simultaneously.",
]

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

function LeaderCircle({ elapsed }: { elapsed: number }) {
  const size = 380, r = 170
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
      {/* Count up — shows real elapsed seconds */}
      <text key={elapsed} x="0" y="0" textAnchor="middle" dominantBaseline="central"
        fontSize="180" fontFamily="Georgia, serif" fill="#fef4d4"
        style={{ animation: 'leaderNum 480ms ease-out' }}>{elapsed}</text>
      <text x="0" y="105" textAnchor="middle" dominantBaseline="central"
        fontSize="11" fontFamily="monospace" fill="rgba(254,244,212,.5)" letterSpacing="4">CINE/AI</text>
    </svg>
  )
}

export function LoadingStage() {
  const [elapsed, setElapsed]     = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)
  const [factIdx, setFactIdx]     = useState(() => Math.floor(Math.random() * FUN_FACTS.length))
  const [factVisible, setFactVisible] = useState(true)

  // Count up every second — stops naturally when component unmounts (results arrive)
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Rotate status line quickly
  useEffect(() => {
    const t = setInterval(() => setStatusIdx(s => s + 1), 2200)
    return () => clearInterval(t)
  }, [])

  // Rotate fun facts every 6 seconds with a fade transition
  useEffect(() => {
    const t = setInterval(() => {
      setFactVisible(false)
      setTimeout(() => {
        setFactIdx(i => (i + 1) % FUN_FACTS.length)
        setFactVisible(true)
      }, 400)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const statusLines = [
    "Threading the reel",
    "Reading your taste profile",
    "Consulting the curator",
    "Cross-referencing TMDB",
    "Ranking by emotional fit",
    "Striking the print",
  ]
  const status = statusLines[statusIdx % statusLines.length]

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

      <LeaderCircle elapsed={elapsed} />

      {/* Status + elapsed */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 22, color: '#fef4d4', letterSpacing: '-0.01em', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {status}<span style={{ animation: 'blink 1s steps(2,end) infinite', color: '#f4a261' }}>…</span>
        </div>
        <div style={{ color: 'rgba(254,244,212,.35)', fontSize: 11, letterSpacing: '.2em', marginTop: 8, fontFamily: 'monospace' }}>
          {elapsed}s elapsed
        </div>
      </div>

      {/* Fun fact */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        maxWidth: 520, textAlign: 'center', padding: '0 24px',
        opacity: factVisible ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}>
        <div style={{ color: '#f4a261', fontSize: 10, letterSpacing: '.2em', fontFamily: 'monospace', marginBottom: 10 }}>
          DID YOU KNOW
        </div>
        <div style={{ color: 'rgba(254,244,212,.6)', fontSize: 14, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
          {'"'}{FUN_FACTS[factIdx]}{'"'}
        </div>
      </div>

      <div className="film-grain"/>
    </div>
  )
}
