# 🎬 CineAI — Movie Recommendation Engine

LLM-powered movie recommendations. Tell it your mood. Get 5 tailored picks with AI reasoning, personalized by your preference history.

**Live demo:** _coming after Vercel deploy_

---

## Stack

| Layer | Choice | Cost |
|-------|--------|------|
| Frontend | React 18 + Vite + Tailwind CSS | Free |
| State | Zustand | Free |
| Backend | Vercel Serverless Functions (Node.js 20) | Free forever |
| Database | MongoDB Atlas M0 | Free forever (512MB) |
| LLM | Google Gemini 1.5 Flash | Free (1,500 req/day) |
| Movie data | TMDB API | Free, unlimited |
| Hosting | Vercel Hobby | Free forever |
| CI/CD | GitHub Actions | Free (public repos) |

**Total monthly cost: $0**

---

## Local Setup

### Prerequisites

- Node.js 20+
- Free [MongoDB Atlas](https://cloud.mongodb.com) account — create an M0 cluster
- Free [Google AI Studio](https://aistudio.google.com) API key
- Free [TMDB](https://themoviedb.org/signup) API key
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

### 1. Clone and install

```bash
git clone https://github.com/vishnuadupa/movie-rec-engine
cd movie-rec-engine
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/movie-recs
GEMINI_API_KEY=AIza...
TMDB_API_KEY=abc123...
FRONTEND_URL=http://localhost:5173
```

### 3. Run locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API functions: proxied through Vite dev server

### 4. Run tests

```bash
npm run test
```

### 5. Deploy to Vercel

```bash
# One-time setup
vercel login
vercel link

# Add env vars (do this once)
vercel env add MONGODB_URI
vercel env add GEMINI_API_KEY
vercel env add TMDB_API_KEY
vercel env add FRONTEND_URL

# Deploy
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys on every push.

---

## Project Structure

```
movie-rec-engine/
├── api/                        ← Vercel Serverless Functions
│   ├── recommend.ts            → POST /api/recommend
│   ├── history.ts              → GET + DELETE /api/history
│   └── _lib/                   → shared (not exposed as routes)
│       ├── mongodb.ts          → Atlas singleton + Session schema
│       ├── gemini.ts           → Gemini Flash client + retry
│       ├── tmdb.ts             → movie search + poster enrichment
│       └── promptBuilder.ts    → history-aware prompt construction
│
├── src/                        ← React frontend
│   ├── App.tsx                 → main layout + orchestration
│   ├── components/             → MoodSelector, GenrePicker, etc.
│   ├── store/useRecsStore.ts   → Zustand global state
│   ├── api/client.ts           → Axios (relative URLs only)
│   └── utils/                  → userId (localStorage UUID), cn
│
├── .github/workflows/ci.yml   ← lint + typecheck + test gate
├── vercel.json                 ← SPA routing + function config
└── .env.example                ← env var template
```

---

## API

### `POST /api/recommend`

```json
{
  "userId": "uuid-from-localstorage",
  "mood": "melancholic but hopeful",
  "genres": ["drama", "sci-fi"],
  "recentWatches": ["Interstellar", "Arrival"],
  "freeText": "something like Interstellar but more emotional"
}
```

Returns 5 recommendations with reasoning, poster URL, TMDB rating, and mood match score.

### `GET /api/history?userId=xxx&limit=5`

Returns the user's last N sessions.

### `DELETE /api/history?userId=xxx`

Clears all sessions for the user.

---

## How Personalization Works

No user accounts. Personalization is built on a UUID stored in `localStorage`.

Every recommendation session is saved to MongoDB with a 30-day TTL (auto-expiry keeps the free tier comfortable). When you make a new request, the last 3 sessions are injected into the Gemini prompt as context — so the AI avoids repeating suggestions and understands your evolving taste.

---

## Resume Bullets

```
AI Movie Recommendation Engine  |  React · Node.js · MongoDB · Gemini API · Vercel

• Architected end-to-end LLM-powered recommendation system — natural language inputs
  produce tailored picks with per-film reasoning via Google Gemini Flash API

• Engineered serverless backend (Vercel Functions, Node.js 20 + TypeScript) with
  structured JSON output parsing, exponential backoff on rate limits, and MongoDB
  Atlas for persistent cross-session preference profiling

• Implemented context-aware prompt engineering — injects last 3 user sessions as
  LLM context for personalization without requiring user accounts

• Built CI/CD pipeline with GitHub Actions (ESLint, tsc, Vitest) and Vercel GitHub
  integration for zero-config continuous deployment

• Architected for $0/month: Vercel Hobby (compute + CDN), MongoDB Atlas M0 (512MB
  free forever), Gemini Flash (1,500 req/day free), TMDB (unlimited free)
```

---

## License

MIT
