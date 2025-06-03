import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Blog from "@/lib/models/blog"
import User from "@/lib/models/user"

export async function GET() {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const blogs = await Blog.find()
    .populate("author", "name email avatar")
    .select("_id title status author")
    .lean()
  return NextResponse.json({ blogs })
}

export async function DELETE(request: Request) {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const blogId = searchParams.get("id")
  if (!blogId) {
    return NextResponse.json({ error: "Blog ID required" }, { status: 400 })
  }
  await Blog.findByIdAndDelete(blogId)
  return NextResponse.json({ success: true })
}
