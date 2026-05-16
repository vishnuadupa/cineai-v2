# 🎬 CineAI

> *"Tell me how you feel. I'll find your film."*

CineAI is an AI-powered movie recommendation engine that reads your mood, your taste, and what you're feeling tonight — then hands you six films curated just for that moment. No browsing. No endless scrolling. No algorithm optimising for watch time. Just the right film, right now.

**Total monthly cost to run: $0**

---

## ✨ How It Works

### 1. You Set the Scene
Fill in up to six signals on the way in:

| Signal | What it captures |
|---|---|
| 🎭 **Mood** | Melancholy · Thrilled · Curious · Comfort · Awe · Unsettled · Tender · Playful |
| 🎬 **Genres** | 17 options — pick one or stack them |
| 📅 **Era** | Any era · Last 5 years · 2010s · Pre-2000 classics |
| 💛 **Films you've loved** | Add titles you adore — these shape the DNA of results |
| ✍️ **What you're feeling** | Free text, up to 500 chars — the more honest, the better |
| 🔞 **Adult content** | Off by default, explicitly opt-in |

### 2. Gemini Reads Between the Lines
Your signals get crafted into a rich, context-aware prompt and fired at **Google Gemini 2.0 Flash**. Gemini generates **9 film candidates** — each scored by emotional fit, kept tonally consistent with your liked films, and cross-checked against what it already recommended you in past sessions.

### 3. TMDB Verifies the Results
Every Gemini suggestion gets looked up on **The Movie Database**. Real posters, real ratings, real cast and director data get attached. Films whose TMDB-verified genres don't match what you asked for get quietly filtered out. The best **6** make the cut.

### 4. You Get Your Films
Each card shows the poster, match %, year, runtime, and TMDB rating. Hover to reveal Gemini's reasoning — *why this film, for this exact mood*. Click for the full picture: director, cast, overview, all genre tags.

---

## 🧠 The Smart Bits

### Genre Filtering That Actually Works
Gemini is creative — sometimes too creative. After enrichment, TMDB genre tags act as a ground-truth check:

- **Format genres** like Animation and Documentary require an exact TMDB match — no live-action films sneaking into an animated search
- **Thematic genres** allow natural affinities — Horror welcomes Thriller, Action welcomes Adventure
- **Adult toggle** is handled independently — turning it on opens the full catalogue without affecting genre logic

### Memory Without a Login
Every search is saved to MongoDB under an anonymous UUID stored in your browser's localStorage. When you return, Gemini knows what it already recommended you — no repeats, no account required, nothing personally linked to you.

Sessions auto-expire after 30 days via a MongoDB TTL index. The free tier stays comfortable.

### A Loading Screen That Respects You
No fake progress bars. The counter counts **up** from 0 — you see exactly how long you've been waiting. Every 6 seconds, a real cinema fact rotates in to keep you company. The component just unmounts when results arrive — no timers to manage.

---

## 🏗️ Tech Stack

```
Frontend      React 18 + TypeScript + Vite
Styling       Tailwind CSS  (custom cinema dark-brown theme)
State         Zustand
AI            Google Gemini 2.0 Flash
Movie Data    TMDB API
Database      MongoDB Atlas M0  (free forever, 512MB)
Hosting       Vercel  (serverless functions + static CDN)
CI/CD         GitHub Actions  (lint · typecheck · test on every push)
```

---

## 🗂️ Project Structure

```
cineai-v2/
├── api/                        Vercel serverless functions
│   ├── recommend.ts            POST /api/recommend
│   ├── history.ts              GET + DELETE /api/history
│   └── _lib/
│       ├── gemini.ts           Gemini API client with retry logic
│       ├── tmdb.ts             TMDB enrichment + genre filtering
│       ├── mongodb.ts          DB connection + Session schema
│       └── promptBuilder.ts    History-aware prompt construction
│
├── src/
│   ├── components/
│   │   ├── InputStage.tsx      The six-signal form + hero carousel
│   │   ├── LoadingStage.tsx    Cinematic loading screen + fun facts
│   │   ├── ResultsStage.tsx    Film grid with staggered animation
│   │   ├── MovieCard.tsx       Poster card with hover reveal
│   │   ├── DetailOverlay.tsx   Full film detail modal
│   │   ├── ChipGroup.tsx       Reusable mood / genre chip selector
│   │   ├── FixedBackdrop.tsx   Parallax hero backdrop
│   │   └── CineLogo.tsx        Brand mark
│   ├── data/
│   │   └── heroFilms.ts        Curated hero carousel + mood/genre data
│   ├── store/
│   │   └── useRecsStore.ts     Zustand global state
│   └── utils/
│       ├── userId.ts           Anonymous UUID management
│       └── cn.ts               Tailwind class utility
│
├── .github/workflows/ci.yml    Lint · typecheck · test gate
├── vercel.json                 SPA routing + security headers
└── .env.example                Environment variable template
```

---

## 🚀 Running Locally

```bash
# 1. Clone and install
git clone https://github.com/vishnuadupa/cineai-v2.git
cd cineai-v2
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in your keys (see below)

# 3. Start the dev server
npm run dev
# Frontend: http://localhost:5173
# API functions: proxied automatically through Vite
```

### Environment Variables

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `GEMINI_API_KEY` | aistudio.google.com → Get API Key |
| `TMDB_API_KEY` | themoviedb.org → Settings → API → Developer |
| `FRONTEND_URL` | `http://localhost:5173` for local · your Vercel URL for production |

---

## 📡 API Reference

### `POST /api/recommend`
Accepts mood, genres, era, adult flag, free-text feeling, and liked films.  
Returns 6 enriched film recommendations with poster, cast, director, genres, TMDB rating, and Gemini reasoning.

### `GET /api/history?userId=<uuid>`
Returns up to 20 past sessions for a user (capped server-side).

### `DELETE /api/history?userId=<uuid>`
Clears all history for a user.

---

## 🔒 Security

- UUID v4 format validated on every API request
- IP-based rate limiting on the recommend endpoint (10 req / hr)
- CORS restricted to configured `FRONTEND_URL` only
- Server-side input length limits on all user-supplied text
- API keys passed via request headers — never in URLs or logs
- Security headers set globally: CSP · X-Frame-Options · nosniff · Referrer-Policy
- MongoDB sessions auto-expire after 30 days (TTL index)
- Generic error messages — no internal stack traces or credentials leak to clients

---

## 🎡 The Hero Carousel

The landing page rotates through a hand-picked selection of films — each chosen to represent a different mood the app can capture. Backdrops are full-width TMDB images that blur and parallax as you scroll down to the form. Every film in the carousel has a short poetic *"why"* phrase written for it.

---

## 🎞️ Fun Facts in the Loading Screen

The loading screen rotates through 20 real cinema facts while Gemini works. A small thing — but it turns a 15-second wait into something that feels intentional rather than broken.

A few favourites:
- *The roar of the T-Rex in Jurassic Park is a baby elephant mixed with a tiger and alligator.*
- *Stanley Kubrick required 127 takes for a single scene in The Shining.*
- *The Wilhelm Scream has appeared in over 400 films since 1951.*

---

## 💸 Cost Breakdown

| Service | Free Tier |
|---|---|
| Vercel | Unlimited deployments, 100GB bandwidth/month |
| MongoDB Atlas M0 | 512MB storage, forever free |
| Gemini 2.0 Flash | 1,500 requests/day, 15 RPM |
| TMDB API | Unlimited requests |
| GitHub Actions | Free on public repos |

**Running total: $0/month**

---

## 📜 License

MIT — build something great with it.

---

<p align="center">
  <em>Built for the feeling of watching a great film for the very first time.</em>
</p>
