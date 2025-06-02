"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Eye,
  Send,
  Clock,
  Tag,
  Globe,
  Lock,
  Users,
  ArrowLeft,
  X,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle,
  FileText,
  Heart,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Dynamic imports for components that use browser APIs
const RichTextEditor = dynamic(() => import("@/components/blog/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p>Loading editor...</p>
    </div>
  ),
})

const MediaUploader = dynamic(() => import("@/components/blog/media-uploader"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
      <p className="text-sm">Loading media uploader...</p>
    </div>
  ),
})

const BlogPreview = dynamic(() => import("@/components/blog/blog-preview"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p>Loading preview...</p>
    </div>
  ),
})

const GroqAIAssistant = dynamic(() => import("@/components/blog/groq-ai-assistant"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
      <p className="text-sm">Loading AI assistant...</p>
    </div>
  ),
})

interface MediaFile {
  url: string
  publicId: string
  alt: string
  name: string
  type: string
  size: number
  format?: string
}

interface BlogData {
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  mediaFiles: MediaFile[]
  featuredImage?: {
    url: string
    alt: string
    publicId?: string
  } | null
  status: "draft" | "published"
  visibility: "public" | "private" | "friends"
  commentsEnabled: boolean
  language: string
  author: string
}

// Banking-specific categories
const bankingCategories = [
  "Customer Service",
  "Stress Management",
  "Career Growth",
  "Workplace Culture",
  "Compliance",
  "Leadership",
  "Work-Life Balance",
  "Team Dynamics",
  "Professional Development",
  "Banking Operations",
  "Client Relations",
  "Performance Pressure",
]

export default function CreateBlogPage() {
  const router = useRouter()
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [newTag, setNewTag] = useState("")
  const [showAI, setShowAI] = useState(false)
  const [savedBlogId, setSavedBlogId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const [blogData, setBlogData] = useState<BlogData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    mediaFiles: [],
    featuredImage: null,
    status: "draft",
    visibility: "public",
    commentsEnabled: true,
    language: "en",
    author: "675a1234567890abcdef1234", // Mock user ID - replace with actual user ID
  })

  // Set client-side flag
  useEffect(() => {
    setIsClient(true)

    // Load saved draft only on client side
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem("blog-draft")
        const savedId = localStorage.getItem("blog-draft-id")

        if (savedDraft) {
          const draftData = JSON.parse(savedDraft)
          setBlogData(draftData)
          if (savedId) {
            setSavedBlogId(savedId)
          }
          toast.info("Draft loaded from previous session")
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }

    loadDraft()
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (blogData.title) {
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setBlogData((prev) => ({ ...prev, slug }))
    }
  }, [blogData.title])

  // Calculate word count and reading time
  useEffect(() => {
    const text = blogData.content.replace(/<[^>]*>/g, "")
    const words = text.split(/\s+/).filter((word) => word.length > 0)
    const count = words.length
    const time = Math.ceil(count / 200)
    setWordCount(count)
    setReadingTime(time)
  }, [blogData.content])

  // Auto-save functionality
  useEffect(() => {
    if (!isClient) return

    const autoSaveInterval = setInterval(() => {
      if (blogData.title || blogData.content) {
        handleAutoSave()
      }
    }, 60000) // Auto-save every minute

    return () => clearInterval(autoSaveInterval)
  }, [blogData, isClient])

  const handleAutoSave = async () => {
    if (!isClient) return

    try {
      const draftData = {
        ...blogData,
        status: "draft",
        autoSavedAt: new Date().toISOString(),
      }
      localStorage.setItem("blog-draft", JSON.stringify(draftData))
    } catch (error) {
      console.error("Auto-save error:", error)
    }
  }

  const handleSaveDraft = async () => {
    if (!blogData.title.trim()) {
      toast.error("Please enter a title before saving")
      return
    }

    setIsSaving(true)
    try {
      const draftData = {
        ...blogData,
        status: "draft",
      }

      console.log("Saving draft with media files:", {
        mediaFilesCount: draftData.mediaFiles.length,
        mediaFiles: draftData.mediaFiles,
      })

      let response
      if (savedBlogId) {
        // Update existing draft
        response = await fetch(`/api/blogs/${savedBlogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        })
      } else {
        // Create new draft
        response = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save draft")
      }

      if (!savedBlogId) {
        setSavedBlogId(data.blog._id)
        if (isClient) {
          localStorage.setItem("blog-draft-id", data.blog._id)
        }
      }

      if (isClient) {
        localStorage.setItem("blog-draft", JSON.stringify(draftData))
      }

      toast.success("Draft saved successfully!")
    } catch (error) {
      console.error("Save error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!blogData.title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!blogData.content.trim()) {
      toast.error("Please add some content")
      return
    }

    if (!blogData.category) {
      toast.error("Please select a category")
      return
    }

    setIsPublishing(true)
    try {
      const publishedData = {
        ...blogData,
        status: "published",
      }

      console.log("Publishing story with media files:", {
        title: publishedData.title,
        mediaFilesCount: publishedData.mediaFiles.length,
        mediaFiles: publishedData.mediaFiles,
      })

      let response
      if (savedBlogId) {
        // Update existing blog to published
        response = await fetch(`/api/blogs/${savedBlogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publishedData),
        })
      } else {
        // Create new published blog
        response = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publishedData),
        })
      }

      console.log("Publish response status:", response.status)
      const data = await response.json()
      console.log("Publish response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish story")
      }

      if (!data.blog || !data.blog._id) {
        throw new Error("Invalid response: missing blog ID")
      }

      // Clear draft from localStorage
      if (isClient) {
        localStorage.removeItem("blog-draft")
        localStorage.removeItem("blog-draft-id")
      }

      toast.success("🎉 Your story has been shared!")

      // Immediate redirect to blog view page using blog ID
      console.log("Redirecting to story:", data.blog._id)
      router.push(`/blog/view/${data.blog._id}`)
    } catch (error) {
      console.error("Publish error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to publish story")
    } finally {
      setIsPublishing(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !blogData.tags.includes(newTag.trim())) {
      setBlogData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setBlogData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleMediaUpload = (file: MediaFile) => {
    console.log("Media file uploaded:", file)
    setBlogData((prev) => {
      const newMediaFiles = [...prev.mediaFiles, file]

      // If this is the first image and no featured image is set, make it the featured image
      let newFeaturedImage = prev.featuredImage
      if (!newFeaturedImage && file.type.startsWith("image/")) {
        newFeaturedImage = {
          url: file.url,
          alt: file.alt || file.name,
          publicId: file.publicId,
        }
      }

      return {
        ...prev,
        mediaFiles: newMediaFiles,
        featuredImage: newFeaturedImage,
      }
    })
    toast.success(`File "${file.name}" uploaded successfully!`)
  }

  const removeMediaFile = (index: number) => {
    setBlogData((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index),
    }))
    toast.success("File removed")
  }

  const clearDraft = () => {
    if (isClient) {
      localStorage.removeItem("blog-draft")
      localStorage.removeItem("blog-draft-id")
    }
    setBlogData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      category: "",
      tags: [],
      mediaFiles: [],
      featuredImage: null,
      status: "draft",
      visibility: "public",
      commentsEnabled: true,
      language: "en",
      author: "675a1234567890abcdef1234",
    })
    setSavedBlogId(null)
    toast.success("Draft cleared")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Share Your Story</h1>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>
                    {wordCount} words • {readingTime} min read
                  </span>
                  {savedBlogId && (
                    <Badge variant="outline" className="text-xs border-gray-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                  {blogData.mediaFiles.length > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-300">
                      <FileText className="h-3 w-3 mr-1" />
                      {blogData.mediaFiles.length} files
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="hidden md:flex border-gray-300 text-gray-700"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>

              <Button variant="ghost" size="sm" onClick={clearDraft} className="text-xs text-gray-600">
                Clear
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-0">
                {!isPreviewMode ? (
                  <div className="space-y-0">
                    {/* Title Section */}
                    <div className="p-4 pb-3">
                      <Input
                        placeholder="Share your banking experience..."
                        value={blogData.title}
                        onChange={(e) => setBlogData((prev) => ({ ...prev, title: e.target.value }))}
                        className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-gray-400 bg-transparent"
                      />
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                        <Globe className="h-3 w-3" />
                        <span>URL: /story/{blogData.slug || "your-story-title"}</span>
                      </div>
                    </div>

                    {/* Media Upload Section */}
                    {isClient && (
                      <div className="px-4 pb-3">
                        <Label className="text-sm font-medium mb-2 block text-gray-700">Attachments</Label>
                        <MediaUploader
                          onUpload={handleMediaUpload}
                          currentFiles={blogData.mediaFiles}
                          multiple={true}
                        />

                        {/* Display uploaded files */}
                        {blogData.mediaFiles.length > 0 && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium mb-2 block text-gray-700">
                              Uploaded Files ({blogData.mediaFiles.length})
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {blogData.mediaFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm truncate text-gray-700">{file.name}</span>
                                    <span className="text-xs text-gray-500">({Math.round(file.size / 1024)}KB)</span>
                                  </div>
                                  <Button
                                    onClick={() => removeMediaFile(index)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Excerpt */}
                    <div className="px-4 pb-3">
                      <Label className="text-sm font-medium mb-2 block text-gray-700">Brief Summary (Optional)</Label>
                      <Textarea
                        placeholder="Briefly describe your experience or what others can expect to learn..."
                        value={blogData.excerpt}
                        onChange={(e) => setBlogData((prev) => ({ ...prev, excerpt: e.target.value }))}
                        className="min-h-[60px] border-gray-300"
                        maxLength={300}
                      />
                      <div className="text-xs text-gray-500 mt-1">{blogData.excerpt.length}/300</div>
                    </div>

                    <Separator className="bg-gray-200" />

                    {/* Rich Text Editor */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700">Your Story</Label>
                        {isClient && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAI(!showAI)}
                            className="flex items-center gap-2 border-gray-300 text-gray-700"
                          >
                            <Sparkles className="h-4 w-4" />
                            AI Help
                          </Button>
                        )}
                      </div>

                      {showAI && isClient && (
                        <div className="mb-4">
                          <GroqAIAssistant
                            onContentGenerated={(content) =>
                              setBlogData((prev) => ({
                                ...prev,
                                content: content,
                              }))
                            }
                            onTagsGenerated={(tags) =>
                              setBlogData((prev) => ({
                                ...prev,
                                tags: [...new Set([...prev.tags, ...tags])],
                              }))
                            }
                            onTitleGenerated={(title) =>
                              setBlogData((prev) => ({
                                ...prev,
                                title: title,
                              }))
                            }
                            currentContent={blogData.content}
                            currentTitle={blogData.title}
                          />
                        </div>
                      )}

                      {isClient && (
                        <RichTextEditor
                          content={blogData.content}
                          onChange={(content) => setBlogData((prev) => ({ ...prev, content }))}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">{isClient && <BlogPreview blogData={blogData} />}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish Card */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-gray-900">
                  <Heart className="h-5 w-5 mr-2 text-gray-700" />
                  Share Your Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button
                    onClick={handlePublish}
                    disabled={isPublishing || !blogData.title.trim() || !blogData.content.trim() || !blogData.category}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Share Story
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">Your story will help fellow banking professionals</p>
                </div>

                {/* Requirements checklist */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {blogData.title.trim() ? (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={blogData.title.trim() ? "text-gray-700" : "text-gray-500"}>Title added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {blogData.content.trim() ? (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={blogData.content.trim() ? "text-gray-700" : "text-gray-500"}>Story written</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {blogData.category ? (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={blogData.category ? "text-gray-700" : "text-gray-500"}>Topic selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {blogData.mediaFiles.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={blogData.mediaFiles.length > 0 ? "text-gray-700" : "text-gray-500"}>
                      {blogData.mediaFiles.length} files attached
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Tags */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-gray-900">
                  <Tag className="h-5 w-5 mr-2 text-gray-700" />
                  Topic & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Topic *</Label>
                  <Select
                    value={blogData.category}
                    onValueChange={(value) => setBlogData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankingCategories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="flex-1 border-gray-300"
                    />
                    <Button onClick={addTag} size="sm" variant="outline" className="border-gray-300">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {blogData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="flex items-center gap-1 border-gray-300 text-gray-700"
                      >
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Enable Comments</Label>
                  <Switch
                    checked={blogData.commentsEnabled}
                    onCheckedChange={(checked) => setBlogData((prev) => ({ ...prev, commentsEnabled: checked }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Visibility</Label>
                  <Select
                    value={blogData.visibility}
                    onValueChange={(value: any) => setBlogData((prev) => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Private
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Banking Community Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
