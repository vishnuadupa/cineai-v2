import { useState } from 'react'
import { InputStage }    from './components/InputStage'
import { LoadingStage }  from './components/LoadingStage'
import { ResultsStage }  from './components/ResultsStage'
import { DetailOverlay } from './components/DetailOverlay'
import { getUserId }     from './utils/userId'
import { postRecommend, type Movie, type RecommendRequest } from './api/client'

type Stage = 'input' | 'loading' | 'results'
type Params = Omit<RecommendRequest, 'userId'>

export default function App() {
  const [stage, setStage] = useState<Stage>('input')
  const [params, setParams] = useState<Params | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [open, setOpen] = useState<Movie | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (p: Params) => {
    setParams(p)
    setStage('loading')
    window.scrollTo({ top: 0, behavior: 'auto' })
    setError(null)
    try {
      const res = await postRecommend({ ...p, userId: getUserId() })
      setMovies(res.recommendations)
      setStage('results')
    } catch (err: unknown) {
      const e = err as { response?: { status: number } }
      const msg = e.response?.status === 429
        ? 'Gemini is busy right now — please try again in a moment.'
        : e.response?.status === 503
        ? 'Gemini is overloaded — please try again shortly.'
        : 'Something went wrong. Please try again.'
      setError(msg)
      setStage('input')
    }
  }

  const handleReset = () => {
    setStage('input')
    setMovies([])
    setError(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <>
      {stage === 'input' && (
        <>
          <InputStage onSubmit={handleSubmit} />
          {error && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 200, padding: '14px 24px', borderRadius: 999,
              background: 'rgba(20,10,10,0.95)', border: '1px solid rgba(231,111,143,0.4)',
              color: '#e76f8f', fontSize: 14, fontFamily: 'Inter Tight, sans-serif',
              backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
            }}>
              {error}
            </div>
          )}
        </>
      )}

      {stage === 'loading' && <LoadingStage />}

      {stage === 'results' && params && (
        <ResultsStage
          params={{ mood: params.mood, genres: params.genres, liked: params.liked }}
          movies={movies}
          onReset={handleReset}
          onOpen={setOpen}
        />
      )}

      {open && <DetailOverlay movie={open} onClose={() => setOpen(null)} />}

      {/* Global animation keyframes */}
      <style>{`
        :root {
          --accent: #f4a261;
          --rose:   #e76f8f;
          --plum:   #8b5cf6;
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: #0c0510; color: #f3ece1; font-family: 'Inter Tight', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0c0510; }
        ::-webkit-scrollbar-thumb { background: rgba(244,162,97,0.3); border-radius: 2px; }

        @keyframes heroIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bob     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes cardIn  {
          0%   { opacity: 0; transform: scale(0.6) translateY(40px); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes detailIn { from { opacity: 0; transform: scale(0.96) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes sweep    { to { transform: rotate(360deg); } }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes blink    { 50% { opacity: 0; } }
        @keyframes leaderNum {
          from { opacity: 0; transform: scale(1.6); filter: blur(8px); }
          50%  { opacity: 1; filter: blur(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes leaderFlicker {
          0%,100% { filter: brightness(1); }
          15%  { filter: brightness(.94); }
          30%  { filter: brightness(1.03); }
          45%  { filter: brightness(.96); }
          70%  { filter: brightness(1.01); }
        }
        @keyframes reelTravel {
          from { background-position-y: 0; }
          to   { background-position-y: 56px; }
        }
        @keyframes grain {
          0%  { transform: translate(0, 0); }
          25% { transform: translate(-3px, 2px); }
          50% { transform: translate(2px, -3px); }
          75% { transform: translate(-2px, -2px); }
        }
        @keyframes scratchA { 0%,88%,100% { opacity: 0; } 90%,92% { opacity: .9; } }
        @keyframes scratchB { 0%,78%,100% { opacity: 0; } 80%,82% { opacity: .7; } }

        .film-grain {
          position: absolute; inset: 0; pointer-events: none; z-index: 5;
          mix-blend-mode: overlay; opacity: .15;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>");
          animation: grain 250ms steps(1) infinite;
        }
        .scratch { position: absolute; top: 0; bottom: 0; width: 1px; background: linear-gradient(180deg, transparent, rgba(254,244,212,.6), transparent); pointer-events: none; z-index: 4; }
        .scratch.s1 { left: 30%; animation: scratchA 2.3s linear infinite; opacity: 0; }
        .scratch.s2 { left: 68%; animation: scratchB 3.7s linear infinite; opacity: 0; }

        @media (max-width: 760px) {
          .movie-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
        }
      `}</style>
    </>
  )
}
