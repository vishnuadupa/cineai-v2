# HANDOFF.md — Project State

> This file previously described the original scaffolding session (May 2026). It's rewritten here
> to reflect what's actually deployed — the project has since migrated providers, dropped its
> database, and switched `/api/recommend` to a streaming response. See `README.md` for the full
> user-facing writeup; this file is a terse internal reference.

---

## Current Stack

```
Frontend:  React 18 · Vite · TypeScript · Zustand (UI state) · fetch (no axios)
Backend:   Vercel Serverless Functions (Node, TypeScript)
LLM:       OpenRouter — defaults to anthropic/claude-haiku-4.5 (env: OPENROUTER_MODEL)
Movie data: TMDB v3
Persistence: none server-side — history + watchlist live in browser localStorage
Tests:     Vitest + @testing-library/react (no test files currently exist)
Deploy:    Vercel, auto-deploy from GitHub main
Cost:      $0 fixed — OpenRouter billed per token, everything else free-tier
```

## File Tree (as of this session)

```
D:\cineai-v2-full\
├── .env.example
├── .github/workflows/ci.yml
├── README.md
├── HANDOFF.md                    ← this file
├── index.html
├── package.json
├── vercel.json
├── vite.config.ts
├── api/
│   ├── recommend.ts               POST /api/recommend — streams NDJSON
│   ├── movie-details.ts           GET  /api/movie-details
│   ├── movie-lookup.ts            GET  /api/movie-lookup
│   └── _lib/
│       ├── openrouter.ts          OpenRouter streaming client + incremental JSON parser
│       ├── tmdb.ts                TMDB enrichment, /discover candidate pool, detail fetch
│       ├── promptBuilder.ts       Two-tier prompt construction
│       ├── types.ts               Shared types across the recommend pipeline
│       └── rateLimit.ts           Shared IP-based rate limiter
└── src/
    ├── main.tsx, App.tsx, index.css
    ├── api/client.ts               Typed API functions + NDJSON stream reader
    ├── store/useRecsStore.ts
    ├── utils/
    │   ├── localHistory.ts         History — localStorage, capped at 20 sessions
    │   ├── localWatchlist.ts       Watchlist — localStorage
    │   └── useWindowWidth.ts
    └── components/                 InputStage, LoadingStage, ResultsStage, MovieCard,
                                    DetailOverlay, HistoryPage, WatchlistPage, ChipGroup,
                                    FixedBackdrop, CineLogo
```

No `mongodb.ts`, `gemini.ts`, `userId.ts`, `history.ts`, or `watchlist.ts` API routes — all removed. No `axios` dependency — never was one in practice; `src/api/client.ts` has always used `fetch`.

## What Changed, and Why (most recent first)

- **Streaming `/api/recommend`** — was request/response (wait ~13s for all 9 candidates, enrich, filter, respond). Now streams OpenRouter's tokens, TMDB-enriches and filters each recommendation as its JSON completes, and sends NDJSON to the client as soon as each one's ready. First card renders in ~3-4s. Stops early once 6 pass the filter.
- **TMDB `/discover`-generated candidates** — before the LLM runs, `/discover/movie` builds a real candidate pool from genre/era/adult filters, narrowed by keyword ids pulled from liked films (e.g. "biography", "entrepreneur"). The LLM ranks and writes reasoning for 9 of these instead of inventing titles from memory. (Earlier attempt used TMDB's "similar movies" for liked films — too noisy, a niche biopic's "similar" list is just unrelated generic dramas — replaced with discover + keywords.) Adds some latency up front (worth knowing given the streaming work above).
- **MongoDB removed entirely** — there was no login and no cross-device story, so server-side persistence was pure liability (an outage there took down `/api/recommend` even though recommendations don't need a database). History and watchlist are now `localStorage`-only.
- **Gemini → OpenRouter** — model provider swapped; `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` replaced `GEMINI_API_KEY`.

## Environment Variables (current)

```
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=anthropic/claude-haiku-4.5   # optional
TMDB_API_KEY=...
FRONTEND_URL=https://your-deployment.vercel.app
```

## Known Gaps

- No test files exist despite `vitest`/`@testing-library` being installed — `npm run test` passes vacuously (`--passWithNoTests`).
- `getGroundingCandidates` (TMDB similar-movies lookup) runs sequentially before the LLM call starts, partially offsetting the streaming latency win when `liked` is non-empty. Not wrong, just a tradeoff nobody's revisited yet.

---

*Last updated: 2026-09-07*
