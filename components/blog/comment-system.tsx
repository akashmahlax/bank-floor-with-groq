"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageCircle,
  Heart,
  Reply,
  Upload,
  Download,
  File,
  ImageIcon,
  Video,
  Music,
  FileText,
  X,
  Send,
  Loader2,
  Paperclip,
  Eye,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import Link from "next/link"

interface Attachment {
  type: "image" | "document" | "video" | "audio" | "other"
  url: string
  filename: string
  size: number
  mimeType?: string
}

interface Comment {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    avatar?: { url: string }
  }
  attachments: Attachment[]
  replies: Comment[]
  likes: string[]
  createdAt: string
  isEdited: boolean
}

interface CommentSystemProps {
  blogId: string
  commentsEnabled: boolean
}

export default function CommentSystem({ blogId, commentsEnabled }: CommentSystemProps) {
  const { data: session, status } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null)

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [blogId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?blogId=${blogId}`)
      const data = await response.json()
      if (response.ok) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // File upload handling
  const onDrop = async (acceptedFiles: File[]) => {
    if (!session) {
      toast.error("Please sign in to upload files")
      return
    }

    console.log("📁 Files dropped:", acceptedFiles)
    setIsUploading(true)

    try {
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append("files", file)
      })

      console.log("📤 Uploading files...")
      const response = await fetch("/api/upload/comment-files", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("📥 Upload response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      // Add uploaded files to both local state and uploaded attachments
      setAttachments((prev) => [...prev, ...acceptedFiles])
      setUploadedAttachments((prev) => [...prev, ...data.files])

      toast.success(`${acceptedFiles.length} file(s) uploaded successfully!`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".ogg"],
      "audio/*": [".mp3", ".wav", ".ogg"],
      "application/pdf": [".pdf"],
      "text/*": [".txt", ".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  })

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    setUploadedAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File | Attachment) => {
    // Safe check for file type
    const fileType = "type" in file ? file.type : file.mimeType || ""

    if (!fileType) return <File className="h-4 w-4 text-gray-500" />

    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4 text-purple-500" />
    if (fileType.startsWith("audio/")) return <Music className="h-4 w-4 text-green-500" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const submitComment = async (content: string, parentId?: string) => {
    if (!session) {
      toast.error("Please sign in to comment")
      return
    }

    if (!content.trim() && uploadedAttachments.length === 0) {
      toast.error("Please add some content or attachments")
      return
    }

    setIsSubmitting(true)
    try {
      console.log("💬 Submitting comment with attachments:", uploadedAttachments)

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          content: content.trim(),
          attachments: uploadedAttachments, // Use the uploaded attachments
          parentCommentId: parentId,
        }),
      })

      const data = await response.json()
      console.log("💬 Comment response:", data)

      if (response.ok) {
        toast.success("Comment posted successfully!")
        setNewComment("")
        setReplyContent("")
        setReplyTo(null)
        setAttachments([])
        setUploadedAttachments([])
        fetchComments() // Refresh comments
      } else {
        console.error("Comment submission error:", data)
        throw new Error(data.error || "Failed to post comment")
      }
    } catch (error) {
      console.error("Comment submission error details:", error)
      toast.error(error instanceof Error ? error.message : "Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const likeComment = async (commentId: string) => {
    if (!session?.user?.email) {
      toast.error("Please sign in to like comments")
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: session.user.email }),
      })

      if (response.ok) {
        fetchComments() // Refresh to get updated likes
      }
    } catch (error) {
      toast.error("Failed to like comment")
    }
  }

  const downloadAttachment = (attachment: Attachment) => {
    if (!attachment || !attachment.url) {
      toast.error("Cannot download: Invalid attachment")
      return
    }

    const link = document.createElement("a")
    link.href = attachment.url
    link.download = attachment.filename || "download"
    link.click()
  }

  const renderAttachment = (attachment: Attachment) => {
    if (!attachment || !attachment.type) {
      return (
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">{attachment?.filename || "Unknown file"}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment?.size || 0)}</p>
              </div>
            </div>
            <Button
              onClick={() => attachment?.url && window.open(attachment.url, "_blank")}
              size="sm"
              variant="outline"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )
    }

    if (attachment.type === "image") {
      return (
        <div className="relative group cursor-pointer" onClick={() => setPreviewFile(attachment)}>
          <Image
            src={attachment.url || "/placeholder.svg"}
            alt={attachment.filename || "Image"}
            width={200}
            height={150}
            className="rounded-lg object-cover hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              downloadAttachment(attachment)
            }}
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    return (
      <Card className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium truncate max-w-[150px]">{attachment.filename}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <Button
            onClick={() => window.open(attachment.url, "_blank")}
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment._id} className={`space-y-3 ${isReply ? "ml-4 sm:ml-8 border-l-2 border-banking-gray-200 pl-4" : ""}`}>
      <Card className="shadow-sm border-banking-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-banking-accent/50">
              <AvatarImage
                src={comment.author?.avatar?.url || "/placeholder.svg?height=40&width=40&text=BP"}
                alt={comment.author?.name || "Banking Professional"}
              />
              <AvatarFallback className="bg-banking-primary text-white">
                {(comment.author?.name || "BP").charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-banking-gray-900">
                  {comment.author?.name || "Banking Professional"}
                </span>
                <Badge variant="outline" className="text-xs border-banking-gray-300 text-banking-gray-700">
                  {comment.author?.name ? "Verified Member" : "Anonymous"}
                </Badge>
                <span className="text-xs text-banking-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs text-banking-gray-500">
                    Edited
                  </Badge>
                )}
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap text-banking-gray-800">{comment.content}</p>

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-banking-gray-500">
                    <Paperclip className="h-3 w-3" />
                    <span>{comment.attachments.length} attachment(s)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {comment.attachments.map((attachment, index) => (
                      <div key={index}>{renderAttachment(attachment)}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2">
                <Button
                  onClick={() => likeComment(comment._id)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-banking-gray-500 hover:text-red-500 transition-colors"
                  disabled={status !== "authenticated"}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      session?.user?.email && comment.likes && comment.likes.some((like) => like === session.user?.email)
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                  {comment.likes?.length || 0}
                </Button>

                <Button
                  onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-banking-gray-500 hover:text-banking-primary transition-colors"
                  disabled={status !== "authenticated"}
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              </div>

              {/* Reply Form */}
              {replyTo === comment._id && session && (
                <div className="mt-3 space-y-3 p-3 bg-banking-accent/5 rounded-lg">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] border-banking-gray-300 focus:border-banking-primary focus:ring-banking-primary resize-none"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitComment(replyContent, comment._id)}
                      disabled={isSubmitting || isUploading}
                      size="sm"
                      className="flex-1 bg-banking-primary hover:bg-banking-secondary text-white transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Reply
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => setReplyTo(null)} 
                      variant="outline" 
                      size="sm"
                      className="border-banking-gray-300 text-banking-gray-700 hover:bg-banking-gray-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">{comment.replies.map((reply) => renderComment(reply, true))}</div>
      )}
    </div>
  )

  if (!commentsEnabled) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Comments are disabled for this blog post.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-banking-primary/5 to-banking-accent/5 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="h-5 w-5 text-banking-primary" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {status === "loading" && (
            <Alert className="bg-banking-accent/10 border-banking-accent/20">
              <Loader2 className="h-4 w-4 animate-spin text-banking-primary" />
              <AlertDescription className="text-banking-gray-700">Loading authentication...</AlertDescription>
            </Alert>
          )}

          {status === "unauthenticated" && (
            <Alert className="bg-banking-accent/10 border-banking-accent/20">
              <Lock className="h-4 w-4 text-banking-primary" />
              <AlertDescription className="text-banking-gray-700">
                <Link href="/auth/signin" className="text-banking-primary hover:text-banking-secondary font-medium">
                  Sign in
                </Link>{" "}
                to join the conversation and share your thoughts.
              </AlertDescription>
            </Alert>
          )}

          {/* New Comment Form - only show if authenticated */}
          {status === "authenticated" && session && (
            <div className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-banking-gray-200">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border-2 border-banking-accent/50">
                  <AvatarImage
                    src={session.user?.image || "/placeholder.svg?height=40&width=40&text=BP"}
                    alt={session.user?.name || ""}
                  />
                  <AvatarFallback className="bg-banking-primary text-white">
                    {session.user?.name?.charAt(0) || "BP"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-banking-gray-900">Commenting as:</span>
                    <span className="ml-2 text-sm text-banking-primary font-medium">
                      {session.user?.name || "Banking Professional"}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Share your thoughts or experiences..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] border-banking-gray-300 focus:border-banking-primary focus:ring-banking-primary resize-none"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-banking-primary bg-banking-accent/20"
                    : "border-banking-gray-300 hover:border-banking-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-banking-gray-400" />
                <p className="text-sm text-banking-gray-600">
                  {isDragActive ? "Drop files here" : "Drag files or click to upload"}
                </p>
                <p className="text-xs text-banking-gray-500 mt-1">
                  Support images, videos, audio, documents (max 10MB each)
                </p>
              </div>

              {/* Attachment Preview */}
              {uploadedAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-banking-gray-900">Attachments:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadedAttachments.map((attachment, index) => (
                      <div key={index} className="relative group">
                        {renderAttachment(attachment)}
                        <Button
                          onClick={() => removeAttachment(index)}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => submitComment(newComment)}
                disabled={isSubmitting || isUploading || (!newComment.trim() && uploadedAttachments.length === 0)}
                className="w-full bg-banking-primary hover:bg-banking-secondary text-white transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-banking-primary" />
              <p className="text-banking-gray-600">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-banking-gray-400" />
              <p className="text-banking-gray-600">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>
          )}
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-banking-gray-900">{previewFile.filename}</h3>
              <div className="flex items-center gap-2">
                <Button onClick={() => downloadAttachment(previewFile)} size="sm" variant="outline" className="border-banking-gray-300">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setPreviewFile(null)} size="sm" variant="ghost" className="text-banking-gray-500">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              {previewFile.type === "image" && (
                <Image
                  src={previewFile.url || "/placeholder.svg"}
                  alt={previewFile.filename}
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
