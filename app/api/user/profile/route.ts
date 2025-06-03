import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/user"
import Blog from "@/lib/models/blog"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("🔍 Connecting to database...")
    await connectToDatabase()
    console.log("✅ Connected to database successfully")

    // Find the user
    console.log("🔍 Finding user with email:", session.user.email)
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    console.log("✅ User found:", { id: user._id, name: user.name })

    // Find all blogs by this user
    console.log("🔍 Finding blogs for user:", user._id)
    const blogs = await Blog.find({ author: user._id })
      .populate("author", "name email avatar bio createdAt")
      .select("title excerpt category status publishedAt views likes featuredImage readingTime slug")
      .sort({ createdAt: -1 })
      .lean()

    console.log(`✅ Found ${blogs.length} blogs`)

    // Ensure author and featuredImage are always present and formatted
    const formattedBlogs = blogs.map((blog) => {
      // Defensive: always ensure featuredImage is a valid object with url and alt
      if (
        !blog.featuredImage ||
        typeof blog.featuredImage !== "object" ||
        !blog.featuredImage.url
      ) {
        console.log(`⚠️ Blog "${blog.title}" has invalid featuredImage, using placeholder`)
        blog.featuredImage = { url: "/placeholder.svg", alt: blog.title }
      } else {
        if (!blog.featuredImage.alt) {
          blog.featuredImage.alt = blog.title
        }
      }
      if (!blog.author || typeof blog.author === "string") {
        console.log(`⚠️ Blog "${blog.title}" has invalid author, using user data`)
        blog.author = {
          _id: blog.author || "unknown",
          name: user.name,
          email: user.email,
          avatar: user.avatar || { url: "/placeholder.svg" },
          bio: user.bio || "",
        }
      }
      return blog
    })

    // Debug: Log featuredImage URLs
    formattedBlogs.forEach((blog) => {
      console.log(`[PROFILE API] Blog: ${blog.title} | featuredImage:`, blog.featuredImage)
    })

    // Format the profile data
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      blogs: formattedBlogs,
    }

    console.log("✅ Profile data formatted successfully")
    return NextResponse.json({ profile })
  } catch (error) {
    console.error("❌ Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
