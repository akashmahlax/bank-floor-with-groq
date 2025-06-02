import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Comment from "@/lib/models/comment"
import Blog from "@/lib/models/blog"
import User from "@/lib/models/user"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    console.log("💬 Starting comment creation process...")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("❌ No valid session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found for user:", session.user.email)

    await connectToDatabase()
    console.log("✅ Database connected")

    const { blogId, content, attachments, parentCommentId } = await request.json()
    console.log("📝 Comment data received:", {
      blogId,
      contentLength: content?.length,
      attachmentsCount: attachments?.length || 0,
      parentCommentId,
    })

    // Find the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ User found:", user.name)

    // Verify blog exists
    const blog = await Blog.findById(blogId)
    if (!blog) {
      console.log("❌ Blog not found")
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    console.log("✅ Blog found:", blog.title)

    // Create comment
    const commentData = {
      content,
      author: user._id,
      blog: blogId,
      attachments: attachments || [],
      parentComment: parentCommentId || null,
    }

    console.log("💾 Creating comment with data:", commentData)

    const comment = new Comment(commentData)
    await comment.save()

    console.log("✅ Comment saved with ID:", comment._id)

    // Populate author information
    await comment.populate("author", "name email avatar")
    console.log("✅ Comment populated with author info")

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error("💥 Comment creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const blogId = searchParams.get("blogId")

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID is required" }, { status: 400 })
    }

    // Fetch comments with populated author information
    const comments = await Comment.find({
      blog: blogId,
      parentComment: null, // Only top-level comments
    })
      .populate("author", "name email avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name email avatar",
        },
      })
      .sort({ createdAt: -1 })
      .lean()

    // Ensure author information is properly formatted
    const formattedComments = comments.map((comment) => {
      if (!comment.author || typeof comment.author === "string") {
        comment.author = {
          _id: comment.author || "unknown",
          name: "Banking Professional",
          avatar: { url: "/placeholder.svg?height=40&width=40&text=BP" },
        }
      }

      // Format replies as well
      if (comment.replies) {
        comment.replies = comment.replies.map((reply: any) => {
          if (!reply.author || typeof reply.author === "string") {
            reply.author = {
              _id: reply.author || "unknown",
              name: "Banking Professional",
              avatar: { url: "/placeholder.svg?height=40&width=40&text=BP" },
            }
          }
          return reply
        })
      }

      return comment
    })

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error("Comments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
