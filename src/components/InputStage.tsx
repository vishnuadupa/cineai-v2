import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { FixedBackdrop } from './FixedBackdrop'
import { Brand } from './CineLogo'
import { ChipGroup } from './ChipGroup'
import { HERO_FILMS, MOODS, GENRES, ERA_OPTIONS } from '../data/heroFilms'
import type { RecommendRequest } from '../api/client'

type Params = Omit<RecommendRequest, 'userId'>

interface Props { onSubmit: (p: Params) => void }

export function InputStage({ onSubmit }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const [filmIdx, setFilmIdx] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  // Form state — matching design exactly
  const [mood, setMood] = useState('melancholy')
  const [genres, setGenres] = useState<string[]>(['Science Fiction', 'Drama'])
  const [era, setEra] = useState('any')
  const [adult, setAdult] = useState(false)
  const [feeling, setFeeling] = useState('')
  const [liked, setLiked] = useState<string[]>([])
  const [likedInput, setLikedInput] = useState('')

  // Auto-rotate hero
  useEffect(() => {
    const t = setInterval(() => setFilmIdx(x => (x + 1) % HERO_FILMS.length), 5500)
    return () => clearInterval(t)
  }, [])

  // Track scroll
  useEffect(() => {
    let raf = 0
    const handle = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setScrollY(window.scrollY)) }
    window.addEventListener('scroll', handle, { passive: true })
    handle()
    return () => { window.removeEventListener('scroll', handle); cancelAnimationFrame(raf) }
  }, [])

  const scrollToForm = () => {
    const target = formRef.current
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - 20
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const addLiked = () => {
    const t = likedInput.trim()
    if (t && !liked.includes(t)) { setLiked([...liked, t]); setLikedInput('') }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addLiked() }
  }

  const submit = () => onSubmit({ mood, genres, era, adult, feeling, liked })

  const p = HERO_FILMS[filmIdx]
  const genreOpts = GENRES.map(g => ({ id: g, label: g }))
  const moodOpts = MOODS

  return (
    <div>
      <FixedBackdrop films={HERO_FILMS} i={filmIdx} scrollY={scrollY}/>

      {/* ── HERO SECTION ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 680, zIndex: 2 }}>
        {/* Topbar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 56px' }}>
          <Brand />
        </div>

        {/* Hero copy */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', maxWidth: 780 }}>
          <div style={{ fontSize: 11, letterSpacing: '.25em', color: '#f4a261', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#f4a261', boxShadow: '0 0 12px #f4a261', display: 'inline-block' }}/>
            TONIGHT'S PREVIEW · {String(filmIdx + 1).padStart(2, '0')} / {String(HERO_FILMS.length).padStart(2, '0')}
          </div>
          <h1 key={p.title + filmIdx} style={{
            fontSize: 'clamp(56px, 7vw, 96px)', lineHeight: 0.92, margin: 0,
            letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', fontWeight: 400,
            animation: 'heroIn 700ms cubic-bezier(.2,.7,.2,1)',
            color: '#f3ece1',
          }}>{p.title}</h1>
          <div key={'meta' + filmIdx} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, color: 'rgba(255,255,255,0.5)', fontSize: 13, animation: 'heroIn 800ms 80ms cubic-bezier(.2,.7,.2,1) both' }}>
            <span>{p.year}</span>
            <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/>
            <span>{p.runtime}m</span>
            <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 999 }}/>
            <span style={{ color: '#f4a261' }}>★ {p.rating}</span>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg, #f4a261, #e76f8f)', color: '#1a0e1d', fontFamily: 'monospace' }}>{p.match}% MATCH</span>
          </div>
          <p key={'q' + filmIdx} style={{ fontSize: 22, color: '#f4a261', maxWidth: 540, marginTop: 28, lineHeight: 1.4, fontFamily: 'Georgia, serif', fontStyle: 'italic', animation: 'heroIn 900ms 160ms cubic-bezier(.2,.7,.2,1) both' }}>
            "{p.why}"
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 300, maxWidth: 480, marginTop: 22 }}>
            One of six waiting for you tonight. Scroll to set the scene — or roll now.
          </p>
        </div>

        {/* Slideshow dots */}
        <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HERO_FILMS.map((_, idx) => (
            <button key={idx} onClick={() => setFilmIdx(idx)} style={{
              width: 4, height: idx === filmIdx ? 22 : 4, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: idx === filmIdx ? 'linear-gradient(180deg, #f4a261, #e76f8f)' : 'rgba(255,255,255,.25)',
              transition: 'all 380ms cubic-bezier(.2,.8,.2,1)', padding: 0,
            }}/>
          ))}
        </div>

        {/* Scroll down affordance */}
        <button onClick={scrollToForm} style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'Inter Tight, sans-serif', fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase' }}>
          <span>Set the scene</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'bob 1.6s ease-in-out infinite' }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* ── SETUP PANEL ── */}
      <section ref={formRef} style={{ position: 'relative', zIndex: 2, padding: '120px 56px 140px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ maxWidth: 720, marginBottom: 72 }}>
          <div style={{ fontSize: 11, letterSpacing: '.25em', color: '#f4a261', marginBottom: 16, fontFamily: 'monospace' }}>
            STEP 02 · TELL US THE SHAPE OF THE NIGHT
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 0.95, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', fontWeight: 400, color: '#f3ece1' }}>
            Set the{' '}
            <span style={{ background: 'linear-gradient(135deg, #f4a261, #e76f8f, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic' }}>scene</span>.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 17, marginTop: 18, maxWidth: 540, fontWeight: 300, lineHeight: 1.55 }}>
            A few honest signals. Gemini reads between the lines and casts six films.
          </p>
        </div>

        <Field label="01" title="Mood">
          <ChipGroup options={moodOpts} value={mood} onChange={v => setMood(v as string)} accent="#f4a261"/>
        </Field>

        <Field label="02" title="Genres" subtitle="pick a few — or many">
          <ChipGroup options={genreOpts} value={genres} onChange={v => setGenres(v as string[])} multi accent="#e76f8f"/>
        </Field>

        <Field label="03" title="Era">
          <ChipGroup options={ERA_OPTIONS} value={era} onChange={v => setEra(v as string)} accent="#8b5cf6"/>
        </Field>

        <Field label="04" title="Films you've loved" subtitle="we read between them">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: liked.length ? 14 : 0 }}>
            {liked.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 14px', background: 'linear-gradient(135deg, rgba(244,162,97,.18), rgba(231,111,143,.18))', border: '1px solid rgba(244,162,97,.4)', borderRadius: 999, color: '#f4a261', fontSize: 13, fontWeight: 500 }}>
                {t}
                <button onClick={() => setLiked(liked.filter(x => x !== t))} style={{ width: 18, height: 18, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,.1)', color: '#f4a261', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(255,255,255,.025)', backdropFilter: 'blur(20px)', padding: '4px 4px 4px 16px', maxWidth: 480 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 10, fontSize: 14 }}>+</span>
            <input value={likedInput} onChange={e => setLikedInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add a film…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f3ece1', fontFamily: 'inherit', fontSize: 15, padding: '10px 0' }}/>
            <button onClick={addLiked} disabled={!likedInput.trim()} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: likedInput.trim() ? 'linear-gradient(135deg, #f4a261, #e76f8f)' : 'transparent', color: likedInput.trim() ? '#1a0e1d' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600, cursor: likedInput.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Add</button>
          </div>
        </Field>

        <Field label="05" title="What are you feeling tonight?" subtitle="free text — extra context for Gemini">
          <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, background: 'rgba(255,255,255,.025)', backdropFilter: 'blur(20px)', transition: 'border-color 200ms' }}
            onFocus={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#f4a261'}
            onBlur={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <textarea value={feeling} onChange={e => setFeeling(e.target.value)}
              placeholder="Rainy day, just got off a long shift. Want something slow, maybe gorgeous, but not depressing."
              rows={3} maxLength={500} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#f3ece1', fontFamily: 'inherit', fontSize: 17, lineHeight: 1.5, padding: '18px 20px', resize: 'none', fontWeight: 300, boxSizing: 'border-box' }}/>
            <div style={{ position: 'absolute', right: 14, bottom: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{feeling.length} / 500</div>
          </div>
        </Field>

        <Field label="06" title="Content filter">
          <button onClick={() => setAdult(!adult)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 18px', background: adult ? 'rgba(244,162,97,.08)' : 'rgba(255,255,255,.025)', border: `1px solid ${adult ? 'rgba(244,162,97,.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, cursor: 'pointer', transition: 'all 220ms', fontFamily: 'inherit', color: '#f3ece1', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Include 18+ titles</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontWeight: 300 }}>Mature themes, nudity, graphic violence.</div>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 999, position: 'relative', background: adult ? 'linear-gradient(135deg, #f4a261, #e76f8f)' : 'rgba(255,255,255,.08)', transition: 'background 220ms', flexShrink: 0, boxShadow: adult ? '0 6px 16px -4px rgba(244,162,97,.5)' : 'none' }}>
              <div style={{ position: 'absolute', top: 3, left: adult ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: '#fef4d4', transition: 'left 280ms cubic-bezier(.4,1.6,.6,1)', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}/>
            </div>
          </button>
        </Field>

        {/* Submit */}
        <div style={{ marginTop: 80, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <button onClick={submit} style={{ position: 'relative', padding: '22px 40px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #f4a261 0%, #e76f8f 50%, #8b5cf6 100%)', backgroundSize: '200% 200%', color: '#1a0e1d', fontFamily: 'inherit', fontSize: 17, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 14, transition: 'transform 220ms cubic-bezier(.2,.7,.2,1), box-shadow 220ms', boxShadow: '0 20px 50px -10px rgba(244,162,97,.5), 0 0 0 1px rgba(255,255,255,.1) inset' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 30px 70px -10px rgba(231,111,143,.6), 0 0 0 1px rgba(255,255,255,.15) inset' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 50px -10px rgba(244,162,97,.5), 0 0 0 1px rgba(255,255,255,.1) inset' }}
          >
            <span>Find my six films</span>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: '.05em', fontFamily: 'monospace' }}>⌘ + ENTER</span>
        </div>
      </section>
    </div>
  )
}

function Field({ label, title, subtitle, children }: { label: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
        <span style={{ color: '#f4a261', fontSize: 11, letterSpacing: '.15em', opacity: 0.7, fontFamily: 'monospace' }}>{label}</span>
        <h3 style={{ margin: 0, fontFamily: 'inherit', fontSize: 17, fontWeight: 500, letterSpacing: '-0.005em', color: '#f3ece1' }}>{title}</h3>
        {subtitle && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>— {subtitle}</span>}
      </div>
      {children}
    </div>
  )
}
