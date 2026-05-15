import { useState, useRef, useLayoutEffect } from 'react'

interface Option { id: string; label: string; hint?: string }
interface Props {
  options: Option[]
  value: string | string[]
  onChange: (val: string | string[]) => void
  multi?: boolean
  accent?: string
  size?: 'sm' | 'md'
}

export function ChipGroup({ options, value, onChange, multi = false, accent = '#f4a261', size = 'md' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [hover, setHover] = useState<number | null>(null)
  const [ind, setInd] = useState({ x: 0, y: 0, w: 0, h: 0, opacity: 0 })

  const isActive = (opt: Option) => multi ? (value as string[]).includes(opt.id) : value === opt.id

  const handleClick = (opt: Option) => {
    if (multi) {
      const arr = value as string[]
      onChange(arr.includes(opt.id) ? arr.filter(x => x !== opt.id) : [...arr, opt.id])
    } else {
      onChange(opt.id)
    }
  }

  useLayoutEffect(() => {
    if (hover === null) { setInd(p => ({ ...p, opacity: 0 })); return }
    const el = chipRefs.current[hover]
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const w = wrap.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    setInd({ x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height, opacity: 1 })
  }, [hover])

  const pad = size === 'sm' ? '8px 14px' : '10px 16px'
  const fz = size === 'sm' ? 13 : 14

  return (
    <div ref={wrapRef} onMouseLeave={() => setHover(null)}
      style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0,
        transform: `translate(${ind.x}px, ${ind.y}px)`,
        width: ind.w, height: ind.h, opacity: ind.opacity, borderRadius: 999,
        background: `linear-gradient(135deg, ${accent} 0%, #e76f8f 100%)`,
        boxShadow: `0 12px 32px -8px ${accent}66, 0 0 0 1px ${accent}aa inset`,
        transition: 'transform 380ms cubic-bezier(.2,.9,.2,1), width 380ms cubic-bezier(.2,.9,.2,1), height 380ms cubic-bezier(.2,.9,.2,1), opacity 220ms',
        pointerEvents: 'none', zIndex: 0,
      }}/>
      {options.map((opt, i) => {
        const active = isActive(opt)
        const hovered = hover === i
        return (
          <button key={opt.id} ref={el => { chipRefs.current[i] = el }}
            onMouseEnter={() => setHover(i)} onClick={() => handleClick(opt)}
            style={{
              position: 'relative', zIndex: 1,
              padding: pad, borderRadius: 999,
              border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              background: active ? `linear-gradient(135deg, ${accent} 0%, #e76f8f 100%)` : 'rgba(255,255,255,0.03)',
              color: active ? '#1a0e1d' : (hovered ? '#1a0e1d' : 'rgba(255,255,255,0.5)'),
              fontFamily: 'Inter Tight, sans-serif', fontSize: fz,
              fontWeight: active ? 600 : 500,
              letterSpacing: '-0.005em', cursor: 'pointer',
              transition: 'color 200ms, border-color 200ms',
              whiteSpace: 'nowrap',
              backdropFilter: hovered || active ? 'none' : 'blur(8px)',
              boxShadow: active ? `0 12px 32px -8px ${accent}55` : 'none',
            }}>
            {opt.label}
            {opt.hint && (active || hovered) && (
              <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {opt.hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
