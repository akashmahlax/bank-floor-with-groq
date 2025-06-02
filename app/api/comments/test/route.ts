import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    console.log("🔍 Testing comment system setup...")

    // Test 1: Check session
    const session = await getServerSession(authOptions)
    console.log("Session test:", session ? "✅ PASS" : "❌ FAIL")

    // Test 2: Check database connection
    await connectToDatabase()
    console.log("Database test: ✅ PASS")

    // Test 3: Check models
    const User = (await import("@/lib/models/user")).default
    const Comment = (await import("@/lib/models/comment")).default
    const Blog = (await import("@/lib/models/blog")).default

    console.log("Models test: ✅ PASS")

    return NextResponse.json({
      success: true,
      tests: {
        session: !!session,
        database: true,
        models: true,
        userEmail: session?.user?.email || null,
      },
    })
  } catch (error) {
    console.error("Test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
