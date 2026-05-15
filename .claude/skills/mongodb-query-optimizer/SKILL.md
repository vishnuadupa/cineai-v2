---
name: mongodb-query-optimizer
description: >
  Analyze and optimize MongoDB query performance. Use when queries are slow,
  when creating indexes, when using explain(), when debugging aggregation
  pipelines, or when checking index usage with Atlas Performance Advisor.
  Triggers on: "slow query", "add index", "createIndex", "explain plan",
  "query performance", "aggregation slow", "index hint", "covered query".
source:
  repository: mongodb/agent-skills
  ref: main
  path: skills/mongodb-query-optimizer
---

# MongoDB Query Optimizer

## Index Types

```js
// Single field
db.sessions.createIndex({ userId: 1 })           // ascending
db.sessions.createIndex({ createdAt: -1 })        // descending

// Compound — field order matters (ESR rule: Equality → Sort → Range)
db.sessions.createIndex({ userId: 1, createdAt: -1 })

// Unique
db.users.createIndex({ email: 1 }, { unique: true })

// TTL — auto-delete documents after expiry
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Text search
db.movies.createIndex({ title: 'text', synopsis: 'text' })

// Partial — index only a subset of documents
db.orders.createIndex(
  { customerId: 1 },
  { partialFilterExpression: { status: { $in: ['pending', 'processing'] } } }
)

// Sparse — only index documents where field exists
db.users.createIndex({ optionalField: 1 }, { sparse: true })
```

## ESR Rule for Compound Indexes

Field order: **E**quality → **S**ort → **R**ange

```js
// Query: find active users in age range, sorted by name
db.users.find({ status: "active", age: { $gte: 18, $lte: 65 } }).sort({ name: 1 })

// CORRECT index order: equality(status) → sort(name) → range(age)
db.users.createIndex({ status: 1, name: 1, age: 1 })

// WRONG — range before sort prevents index sort
db.users.createIndex({ status: 1, age: 1, name: 1 })
```

## explain() — Diagnose Query Plans

```js
// Full explain with execution stats
db.sessions.find({ userId: "abc" }).sort({ createdAt: -1 }).explain("executionStats")

// Key fields to check:
// winningPlan.stage:
//   "COLLSCAN" → no index used — BAD for large collections
//   "IXSCAN"   → index used — GOOD
//   "FETCH"    → fetch docs after index scan (normal)
//   "COVERED"  → all fields from index, no fetch — BEST

// executionStats:
//   totalDocsExamined — should be close to nReturned
//   totalKeysExamined — index keys scanned
//   executionTimeMillis — query time in ms

// Red flag: totalDocsExamined >> nReturned → missing or wrong index
```

## Covered Queries (fastest)

A covered query is served entirely from the index — no document fetch:

```js
// Index includes all projected fields
db.sessions.createIndex({ userId: 1, createdAt: -1 })

// Projection includes only indexed fields + _id suppressed
db.sessions
  .find({ userId: "abc" }, { userId: 1, createdAt: 1, _id: 0 })
  .explain() // stage: "COVERED_PROJECTION" — no FETCH
```

## Aggregation Pipeline Optimization

```js
// GOOD — $match and $sort early, use indexes before $group
db.sessions.aggregate([
  { $match: { userId: "abc" } },          // 1. filter first (uses index)
  { $sort:  { createdAt: -1 } },          // 2. sort (uses index)
  { $limit: 5 },                           // 3. limit before heavy ops
  { $project: { recommendations: 1 } }    // 4. project last
])

// BAD — $group before $match scans entire collection
db.sessions.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } },
  { $match: { _id: "abc" } }   // too late — $match can't use index
])

// $lookup optimization — add index on the joined field
db.sessions.createIndex({ userId: 1 })  // index the localField
db.sessions.aggregate([
  { $lookup: {
    from: "users", localField: "userId",
    foreignField: "_id", as: "user"
  }}
])
```

## Index Management

```js
// List all indexes
db.sessions.getIndexes()

// Index stats — check usage
db.sessions.aggregate([{ $indexStats: {} }])
// Look for accesses.ops === 0 → unused index (drop it)

// Hide before dropping (test impact with zero risk)
db.sessions.hideIndex("userId_1_createdAt_-1")
db.sessions.unhideIndex("userId_1_createdAt_-1")
db.sessions.dropIndex("userId_1_createdAt_-1")
```

## For This Project (movie-rec-engine)

Current indexes on `sessions`:
```js
// Already defined in mongodb.ts:
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })  // TTL ✓
SessionSchema.index({ userId: 1, createdAt: -1 })                  // history queries ✓
```

These cover all current query patterns:
- `find({ userId }).sort({ createdAt: -1 }).limit(5)` → IXSCAN on compound index ✓
- `deleteMany({ userId })` → IXSCAN on compound index ✓
- TTL auto-expiry → IXSCAN on expiresAt ✓
