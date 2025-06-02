"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Eye, Heart, MessageCircle } from "lucide-react"
import Image from "next/image"

interface BlogData {
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  featuredImage: {
    url: string
    alt: string
  } | null
}

interface BlogPreviewProps {
  blogData: BlogData
}

export default function BlogPreview({ blogData }: BlogPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <article className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Header */}
        <header className="space-y-4">
          {blogData.category && (
            <Badge variant="outline" className="text-sm border-banking-gray-300 text-banking-primary">
              {blogData.category}
            </Badge>
          )}

          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-banking-gray-900">
            {blogData.title || "Your Story Title Will Appear Here"}
          </h1>

          {blogData.excerpt && <p className="text-lg text-banking-gray-600 leading-relaxed">{blogData.excerpt}</p>}

          {/* Author and Meta */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-banking-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-banking-accent/50">
                <AvatarImage src="/placeholder.svg?height=40&width=40&text=BP" alt="Author" />
                <AvatarFallback className="bg-banking-primary text-white">BP</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-banking-gray-900">Banking Professional</p>
                <div className="flex items-center space-x-3 text-sm text-banking-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />5 min read
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-banking-gray-500">
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />0
              </span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />0
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />0
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blogData.featuredImage?.url && (
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
            <Image
              src={blogData.featuredImage.url || "/placeholder.svg"}
              alt={blogData.featuredImage.alt}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-banking-secondary"
          dangerouslySetInnerHTML={{
            __html:
              blogData.content || '<p class="text-banking-gray-500 italic">Start writing your story content...</p>',
          }}
        />

        {/* Tags */}
        {blogData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 border-t border-banking-gray-200">
            {blogData.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-banking-accent border-banking-gray-300 text-banking-gray-700"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
