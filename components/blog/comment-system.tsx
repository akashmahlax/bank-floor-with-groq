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
  publicId?: string
  filename: string
  originalName?: string
  size: number
  mimeType: string
  uploadedAt?: string
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

    setIsUploading(true)

    try {
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/upload/comment-files", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

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
    const fileType = "type" in file ? file.type : file.mimeType || ""
    if (!fileType) return <File className="h-4 w-4 text-gray-500" />

    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    }
    if (fileType.startsWith("video/")) {
      return <Video className="h-4 w-4 text-purple-500" />
    }
    if (fileType.startsWith("audio/")) {
      return <Music className="h-4 w-4 text-green-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />
    }
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
    if (!session?.user?.email) {
      toast.error("Please sign in to comment")
      return
    }

    if (!content.trim() && uploadedAttachments.length === 0) {
      toast.error("Please add some content or attachments")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          content: content.trim(),
          attachments: uploadedAttachments,
          parentCommentId: parentId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Comment posted successfully!")
        setNewComment("")
        setReplyContent("")
        setReplyTo(null)
        setAttachments([])
        setUploadedAttachments([])
        fetchComments()
      } else {
        throw new Error(data.error || "Failed to post comment")
      }
    } catch (error) {
      console.error("Comment submission error:", error)
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

  const isLikedByCurrentUser = (comment: Comment) => {
    return session?.user?.email && comment.likes?.includes(session.user.email)
  }

  const renderAttachment = (attachment: Attachment) => {
    if (!attachment || !attachment.type) {
      return (
        <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                  {attachment?.filename || "Unknown file"}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment?.size || 0)}</p>
              </div>
            </div>
            <Button
              onClick={() => attachment?.url && window.open(attachment.url, "_blank")}
              size="sm"
              variant="outline"
              className="border-gray-200 hover:border-blue-500 dark:border-gray-800"
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
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    if (attachment.type === "video") {
      return (
        <div className="relative group">
          <video src={attachment.url} controls className="rounded-lg max-w-full h-auto dark:bg-gray-900" style={{ maxHeight: "300px" }}>
            Your browser does not support the video tag.
          </video>
          <Button
            onClick={() => downloadAttachment(attachment)}
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    if (attachment.type === "audio") {
      return (
        <Card className="p-4 max-w-sm border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <Music className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{attachment.filename}</p>
              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
            </div>
            <Button 
              onClick={() => downloadAttachment(attachment)} 
              size="sm" 
              variant="outline"
              className="border-gray-200 hover:border-green-500 dark:border-gray-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <audio controls className="w-full">
            <source src={attachment.url} type={attachment.mimeType} />
            Your browser does not support the audio element.
          </audio>
        </Card>
      )
    }

    return (
      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer max-w-sm border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getFileIcon(attachment)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{attachment.filename}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatFileSize(attachment.size)}</span>
                {attachment.mimeType && (
                  <>
                    <span>•</span>
                    <span>{attachment.mimeType.split("/")[1]?.toUpperCase() || "FILE"}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              onClick={() => window.open(attachment.url, "_blank")} 
              size="sm" 
              variant="outline"
              className="border-gray-200 hover:border-blue-500 dark:border-gray-800"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => downloadAttachment(attachment)} 
              size="sm" 
              variant="outline"
              className="border-gray-200 hover:border-blue-500 dark:border-gray-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment._id} className={`space-y-3 ${isReply ? "ml-8 border-l-2 border-gray-100 dark:border-gray-800 pl-4" : ""}`}>
      <Card className="shadow-sm border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100 dark:ring-blue-900">
              <AvatarImage
                src={comment.author?.avatar?.url || "/placeholder.svg?height=40&width=40&text=BP"}
                alt={comment.author?.name || "Banking Professional"}
              />
              <AvatarFallback className="bg-blue-600 text-white">
                {(comment.author?.name || "BP").charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {comment.author?.name || "Banking Professional"}
                </span>
                <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-800 text-blue-600 bg-blue-50 dark:bg-blue-950">
                  {comment.author?.name ? "Verified Member" : "Anonymous"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-200 dark:border-gray-800">
                    Edited
                  </Badge>
                )}
              </div>

              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  className={`flex items-center gap-1 ${
                    isLikedByCurrentUser(comment)
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                  disabled={status !== "authenticated"}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isLikedByCurrentUser(comment)
                        ? "fill-red-500"
                        : "fill-none"
                    }`}
                  />
                  {comment.likes?.length || 0}
                </Button>

                <Button
                  onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                  disabled={status !== "authenticated"}
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              </div>

              {/* Reply Form */}
              {replyTo === comment._id && session && (
                <div className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className={`min-h-[80px] ${textareaStyle}`}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitComment(replyContent, comment._id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      size="sm"
                      className={`flex-1 ${buttonStyle}`}
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
                      onClick={() => {
                        setReplyTo(null)
                        setReplyContent("")
                      }} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
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
        <div className="space-y-3 mt-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  // Styles
  const cardStyle = "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
  const buttonStyle = "bg-blue-600 hover:bg-blue-700 text-white transition-colors"
  const ghostButtonStyle = "text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-gray-900"
  const textareaStyle = "resize-none border-gray-200 dark:border-gray-800 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-950 dark:text-gray-100"
  const uploadZoneStyle = (isDragActive: boolean) => `
    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
    ${isDragActive 
      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" 
      : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600"}
  `

  if (!commentsEnabled) {
    return (
      <Card className={`mt-8 ${cardStyle}`}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Comments are disabled for this blog post.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className={cardStyle}>
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {status === "loading" && (
            <Alert className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription>Loading authentication...</AlertDescription>
            </Alert>
          )}

          {status === "unauthenticated" && (
            <Alert className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>{" "}
                to join the conversation and share your thoughts.
              </AlertDescription>
            </Alert>
          )}

          {/* New Comment Form */}
          {status === "authenticated" && session && (
            <div className="space-y-4 bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-blue-100 dark:ring-blue-900">
                  <AvatarImage
                    src={session.user?.image || "/placeholder.svg?height=40&width=40&text=BP"}
                    alt={session.user?.name || ""}
                  />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {session.user?.name?.charAt(0) || "BP"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Commenting as:</span>
                    <span className="ml-2 text-sm text-blue-600 font-medium">
                      {session.user?.name || "Banking Professional"}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Share your thoughts or experiences..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={`min-h-[100px] ${textareaStyle}`}
                  />
                </div>
              </div>

              {/* File Upload Zone */}
              <div
                {...getRootProps()}
                className={uploadZoneStyle(isDragActive)}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive ? "Drop files here" : "Drag files or click to upload"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Support images, videos, audio, documents (max 10MB each)
                </p>
              </div>

              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Attachments:</p>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        {uploadedAttachments[index] && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                            Uploaded
                          </Badge>
                        )}
                      </div>
                      <Button onClick={() => removeAttachment(index)} size="sm" variant="ghost" className={ghostButtonStyle}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => submitComment(newComment)}
                disabled={isSubmitting || isUploading || (!newComment.trim() && uploadedAttachments.length === 0)}
                className={`w-full ${buttonStyle}`}
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

          <Separator className="my-6 border-gray-200 dark:border-gray-800" />

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  {/* File Preview Modal */}
  {previewFile && (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{previewFile?.filename}</h3>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => previewFile && downloadAttachment(previewFile)} 
              size="sm" 
              variant="outline"
              className="border-gray-200 hover:border-blue-500 dark:border-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setPreviewFile(null)} size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          {previewFile?.type === "image" && (
            <Image
              src={previewFile?.url || "/placeholder.svg"}
              alt={previewFile?.filename || "Preview"}
              width={800}
              height={600}
              className="max-w-full h-auto mx-auto rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  )}
}
