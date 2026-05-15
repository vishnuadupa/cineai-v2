import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var _mongoConn: typeof mongoose | null
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongoConn && mongoose.connection.readyState === 1) {
    return global._mongoConn
  }

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  global._mongoConn = await mongoose.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  })

  return global._mongoConn
}

// Session schema + model
const RecommendationSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  year:           { type: Number, required: true },
  genres:         [String],
  synopsis:       String,
  reasoning:      { type: String, required: true },
  tmdbId:         Number,
  posterPath:     String,
  rating:         Number,
  moodMatchScore: { type: Number, min: 0, max: 100 },
})

const SessionSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  input: {
    mood:          String,
    genres:        [String],
    recentWatches: [String],
    freeText:      { type: String, required: true },
  },
  recommendations: [RecommendationSchema],
})

// TTL index — MongoDB auto-deletes docs when expiresAt is reached
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
// Compound index for fast per-user history queries
SessionSchema.index({ userId: 1, createdAt: -1 })

export const Session =
  mongoose.models.Session ?? mongoose.model('Session', SessionSchema)

export type RecommendationDoc = mongoose.InferSchemaType<typeof RecommendationSchema>
export type SessionDoc        = mongoose.InferSchemaType<typeof SessionSchema>
