---
name: mongodb-natural-language-querying
description: >
  Translate natural language descriptions into MongoDB queries and aggregation
  pipelines. Use when writing find() queries, building $match/$group/$project
  stages, using query operators ($eq $gt $in $regex $exists), performing
  geospatial or text queries, or joining collections with $lookup. Triggers on:
  "find documents where", "query for", "aggregate", "group by", "count",
  "average", "pipeline", "filter collection".
source:
  repository: mongodb/agent-skills
  ref: main
  path: skills/mongodb-natural-language-querying
---

# MongoDB Natural Language Querying

## Query Operators Reference

```js
// Comparison
{ age: { $eq: 25 } }         // equal (same as { age: 25 })
{ age: { $ne: 25 } }         // not equal
{ age: { $gt: 18 } }         // greater than
{ age: { $gte: 18 } }        // greater than or equal
{ age: { $lt: 65 } }         // less than
{ age: { $lte: 65 } }        // less than or equal
{ status: { $in: ["active", "pending"] } }   // in array
{ status: { $nin: ["banned", "deleted"] } }  // not in array

// Logical
{ $and: [{ age: { $gt: 18 } }, { status: "active" }] }
{ $or:  [{ status: "active" }, { role: "admin" }] }
{ $not: { status: "active" } }

// Element
{ phone: { $exists: true } }   // field exists
{ phone: { $exists: false } }  // field does not exist
{ age: { $type: "int" } }      // BSON type check

// String / Regex
{ name: { $regex: /^alice/i } }
{ email: { $regex: "gmail\\.com$" } }

// Array
{ tags: "mongodb" }                          // array contains value
{ tags: { $all: ["mongodb", "nosql"] } }     // contains all values
{ tags: { $size: 3 } }                       // array has exactly 3 elements
{ "tags.0": "mongodb" }                      // first element equals
{ scores: { $elemMatch: { $gt: 80, $lt: 100 } } }  // element matches conditions
```

## Common Query Patterns

```js
// Find by userId, newest first, limit 5
db.sessions.find({ userId: "abc-123" }).sort({ createdAt: -1 }).limit(5)

// Find sessions from last 7 days
const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
db.sessions.find({ userId: "abc", createdAt: { $gte: since } })

// Find sessions containing a specific movie recommendation
db.sessions.find({ "recommendations.title": "Contact" })

// Project only specific fields (exclude _id)
db.sessions.find({ userId: "abc" }, { recommendations: 1, createdAt: 1, _id: 0 })

// Count documents
db.sessions.countDocuments({ userId: "abc" })

// Check if any sessions exist for user
db.sessions.findOne({ userId: "abc" }, { _id: 1 })
```

## Aggregation Pipelines

```js
// Count sessions per user
db.sessions.aggregate([
  { $group: { _id: "$userId", sessionCount: { $sum: 1 } } },
  { $sort: { sessionCount: -1 } }
])

// Get all recommended movie titles across a user's sessions (flattened)
db.sessions.aggregate([
  { $match: { userId: "abc-123" } },
  { $unwind: "$recommendations" },
  { $group: { _id: "$recommendations.title" } },
  { $sort: { _id: 1 } }
])

// Average mood match score per user
db.sessions.aggregate([
  { $unwind: "$recommendations" },
  { $group: {
    _id: "$userId",
    avgScore: { $avg: "$recommendations.moodMatchScore" }
  }},
  { $sort: { avgScore: -1 } }
])

// Most recommended genres across all sessions
db.sessions.aggregate([
  { $unwind: "$input.genres" },
  { $group: { _id: "$input.genres", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])

// $lookup — join sessions with users (future use when auth is added)
db.sessions.aggregate([
  { $lookup: {
    from:         "users",
    localField:   "userId",
    foreignField: "_id",
    as:           "user",
    pipeline: [{ $project: { name: 1, email: 1 } }]  // only fetch needed fields
  }},
  { $unwind: { path: "$user", preserveNullAndEmpty: true } }
])
```

## Update Patterns

```js
// Update specific session field
db.sessions.updateOne(
  { _id: ObjectId("...") },
  { $set: { "input.mood": "contemplative" } }
)

// Push to array (bounded — use with caution)
db.sessions.updateOne(
  { _id: ObjectId("...") },
  { $push: { recommendations: { $each: [newRec], $slice: -5 } } }
)

// Increment a counter
db.sessions.updateOne({ userId: "abc" }, { $inc: { viewCount: 1 } })

// Upsert — insert if not found, update if found
db.sessions.updateOne(
  { userId: "abc", date: "2025-01-01" },
  { $setOnInsert: { createdAt: new Date() }, $set: { lastSeen: new Date() } },
  { upsert: true }
)
```

## Delete Patterns

```js
// Delete one
db.sessions.deleteOne({ _id: ObjectId("...") })

// Delete all sessions for a user (history clear)
db.sessions.deleteMany({ userId: "abc-123" })

// Delete expired docs (TTL index handles this automatically in this project)
db.sessions.deleteMany({ expiresAt: { $lt: new Date() } })
```
