"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  ArrowLeft,
  Tag,
  Edit,
  FileText,
  ImageIcon,
  Trash2,
  File,
  MoreVertical,
  Users,
  Bookmark,
  MessageCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import CommentSystem from "@/components/blog/comment-system"

interface BlogPost {
  _id: string
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  author: {
    _id: string
    name: string
    email?: string
    avatar?: { url: string }
    bio?: string
    createdAt?: string
  }
  featuredImage?: {
    url: string
    alt: string
    publicId?: string
  }
  publishedAt: string
  readingTime: number
  views: number
  likes: string[]
  commentsEnabled: boolean
  status: string
  slug: string
  mediaFiles?: Array<{
    url: string
    name: string
    type: string
    size: number
  }>
}

export default function BlogViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canDelete, setCanDelete] = useState(false)

  useEffect(() => {
    fetchBlog()
  }, []) // We can remove the dependency since resolvedParams won't change

  useEffect(() => {
    if (blog && session?.user?.email) {
      const isAuthor = blog.author.email === session.user.email
      setCanDelete(isAuthor)
      setIsLiked(blog.likes?.includes(session.user.email) || false)
    }
  }, [blog, session])

  const fetchBlog = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/blogs/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch story`)
      }

      if (!data.blog) {
        throw new Error("No story data received")
      }

      console.log("📖 Blog data received:", data.blog)
      setBlog(data.blog)
    } catch (error) {
      console.error("Failed to fetch story:", error)
      setError(error instanceof Error ? error.message : "Failed to load story")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!session?.user?.email) {
      toast.error("Please sign in to like stories")
      return
    }

    setIsLiked(!isLiked)
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites")
  }

  const handleBookmark = async () => {
    if (!session?.user?.email) {
      toast.error("Please sign in to bookmark stories")
      return
    }

    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
  }

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: blog?.title,
            text: blog?.excerpt,
            url: window.location.href,
          })
        } catch (error) {
          console.log("Error sharing:", error)
        }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success("Link copied to clipboard!")
        } catch (error) {
          toast.error("Failed to copy link")
        }
      }
    }
  }

  const handleDeleteBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Story deleted successfully")
        router.push("/profile")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete story")
      }
    } catch (error) {
      console.error("Error deleting story:", error)
      toast.error("Failed to delete story")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (!type) return <File className="h-4 w-4 text-gray-500" />
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-600" />
    if (type.startsWith("video/")) return <FileText className="h-4 w-4 text-purple-600" />
    if (type.startsWith("audio/")) return <FileText className="h-4 w-4 text-green-600" />
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  const getAuthorInitials = (name: string) => {
    if (!name) return "BP"
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(dateString)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="w-24 h-6 bg-gray-200 rounded"></div>
              <div className="w-full h-8 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                <div className="w-4/6 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-gray-900">Story Not Found</h1>
            <p className="text-gray-600 mb-6 text-sm">{error || "The story you're looking for doesn't exist."}</p>
            <div className="space-y-3">
              <Link href="/blogs">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Stories
                </Button>
              </Link>
              <Link href="/create-blog">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Share Your Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-professional">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/blogs">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Back to Blogs</span>
                </Button>
              </Link>
              {blog.status === "published" && (
                <Badge className="bg-primary/10 text-primary">Published</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`} />
                <span className="ml-1 text-xs">{blog.likes?.length || 0}</span>
              </Button>

              <Button
                onClick={handleBookmark}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
              </Button>

              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-professional py-8">
        <article className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="relative aspect-video sm:aspect-[2/1] rounded-xl overflow-hidden mb-8">
              <Image
                src={blog.featuredImage.url || "/placeholder.svg"}
                alt={blog.featuredImage.alt || blog.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {/* Article Content */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div>
              <Badge className="blog-card-badge">{blog.category}</Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              {blog.title}
            </h1>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed border-l-4 border-primary/20 pl-4 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Author Info */}
            <div className="flex items-center justify-between py-6 border-y border-border">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage
                    src={blog.author?.avatar?.url || "/placeholder.svg"}
                    alt={blog.author?.name || "Banking Professional"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {getAuthorInitials(blog.author?.name || "Banking Professional")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{blog.author?.name || "Banking Professional"}</p>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatRelativeTime(blog.publishedAt)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {blog.readingTime} min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {blog.views.toLocaleString()}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {blog.commentsEnabled ? "Comments on" : "Comments off"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary">
              <div
                dangerouslySetInnerHTML={{ __html: blog.content }}
                className="blog-content text-foreground leading-relaxed"
              />
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 py-6 border-t border-border">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer hover:bg-secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Author Bio */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={blog.author.avatar?.url || "/placeholder.svg"} alt={blog.author.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getAuthorInitials(blog.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About {blog.author.name}</h3>
                    <p className="text-muted-foreground">
                      {blog.author.bio || "Passionate banking professional sharing insights and experiences."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </article>

        {/* Comments Section */}
        {blog && (
          <div className="max-w-4xl mx-auto mt-8">
            <CommentSystem blogId={blog._id} commentsEnabled={blog.commentsEnabled} />
          </div>
        )}
      </main>
    </div>
  )
}
