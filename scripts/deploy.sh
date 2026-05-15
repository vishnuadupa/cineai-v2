#!/usr/bin/env bash
# deploy.sh — one-shot Vercel deploy script
# Run from project root after filling in .env.local

set -e

echo ""
echo "🎬 CineAI Deploy Script"
echo "========================"
echo ""

# ── 1. Check .env.local exists ──────────────────────────────────
if [ ! -f ".env.local" ]; then
  echo "❌ .env.local not found."
  echo "   Run: cp .env.example .env.local"
  echo "   Then fill in your 4 API keys."
  exit 1
fi

# ── 2. Check required keys are set ──────────────────────────────
missing=0
for var in MONGODB_URI GEMINI_API_KEY TMDB_API_KEY; do
  val=$(grep "^${var}=" .env.local | cut -d= -f2-)
  if [ -z "$val" ] || echo "$val" | grep -qE "your_|USERNAME|PASSWORD"; then
    echo "❌ $var is not set in .env.local"
    missing=1
  else
    echo "✓  $var is set"
  fi
done

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "Fill in all keys in .env.local before deploying."
  exit 1
fi

echo ""

# ── 3. Install deps ──────────────────────────────────────────────
echo "📦 Installing dependencies..."
npm ci

# ── 4. Lint + typecheck + test ───────────────────────────────────
echo ""
echo "🔍 Running quality checks..."
npm run lint
npm run typecheck
npm run test

echo ""
echo "✅ All checks passed."
echo ""

# ── 5. Build ─────────────────────────────────────────────────────
echo "🔨 Building..."
npm run build

echo ""
echo "✅ Build successful."
echo ""

# ── 6. Vercel deploy ─────────────────────────────────────────────
if ! command -v vercel &> /dev/null; then
  echo "📥 Installing Vercel CLI..."
  npm install -g vercel
fi

echo "🚀 Deploying to Vercel..."
echo ""

# Push env vars to Vercel (will prompt if not logged in)
echo "Adding environment variables to Vercel..."
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [ -z "$key" ] && continue
  # Only push the 4 required vars
  if [[ "$key" =~ ^(MONGODB_URI|GEMINI_API_KEY|TMDB_API_KEY|FRONTEND_URL)$ ]]; then
    echo "$value" | vercel env add "$key" production 2>/dev/null || \
    echo "  (skipped $key — already set or needs manual add)"
  fi
done < .env.local

echo ""
vercel --prod

echo ""
echo "🎬 Deployed! Update FRONTEND_URL in Vercel dashboard:"
echo "   Settings → Environment Variables → FRONTEND_URL → your-app.vercel.app"
echo ""
echo "Then run the smoke test:"
echo "   BASE=https://your-app.vercel.app"
echo '   curl -X POST "$BASE/api/recommend" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"userId":"test","mood":"hopeful","genres":["drama"],"recentWatches":[],"freeText":"an uplifting film"}'"'"' | head -c 200'
