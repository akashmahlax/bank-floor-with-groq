"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
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
                        <Icons.edit className="h-4 w-4 mr-2" />
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
                    <Icons.calendar className="h-4 w-4 mr-1" />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <Icons.fileText className="h-4 w-4 mr-1" />
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
                                <Icons.eye className="h-4 w-4 mr-1" />
                                {blog.views}
                              </span>
                              <span className="flex items-center">
                                <Icons.heart className="h-4 w-4 mr-1" />
                                {blog.likes.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link href={`/blog/view/${blog._id}`}>
                                <Icons.eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link href={`/blog/edit/${blog._id}`}>
                                <Icons.edit className="h-4 w-4 mr-2" />
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
                    <Icons.plus className="h-4 w-4 mr-2" />
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
                                <Icons.edit className="h-4 w-4 mr-2" />
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
                    <Icons.plus className="h-4 w-4 mr-2" />
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
                  <Icons.search className="h-4 w-4 mr-2" />
                  Browse Stories
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
