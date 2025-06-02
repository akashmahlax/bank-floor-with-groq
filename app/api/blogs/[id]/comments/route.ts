import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Change to handle FormData
    const formData = await request.formData();
    const content = formData.get('content') as string | null;
    const files = formData.getAll('attachments') as File[];

    if (!content?.trim() && files.length === 0) {
      return NextResponse.json({ error: "Comment content or attachment is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const blogId = params.id

    // Verify blog exists
    const blog = await db.collection("blogs").findOne({ _id: new ObjectId(blogId) })
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // --- File Upload Handling (Placeholder) ---
    // This is where you would typically upload files to a storage service (e.g., Cloudinary, S3)
    // and get their URLs. For this example, we'll just create placeholder file objects.

    const uploadedFiles: { url: string; name: string; type: string; size: number }[] = [];

    for (const file of files) {
        // In a real application, upload 'file' and get its URL and publicId
        // Example placeholder:
        uploadedFiles.push({
            url: `YOUR_UPLOAD_URL/${file.name}`, // Replace with actual uploaded file URL
            name: file.name,
            type: file.type,
            size: file.size,
        });
        // You might also get a publicId from your upload service here if needed for deletion later
        // publicId: uploadResult.publicId,
    }

    // --- End File Upload Handling ---

    const comment = {
      _id: new ObjectId(),
      content: content || "", // Ensure content is a string even if null
      author: {
        _id: new ObjectId(session.user.id),
        name: session.user.name,
        avatar: session.user.avatar,
      },
      createdAt: new Date().toISOString(),
      attachments: uploadedFiles, // Add uploaded files to the comment
    }

    await db.collection("blogs").updateOne(
      { _id: new ObjectId(blogId) },
      { $push: { comments: comment } }
    )

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const blogId = params.id

    const blog = await db.collection("blogs").findOne(
      { _id: new ObjectId(blogId) },
      { projection: { comments: 1 } }
    )

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Ensure attachments are included in the fetched comments
    const commentsWithAttachments = blog.comments.map((comment: any) => ({
        ...comment,
        attachments: comment.attachments || [] // Ensure attachments is always an array
    }));

    return NextResponse.json({ comments: commentsWithAttachments || [] })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
} 