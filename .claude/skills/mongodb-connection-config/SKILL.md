---
name: mongodb-connection-config
description: >
  Configure MongoDB client connections correctly: connection pools, timeouts,
  retry logic, and Vercel/serverless-specific patterns. Use when setting up
  mongoose or the MongoDB Node.js driver, debugging connection errors,
  optimizing pool size, handling serverless cold starts, or seeing errors like
  "MongoServerSelectionError", "connection refused", "ECONNRESET", or
  "buffering timed out". Triggers on: "connect to MongoDB", "connection pool",
  "mongoose connect", "MONGODB_URI", "serverless connection".
source:
  repository: mongodb/agent-skills
  ref: main
  path: skills/mongodb-connection-config
---

# MongoDB Connection Configuration

## Serverless / Vercel Pattern (this project)

Serverless functions are stateless but containers are reused between warm
invocations. Cache the connection on `global` to avoid exhausting the Atlas
M0 connection limit (500 max connections).

```ts
// api/_lib/mongodb.ts — canonical pattern for this project
import mongoose from 'mongoose'

declare global {
  var _mongoConn: typeof mongoose | null
}

export async function connectDB(): Promise<typeof mongoose> {
  // Reuse existing connection if healthy
  if (global._mongoConn && mongoose.connection.readyState === 1) {
    return global._mongoConn
  }

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  global._mongoConn = await mongoose.connect(uri, {
    bufferCommands:           false,  // fail fast if not connected
    maxPoolSize:              5,      // low for serverless — many instances × 5
    serverSelectionTimeoutMS: 5000,   // fail after 5s if Atlas unreachable
    socketTimeoutMS:          30000,  // match Vercel maxDuration
  })

  return global._mongoConn
}
```

## Pool Sizing by Environment

| Environment | maxPoolSize | Reason |
|-------------|-------------|--------|
| Vercel Serverless | 5 | Many concurrent instances; keep total connections low |
| Traditional server (1 instance) | 10–100 | Single process, scale up |
| Atlas M0 free tier | ≤ 5 | Hard limit ~500 total; be conservative |
| Atlas M10+ | 10–50 | More headroom |

## Timeout Settings

```ts
{
  serverSelectionTimeoutMS: 5000,   // How long to wait to find a server
  connectTimeoutMS:         10000,  // TCP connection timeout
  socketTimeoutMS:          30000,  // Match your function's max duration
  heartbeatFrequencyMS:     10000,  // How often to check server health
  waitQueueTimeoutMS:       5000,   // How long to wait for a pool slot
}
```

## Retry Logic

Atlas M0 occasionally has transient connection blips. Build in retry:

```ts
async function connectWithRetry(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB()
      return
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `MongoServerSelectionError` | Can't reach Atlas | Check network access list: add `0.0.0.0/0` in Atlas |
| `Authentication failed` | Wrong URI credentials | Re-copy URI from Atlas → Connect → Drivers |
| `ECONNRESET` | Connection dropped | Add `socketTimeoutMS`, use retry logic |
| `buffering timed out` | `bufferCommands: true` + no connection | Set `bufferCommands: false` to fail fast |
| `connection pool paused` | Previous error state | Call `mongoose.disconnect()` then reconnect |
| Too many connections | maxPoolSize too high × many instances | Lower maxPoolSize to 5 for serverless |

## Atlas Network Access

Atlas M0 requires explicit IP allowlisting. For development + Vercel:
- Add `0.0.0.0/0` (all IPs) — required for Vercel since IPs are dynamic
- For production with static IPs: allowlist specific CIDR ranges

Atlas Dashboard → Network Access → Add IP Address → Allow Access from Anywhere

## Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/DATABASE_NAME
  ?retryWrites=true
  &w=majority
  &appName=movie-rec-engine
```

Never embed credentials in source code. Always `process.env.MONGODB_URI`.
