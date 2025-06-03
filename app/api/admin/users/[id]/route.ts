import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/user"

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = params.id
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }
  await User.findByIdAndDelete(userId)
  return NextResponse.json({ success: true })
}
