import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Blog from "@/lib/models/blog"

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const blogId = params.id
  if (!blogId) {
    return NextResponse.json({ error: "Blog ID required" }, { status: 400 })
  }
  await Blog.findByIdAndDelete(blogId)
  return NextResponse.json({ success: true })
}
