---
name: mongodb-schema-design
description: >
  Design efficient MongoDB document schemas. Use when designing collections,
  choosing between embedding vs referencing documents, modeling relationships
  (one-to-one, one-to-many, many-to-many), handling schema evolution, applying
  design patterns (Bucket, Outlier, Computed, Extended Reference, Subset),
  or validating schemas with $jsonSchema. Triggers on: "design schema",
  "model data", "embed or reference", "normalize", "collection structure",
  "document model".
source:
  repository: mongodb/agent-skills
  ref: main
  path: skills/mongodb-schema-design
---

# MongoDB Schema Design

## Core Principle: Data That Is Accessed Together Should Be Stored Together

MongoDB is document-oriented. Design schemas around your application's query
patterns, not around avoiding data duplication.

## Embedding vs Referencing

### Embed when:
- Data is accessed together (avoids extra round trips)
- Child data has no independent existence (comments belong to a post)
- Array is bounded and won't grow without limit (< ~100 items)
- One-to-one or one-to-few relationships

```js
// GOOD — address always accessed with user
{ _id: ObjectId(), name: "Alice", address: { street: "123 Main", city: "NYC" } }
```

### Reference when:
- Data is accessed independently
- Array is unbounded or could grow large
- Many-to-many relationships
- Data is shared across many documents

```js
// GOOD — books accessed independently; authorId references author
{ _id: ObjectId("book1"), title: "Book 1", authorId: ObjectId("author1") }
```

## Relationship Patterns

### One-to-One → embed
```js
{ _id: ObjectId(), name: "Alice", passport: { number: "X123", expiry: ISODate() } }
```

### One-to-Few → embed array (< ~100 items)
```js
{ _id: ObjectId(), title: "Post", tags: ["mongodb", "nosql"] }
```

### One-to-Many → reference from the "many" side
```js
// orders collection — each order references a customer
{ _id: ObjectId(), customerId: ObjectId("c1"), total: 99.99 }
```

### Many-to-Many → reference array on the lighter side
```js
// student references courses (bounded); course doesn't embed all students
{ _id: ObjectId(), name: "Alice", courseIds: [ObjectId("cs101"), ObjectId("math1")] }
```

## Design Patterns

### Bucket Pattern — group time-series data
Instead of one doc per measurement (millions of docs), bucket by time window:
```js
{
  deviceId: "sensor-42",
  date: ISODate("2025-01-01"),
  readings: [ { t: ISODate("2025-01-01T00:00"), v: 22.5 }, ... ],  // up to 200
  count: 200,
  avg: 22.1
}
```

### Outlier Pattern — isolate large array documents
When a small subset of docs has arrays far larger than typical:
```js
// Typical book: 50 customers embedded. Bestseller: cap at 50 + set hasExtras: true
{ _id: ObjectId(), title: "Harry Potter", customers: [...50 items], hasExtras: true }
// Overflow in separate collection
{ bookId: ObjectId(), customers: [...next 1000 items] }
```

### Computed Pattern — pre-compute expensive aggregations
Store derived values alongside raw data; update on write:
```js
{ productId: ObjectId(), reviews: [...], avgRating: 4.7, reviewCount: 1243 }
```

### Extended Reference Pattern — denormalize frequently-joined fields
Embed a small, stable subset of referenced data to avoid $lookup:
```js
// Order embeds customer name + email (rarely changes) to avoid join
{ orderId: ObjectId(), customer: { id: ObjectId(), name: "Alice", email: "a@b.com" }, total: 99 }
```

### Subset Pattern — store hot data in main doc, cold in separate collection
```js
// Main: last 10 reviews (always shown). Separate: all reviews (rarely needed)
{ _id: ObjectId(), title: "Product", recentReviews: [...10], reviewCount: 5000 }
```

## Schema Validation
```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name:  { bsonType: "string", description: "required string" },
        email: { bsonType: "string", pattern: "^.+@.+$" },
        age:   { bsonType: "int", minimum: 0, maximum: 150 }
      }
    }
  },
  validationLevel: "moderate",   // "strict" = all writes; "moderate" = updates only
  validationAction: "error"      // "warn" = log only
})
```

## Anti-patterns to Avoid

- **Massive arrays** — unbounded arrays that grow without limit bloat documents and multikey indexes
- **Over-normalization** — splitting data across many collections when it's always accessed together
- **Monolithic documents** — embedding every possible related field into one document
- **Generic key-value schemas** — `{ key: "color", value: "red" }` prevents indexing on values
- **Sequential ObjectIds as shard keys** — causes write hotspots; use hashed shard keys

## For This Project (movie-rec-engine)

Current schema is well-designed:
- `sessions` collection embeds `recommendations` (always accessed together ✓)
- TTL index on `expiresAt` for auto-cleanup ✓
- Compound index `{ userId: 1, createdAt: -1 }` for history queries ✓
- Array bounded by Gemini returning exactly 5 recs ✓
