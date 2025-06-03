"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      // Only allow admin
      if (session?.user?.role !== "admin") {
        router.push("/")
      } else {
        fetchData()
      }
    }
  }, [status, session, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const usersRes = await fetch("/api/admin/users")
      const blogsRes = await fetch("/api/admin/blogs")
      const usersData = await usersRes.json()
      const blogsData = await blogsRes.json()
      setUsers(usersData.users || [])
      setBlogs(blogsData.blogs || [])
    } catch (e) {
      // handle error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    fetchData()
  }

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return
    await fetch(`/api/admin/blogs/${blogId}`, { method: "DELETE" })
    fetchData()
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="container-professional py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user._id} className="relative">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar?.url || "/placeholder.svg"} />
                  <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <Badge className="mt-1">{user.role}</Badge>
                </div>
                <Button variant="destructive" size="sm" className="ml-auto" onClick={() => handleDeleteUser(user._id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Blogs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Card key={blog._id} className="relative">
              <CardContent className="p-4">
                <div className="aspect-w-16 aspect-h-9 mb-3 bg-muted rounded overflow-hidden flex items-center justify-center">
                  {/* Blog featured image with fallback and error handling */}
                  <img
                    src={blog.featuredImage?.url || "/placeholder.svg"}
                    alt={blog.featuredImage?.alt || blog.title || "Blog image"}
                    className="object-cover w-full h-full"
                    onError={e => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                </div>
                <div className="font-semibold mb-1">{blog.title}</div>
                <div className="text-xs text-muted-foreground mb-2">{blog.author?.name || "Unknown"}</div>
                <Badge className="mb-2">{blog.status}</Badge>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/blog/view/${blog._id}`}>View</Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteBlog(blog._id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
