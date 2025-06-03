import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// Validate database name is present in URI
if (!MONGODB_URI.includes("/test-database")) {
  console.warn("⚠️ Warning: Database name not specified in MONGODB_URI. Using default database.")
}

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongoose: GlobalMongoose | undefined
}

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached!.conn) {
    console.log("📦 Using cached database connection")
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    }

    console.log("🔌 Connecting to MongoDB...")
    cached!.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached!.conn = await cached!.promise
    console.log("✅ Successfully connected to MongoDB")
    console.log("📊 Database name:", mongoose.connection.db.databaseName)
  } catch (e) {
    console.error("❌ MongoDB connection error:", e)
    cached!.promise = null
    throw e
  }

  return cached!.conn
}
