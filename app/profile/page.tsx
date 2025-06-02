"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar, Eye, Heart, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: {
    url: string
  }
  bio?: string
  role: string
  createdAt: string
  blogs: Array<{
    _id: string
    title: string
    excerpt: string
    category: string
    status: string
    publishedAt: string
    views: number
    likes: string[]
  }>
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile")
      }

      setProfile(data.profile)
    } catch (error) {
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBlog = async (blogId: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete blog")
      }

      toast.success("Blog post deleted successfully")
      fetchProfile() // Refresh profile to update the blog list
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete blog")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-professional py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-secondary" />
              <div className="space-y-2">
                <div className="h-4 w-48 bg-secondary rounded" />
                <div className="h-3 w-32 bg-secondary rounded" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-professional py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar?.url} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                      <p className="text-muted-foreground">{profile.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {profile.role}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/profile/edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          Edit Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      Joined {formatDate(profile.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      {profile.blogs.length} stories
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="stories" className="space-y-6">
            <TabsList>
              <TabsTrigger value="stories">My Stories</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="space-y-6">
              {profile.blogs.filter(blog => blog.status === "published").length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {profile.blogs
                    .filter(blog => blog.status === "published")
                    .map((blog) => (
                      <Card key={blog._id} className="group hover-lift-professional">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Badge className="blog-card-badge">{blog.category}</Badge>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {blog.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{formatDate(blog.publishedAt)}</span>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                  {blog.views}
                                </span>
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                  {blog.likes.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/blog/view/${blog._id}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                  View
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/blog/edit/${blog._id}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-foreground mb-2">No published stories yet</h3>
                  <p className="text-muted-foreground mb-4">Start sharing your experiences with the community</p>
                  <Button asChild>
                    <Link href="/create-blog">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Create Story
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-6">
              {profile.blogs.filter(blog => blog.status === "draft").length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {profile.blogs
                    .filter(blog => blog.status === "draft")
                    .map((blog) => (
                      <Card key={blog._id} className="group hover-lift-professional">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Badge variant="outline" className="border-yellow-500/20 text-yellow-500">
                                Draft
                              </Badge>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {blog.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/blog/edit/${blog._id}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Continue Editing
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-foreground mb-2">No drafts</h3>
                  <p className="text-muted-foreground mb-4">Start writing your next story</p>
                  <Button asChild>
                    <Link href="/create-blog">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Create Story
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">No saved stories</h3>
                <p className="text-muted-foreground mb-4">Save stories you want to read later</p>
                <Button asChild>
                  <Link href="/blogs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="12" x2="12" y2="19"></line></svg>
                    Browse Stories
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Blog List */}
          <div className="mt-8 space-y-6">
            {profile?.blogs.map((blog) => (
              <Card key={blog._id} className="overflow-hidden bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                          {blog.category}
                        </Badge>
                        <Badge variant={blog.status === "published" ? "default" : "secondary"} className="capitalize">
                          {blog.status}
                        </Badge>
                      </div>
                      
                      <Link href={`/blog/view/${blog._id}`} className="block group">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {blog.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {blog.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(blog.publishedAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {blog.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {blog.likes.length} likes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-gray-200 hover:border-blue-500 dark:border-gray-800"
                      >
                        <Link href={`/blog/edit/${blog._id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:border-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Blog Post</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                              Are you sure you want to delete &quot;{blog.title}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBlog(blog._id)}
                              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 focus:ring-red-500"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {profile?.blogs.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No blog posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Start sharing your thoughts and experiences with the community.</p>
                <Button asChild>
                  <Link href="/create-blog">
                    Create Your First Blog
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
