import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Blog from "@/lib/models/blog"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    console.log("🔍 Fetching blog with ID:", params.id)

    // Fetch blog with populated author information
    const blog = await Blog.findById(params.id).populate("author", "name email avatar bio createdAt").lean()

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    console.log("📝 Blog found:", {
      title: blog.title,
      author: blog.author,
      mediaFiles: blog.mediaFiles?.length || 0,
    })

    // Ensure author information is properly formatted
    if (!blog.author || typeof blog.author === "string") {
      blog.author = {
        _id: blog.author || "unknown",
        name: "Banking Professional",
        email: "professional@bank.com",
        avatar: { url: "/placeholder.svg?height=40&width=40&text=BP" },
        bio: "Experienced banking professional sharing insights",
      }
    }

    // Increment view count
    await Blog.findByIdAndUpdate(params.id, { $inc: { views: 1 } })

    return NextResponse.json({ blog })
  } catch (error) {
    console.error("Blog fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const blogData = await request.json()

    // Find the blog and check ownership
    const existingBlog = await Blog.findById(params.id).populate("author", "email")
    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    if (existingBlog.author.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized to edit this blog" }, { status: 403 })
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      params.id,
      {
        ...blogData,
        publishedAt: blogData.status === "published" ? new Date() : existingBlog.publishedAt,
      },
      { new: true },
    ).populate("author", "name email avatar bio")

    return NextResponse.json({ blog: updatedBlog })
  } catch (error) {
    console.error("Blog update error:", error)
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Find the blog and populate author information
    const blog = await Blog.findById(params.id).populate("author", "email")
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Check if the user is the author
    if (blog.author.email !== session.user.email) {
      return NextResponse.json({ error: "Not authorized to delete this blog" }, { status: 403 })
    }

    // Delete the blog
    await Blog.findByIdAndDelete(params.id)
    console.log("✅ Blog deleted successfully:", params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete blog error:", error)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
  }
}
