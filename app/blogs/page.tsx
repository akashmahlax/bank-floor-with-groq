"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Eye, Heart, MessageCircle, PenTool, ArrowLeft, Filter, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  featuredImage?: {
    url: string
    alt: string
  }
  author: {
    _id: string
    name: string
    email?: string
    avatar?: { url: string }
  }
  publishedAt: string
  readingTime: number
  views: number
  likes: string[]
  comments: any[]
  status: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["all"])
  const [showFilters, setShowFilters] = useState(false)

  // Banking-specific categories
  const bankingCategories = [
    "all",
    "customer service",
    "stress management",
    "career growth",
    "workplace culture",
    "compliance",
    "leadership",
    "work-life balance",
    "team dynamics",
    "professional development",
  ]

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    filterBlogs()
  }, [searchTerm, selectedCategory, blogs])

  const fetchBlogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/blogs")
      const data = await response.json()

      if (response.ok) {
        const publishedBlogs = data.blogs.filter((blog: BlogPost) => blog.status === "published")
        setBlogs(publishedBlogs)

        const uniqueCategories = [
          "all",
          ...new Set(publishedBlogs.map((blog: BlogPost) => blog.category.toLowerCase())),
        ]
        setCategories(uniqueCategories)
      } else {
        toast.error("Failed to fetch stories")
      }
    } catch (error) {
      console.error("Error fetching blogs:", error)
      toast.error("Failed to load stories")
    } finally {
      setIsLoading(false)
    }
  }

  const filterBlogs = () => {
    let filtered = blogs

    if (searchTerm) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.author.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((blog) => blog.category.toLowerCase() === selectedCategory)
    }

    setFilteredBlogs(filtered)
  }

  const getAuthorInitials = (name: string) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-gray-200">
                <div className="aspect-video bg-gray-200"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-professional py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">Banking Insights</h1>
          <p className="text-lg text-muted-foreground">Discover stories and experiences from banking professionals</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {bankingCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "border-border hover:bg-secondary"
                    }
                  >
                    {category === "all" ? "All Topics" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
              {selectedCategory !== "all" && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("all")} className="text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Blog Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <Link href={`/blog/view/${blog._id}`} key={blog._id} className="block group">
                <Card className="blog-card hover-lift-professional">
                  <div className="blog-card-image">
                    <Image
                      src={blog.featuredImage?.url || "/placeholder.svg"}
                      alt={blog.featuredImage?.alt || blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="blog-card-badge">{blog.category}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-background/90 text-foreground text-xs">
                        {blog.readingTime} min
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="blog-card-title group-hover:text-primary transition-colors">{blog.title}</h3>
                    <p className="blog-card-excerpt">{blog.excerpt}</p>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {blog.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Author and Stats */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={blog.author.avatar?.url} alt={blog.author.name} />
                          <AvatarFallback>{getAuthorInitials(blog.author.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{blog.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {blog.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {blog.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {blog.comments?.length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">No stories found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
