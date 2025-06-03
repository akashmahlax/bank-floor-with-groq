import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Blog from "@/lib/models/blog"
import User from "@/lib/models/user"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const blogData = await request.json()

    console.log("📝 Creating blog with data:", {
      title: blogData.title,
      mediaFilesCount: blogData.mediaFiles?.length || 0,
      featuredImage: blogData.featuredImage,
    })

    // Find the user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate required fields
    if (!blogData.title || !blogData.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Generate slug if not provided
    if (!blogData.slug) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    }

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug: blogData.slug })
    if (existingBlog) {
      // Add timestamp to make slug unique
      blogData.slug = `${blogData.slug}-${Date.now()}`
    }

    // Calculate reading time
    const wordsPerMinute = 200
    const wordCount = blogData.content.replace(/<[^>]*>/g, "").split(/\s+/).length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)

    // Process media files - ensure they're properly formatted
    const processedMediaFiles = (blogData.mediaFiles || []).map((file: any) => ({
      url: file.url,
      publicId: file.publicId || "",
      name: file.name,
      type: file.type,
      size: file.size || 0,
      format: file.format || file.name.split(".").pop(),
      alt: file.alt || file.name,
    }))

    // Set featured image from media files if not explicitly set
    let featuredImage = blogData.featuredImage
    if (!featuredImage && processedMediaFiles.length > 0) {
      const firstImage = processedMediaFiles.find((file: any) => file.type.startsWith("image/"))
      if (firstImage) {
        featuredImage = {
          url: firstImage.url,
          alt: firstImage.alt || firstImage.name,
          publicId: firstImage.publicId,
        }
      }
    }

    console.log("🖼️ Featured image set:", featuredImage)

    // Create new blog with proper author reference
    const blog = new Blog({
      ...blogData,
      author: user._id,
      mediaFiles: processedMediaFiles,
      featuredImage,
      readingTime,
      publishedAt: blogData.status === "published" ? new Date() : undefined,
    })

    await blog.save()

    // Populate author information before returning
    await blog.populate("author", "name email avatar bio")

    console.log("✅ Blog created successfully:", {
      id: blog._id,
      title: blog.title,
      author: blog.author.name,
      mediaFilesCount: blog.mediaFiles?.length || 0,
      featuredImage: blog.featuredImage?.url,
    })

    return NextResponse.json({
      success: true,
      blog: {
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
        publishedAt: blog.publishedAt,
        mediaFiles: blog.mediaFiles,
        featuredImage: blog.featuredImage,
        author: blog.author,
      },
    })
  } catch (error) {
    console.error("Blog creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Fetch all published blogs with author information
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "name email avatar bio createdAt")
      .select("title excerpt category status publishedAt views likes featuredImage readingTime slug tags comments")
      .sort({ publishedAt: -1 })
      .lean()

    // Ensure author information and featuredImage are properly formatted
    const formattedBlogs = blogs.map((blog) => {
      // Ensure featuredImage is properly formatted
      if (!blog.featuredImage || typeof blog.featuredImage !== "object") {
        blog.featuredImage = {
          url: "/placeholder.svg",
          alt: blog.title,
        }
      }

      // Ensure tags array exists
      if (!blog.tags) {
        blog.tags = []
      }

      // Ensure comments array exists
      if (!blog.comments) {
        blog.comments = []
      }

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
      return blog
    })

    return NextResponse.json({ blogs: formattedBlogs })
  } catch (error) {
    console.error("Blogs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 })
  }
}
