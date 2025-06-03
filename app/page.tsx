"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>,
      imgSrc: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    },
    {
      title: "Professional Network",
      description: "Connect with banking leaders and industry experts worldwide.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      imgSrc: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    },
    {
      title: "Industry Insights",
      description: "Stay informed with the latest banking trends and best practices.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
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
                  {theme === "dark" ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
                  <CardContent className="p-0">
                    {/* Featured Image */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={blog.featuredImage?.url || "/placeholder.svg"}
                        alt={blog.featuredImage?.alt || blog.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
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
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              {blog.readingTime} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              {blog.views}
                            </span>
                          </div>
                        </div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
