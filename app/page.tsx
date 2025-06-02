"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/icons"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes" // For theme toggle

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  category: string
  author: {
    _id: string
    name: string
    avatar?: { url: string }
  }
  publishedAt: string
  readingTime: number
  views: number
  featuredImage?: {
    url: string
    alt: string
  }
}

export default function HomePage() {
  const { data: session } = useSession()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme() // For theme toggle
  const [mounted, setMounted] = useState(false)

  // Ensure theme toggle works after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("/api/blogs")
        const data = await response.json()
        if (response.ok) {
          // Get only the latest 6 blogs
          setBlogs(data.blogs.slice(0, 6))
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const categoryItems = [
    {
      title: "Share Your Expertise",
      description: "Contribute insights and experiences from your banking career journey.",
      icon: <Icons.pen className="h-5 w-5 text-primary" />,
      imgSrc: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    },
    {
      title: "Professional Network",
      description: "Connect with banking leaders and industry experts worldwide.",
      icon: <Icons.users className="h-5 w-5 text-primary" />,
      imgSrc: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    },
    {
      title: "Industry Insights",
      description: "Stay informed with the latest banking trends and best practices.",
      icon: <Icons.trendingUp className="h-5 w-5 text-primary" />,
      imgSrc: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header to match screenshot */}
      {/*<header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-professional">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-base">BF</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">Bank's Floor</h1>
                <p className="text-xs text-muted-foreground">Professional Banking Network</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="text-sm font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground" // Active class
              >
                Home
              </Link>
              <Link
                href="/blogs"
                className="text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
              >
                Insights
              </Link>
              <Link
                href="/create-blog"
                className="text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
              >
                Contribute
              </Link>
            </nav>

            <div className="flex items-center space-x-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Icons.sun className="h-5 w-5" /> : <Icons.moon className="h-5 w-5" />}
                </Button>
              )}
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground px-3">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="btn-primary-professional">
                  Join Network
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>/*}

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container-professional relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Share Your Stories with the World
            </h1>
            <p className="text-xl text-muted-foreground">
              Join our community of writers and readers. Share your experiences, insights, and knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Button asChild size="lg">
                  <Link href="/create-blog">
                    <Icons.plus className="mr-2 h-5 w-5" />
                    Write a Story
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/blogs">Browse Stories</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background to-background" />
      </section>

      {/* Latest Insights Section */}
      <section className="py-16 md:py-24">
        <div className="container-professional">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest Insights</h2>
              <p className="text-muted-foreground mt-2">
                Discover the most recent stories from our community
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/blogs">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 w-24 bg-secondary rounded" />
                      <div className="h-6 w-3/4 bg-secondary rounded" />
                      <div className="h-4 w-full bg-secondary rounded" />
                      <div className="h-4 w-2/3 bg-secondary rounded" />
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-secondary" />
                        <div className="h-4 w-24 bg-secondary rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={blog.author.avatar?.url} alt={blog.author.name} />
                            <AvatarFallback>{getInitials(blog.author.name)}</AvatarFallback>
                          </Avatar>
                          <span>{blog.author.name}</span>
                        </div>
                        <span>{blog.readingTime} min read</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(blog.publishedAt)}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog/view/${blog._id}`}>
                            Read More
                            <Icons.arrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Explore Categories</h2>
            <p className="text-muted-foreground mt-2">
              Find stories that match your interests
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Technology", "Design", "Business", "Lifestyle"].map((category) => (
              <Card key={category} className="group hover-lift-professional">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Explore the latest stories in {category.toLowerCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container-professional">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-bold">Start Writing Today</h2>
                <p className="text-primary-foreground/80">
                  Join our community of writers and share your stories with the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {session ? (
                    <Button variant="secondary" size="lg" asChild>
                      <Link href="/create-blog">
                        <Icons.plus className="mr-2 h-5 w-5" />
                        Write a Story
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" asChild>
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="bg-transparent" asChild>
                    <Link href="/blogs">Browse Stories</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer to match screenshot's simplicity */}
      <footer className="border-t border-border bg-card">
        <div className="container-professional py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <div className="h-7 w-7 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-xs">BF</span>
              </div>
              <span className="text-sm font-medium text-foreground">Bank's Floor</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Bank's Floor. Professional Banking Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
