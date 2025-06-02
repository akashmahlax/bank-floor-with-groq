import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { v2 as cloudinary } from "cloudinary"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Starting file upload process...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ No authentication found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ User authenticated:", session.user.email)

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    console.log("📁 Files received:", files.length)

    if (!files || files.length === 0) {
      console.log("❌ No files provided")
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      console.log(`📄 Processing file: ${file.name} (${file.size} bytes)`)

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.log(`❌ File too large: ${file.name}`)
        return NextResponse.json({ error: `File ${file.name} is too large (max 10MB)` }, { status: 400 })
      }

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Determine file type for proper categorization
        let fileType = "other"
        const mimeType = file.type || ""

        if (mimeType.startsWith("image/")) {
          fileType = "image"
        } else if (mimeType.startsWith("video/")) {
          fileType = "video"
        } else if (mimeType.startsWith("audio/")) {
          fileType = "audio"
        } else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("msword")) {
          fileType = "document"
        }

        console.log(`📋 File type determined: ${fileType} for ${file.name}`)

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "auto",
                folder: "blog-comments",
                public_id: `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              },
              (error, result) => {
                if (error) {
                  console.error(`❌ Cloudinary upload error for ${file.name}:`, error)
                  reject(error)
                } else {
                  console.log(`✅ Cloudinary upload success for ${file.name}:`, result?.secure_url)
                  resolve(result)
                }
              },
            )
            .end(buffer)
        })

        // Create the attachment object with the correct structure
        const attachment = {
          type: fileType,
          url: result.secure_url,
          publicId: result.public_id,
          filename: file.name,
          originalName: file.name,
          size: file.size,
          mimeType: mimeType,
          format: result.format,
          uploadedAt: new Date().toISOString(),
        }

        console.log(`✅ Attachment created:`, attachment)
        uploadedFiles.push(attachment)
      } catch (uploadError) {
        console.error(`❌ Error uploading file ${file.name}:`, uploadError)
        return NextResponse.json({ error: `Failed to upload ${file.name}` }, { status: 500 })
      }
    }

    console.log(`🎉 All files uploaded successfully: ${uploadedFiles.length} files`)
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("💥 File upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
