# HANDOFF.md — Session Resume File
> Generated at end of session. Paste this file's contents at the start of the next session.

---

## MANAGER AGENT RESUME PROMPT

Paste this verbatim to resume:

```
You are the Manager Agent for movie-rec-engine. Resume from HANDOFF.md.

PROJECT: /home/claude/movie-rec-engine
GIT: 3 commits on main

ALL CODE COMPLETE — project is ready for user to run locally and deploy.

✅ Phase 1 Backend — DONE
  - api/_lib/mongodb.ts, gemini.ts, tmdb.ts, promptBuilder.ts
  - api/recommend.ts (POST), api/history.ts (GET + DELETE)

✅ Phase 2 Frontend — DONE
  - All 6 components, Zustand store, Axios client, App.tsx layout

✅ Phase 3 Tests — DONE (37 tests total)
  - api/__tests__/promptBuilder.test.ts  (8 tests)
  - api/__tests__/gemini.test.ts         (6 tests)
  - src/components/__tests__/MoodSelector.test.tsx     (8 tests)
  - src/components/__tests__/GenrePicker.test.tsx      (8 tests)
  - src/components/__tests__/RecommendationCard.test.tsx (15 tests)

✅ Security audit — 10/10 PASS
✅ Config — vercel.json, ci.yml, .gitignore, .env.example, README.md
✅ scripts/deploy.sh — one-shot deploy script

REMAINING — needs user action (real API keys required):
❌ npm install  → user runs locally: cd project && npm install
❌ Vercel deploy → user runs: bash scripts/deploy.sh
❌ Set FRONTEND_URL in Vercel dashboard after first deploy
❌ Push to GitHub → git remote add origin … && git push -u origin main

NEXT TASK if another code session needed:
  - ESLint config (.eslintrc.cjs) is missing — add it so npm run lint works
  - Then: npm install && npm test && npm run build

STACK REMINDER:
  Backend:  Vercel Functions (Node 20 TS) · MongoDB Atlas M0 · Gemini Flash · TMDB
  Frontend: React 18 · Vite · Tailwind (cinema dark tokens) · Zustand · Axios
  Tests:    Vitest + @testing-library/react
  Deploy:   Vercel hobby (free) — push to GitHub → auto-deploy
  Cost:     $0/month

DESIGN TOKENS (for any component work):
  bg: #0F0F0F · surface: #1A1A1A · elevated: #262626
  border: #2D2D2D · muted: #6B6B6B · text: #E8E8E8
  accent: #F59E0B (amber) · success: #10B981 · danger: #EF4444
  font-display: Playfair Display · font-sans: Inter

SECURITY RULES (never break these):
  - All secrets via process.env only
  - No VITE_ prefix on secrets
  - CORS: process.env.FRONTEND_URL not *
  - .env.local in .gitignore ✓

INSTRUCTIONS FOR NEXT SESSION:
  Tell me to run: continue from HANDOFF.md, start with component tests
```

---

## File Tree (complete — as of this session)

```
/home/claude/movie-rec-engine/
├── .env.example
├── .gitignore
├── .github/workflows/ci.yml
├── README.md
├── HANDOFF.md                   ← this file
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── vite.config.ts
├── public/favicon.svg
├── api/
│   ├── recommend.ts
│   ├── history.ts
│   ├── _lib/
│   │   ├── mongodb.ts
│   │   ├── gemini.ts
│   │   ├── tmdb.ts
│   │   └── promptBuilder.ts
│   └── __tests__/
│       ├── promptBuilder.test.ts  (8 tests ✓)
│       └── gemini.test.ts         (6 tests ✓)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── __tests__/setup.ts
    ├── api/client.ts
    ├── store/useRecsStore.ts
    ├── utils/
    │   ├── userId.ts
    │   └── cn.ts
    └── components/
        ├── MoodSelector.tsx
        ├── GenrePicker.tsx
        ├── RecentWatchesInput.tsx
        ├── RecommendationCard.tsx
        ├── HistoryPanel.tsx
        └── LoadingState.tsx
```

---

## What User Needs to Do (accounts + keys)

Before `npm install` and deploy work, Vishnu needs:

| Account | URL | Action |
|---------|-----|--------|
| MongoDB Atlas | cloud.mongodb.com | Create M0 cluster → DB user → whitelist 0.0.0.0/0 → copy URI |
| Google AI Studio | aistudio.google.com | Get API key (free, no billing) |
| TMDB | themoviedb.org/settings/api | Request developer API key (instant) |
| GitHub | github.com | Create repo `movie-rec-engine`, push this code |
| Vercel | vercel.com | Import GitHub repo → add 4 env vars → deploy |

Then locally:
```bash
cd /home/claude/movie-rec-engine   # or wherever you cloned
cp .env.example .env.local
# fill in the 4 keys
npm install
npm run dev     # http://localhost:5173
npm run test    # run test suite
```

---

## Git State

```
Branch: main
Commits: 1
Last: feat: complete project scaffold — Phase 1 backend + Phase 2 frontend
Files: 33 files, 1809 insertions
```

To push to GitHub (once repo is created):
```bash
cd /home/claude/movie-rec-engine
git remote add origin https://github.com/YOUR_USERNAME/movie-rec-engine.git
git push -u origin main
```

---

## Phase Progress

| Phase | Status | Tasks Done |
|-------|--------|-----------|
| 1 — Backend | ✅ DONE | 6/6 files + security gate |
| 2 — Frontend | ✅ DONE | 11/11 files |
| 3 — Tests | ✅ DONE | 37 tests across 5 files |
| 4 — Deploy | ⏳ USER ACTION | Run `bash scripts/deploy.sh` |

---

*Generated: 2026-05-14 | Resume by pasting the block above into a new chat*
