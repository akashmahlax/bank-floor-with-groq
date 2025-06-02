"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Eye, Heart, Share2, ArrowLeft, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

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
    avatar?: { url: string }
    bio?: string
  }
  featuredImage?: {
    url: string
    alt: string
  }
  publishedAt: string
  readingTime: number
  views: number
  likes: string[]
  commentsEnabled: boolean
  status: string
  slug: string
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlog()
  }, [params.slug])

  const fetchBlog = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/blogs/slug/${params.slug}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch blog")
      }

      setBlog(data.blog)
    } catch (error) {
      console.error("Failed to fetch blog:", error)
      setError(error instanceof Error ? error.message : "Failed to load blog")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    setIsLiked(!isLiked)
    // TODO: Implement like functionality with API
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites")
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
        // Fallback to copying URL
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success("Link copied to clipboard!")
        } catch (error) {
          toast.error("Failed to copy link")
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The blog post you're looking for doesn't exist or has been removed."}
            </p>
            <Link href="/blogs">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blogs">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blogs
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button onClick={handleLike} variant="outline" size="sm">
                <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                {blog.likes?.length || 0}
              </Button>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article>
            {/* Header */}
            <header className="mb-8">
              <Badge variant="secondary" className="mb-4 capitalize">
                {blog.category}
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">{blog.title}</h1>

              {blog.excerpt && <p className="text-xl text-muted-foreground leading-relaxed mb-6">{blog.excerpt}</p>}

              {/* Author and Meta */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={blog.author.avatar?.url || "/placeholder.svg"} alt={blog.author.name} />
                    <AvatarFallback>{blog.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{blog.author.name}</p>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(blog.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {blog.readingTime} min read
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {blog.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {blog.featuredImage && (
                <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
                  <Image
                    src={blog.featuredImage.url || "/placeholder.svg"}
                    alt={blog.featuredImage.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </header>

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 mb-8">
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer hover:bg-muted">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="mb-8" />

            {/* Author Bio */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={blog.author.avatar?.url || "/placeholder.svg"} alt={blog.author.name} />
                    <AvatarFallback>{blog.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About {blog.author.name}</h3>
                    <p className="text-muted-foreground">
                      {blog.author.bio ||
                        "Passionate writer and developer sharing insights about technology and web development."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-center">
              <Link href="/blogs">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to All Blogs
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
