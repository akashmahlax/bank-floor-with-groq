"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { Paperclip, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface MediaFile {
  url: string
  publicId?: string // publicId is optional for comment attachments if we don't need to manage them individually like blog media
  name: string
  type: string
  size: number
}

interface Comment {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    avatar?: { url: string }
  }
  createdAt: string
  attachments?: MediaFile[] // Add attachments field
}

interface CommentsProps {
  blogId: string
  comments: Comment[]
  onCommentAdded: () => void
}

export function Comments({ blogId, comments, onCommentAdded }: CommentsProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // State for selected files

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error("Please sign in to comment")
      return
    }

    if (!newComment.trim() && selectedFiles.length === 0) {
      toast.error("Please enter a comment or attach a file")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData();
    formData.append('content', newComment);
    formData.append('blogId', blogId);
    selectedFiles.forEach(file => {
        formData.append('attachments', file);
    });

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        // Do not set Content-Type header for FormData
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      setNewComment("")
      setSelectedFiles([]) // Clear selected files on success
      onCommentAdded()
      toast.success("Comment added successfully")
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
      setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

      {session ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px]"
            required={selectedFiles.length === 0} // Require text only if no files are attached
          />

          {/* File Input */}
          <div className="flex items-center space-x-2">
              <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                  <Paperclip className="h-4 w-4" />
                  Attach Files
              </Label>
              <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
              />
              {selectedFiles.length > 0 && (
                  <span className="text-sm text-muted-foreground">{selectedFiles.length} file(s) selected</span>
              )}
          </div>

          {/* Display selected files */}
          {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {file.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile(index)} />
                      </Badge>
                  ))}
              </div>
          )}

          <Button type="submit" disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">Please sign in to leave a comment</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment._id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={comment.author.avatar?.url} />
                  <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{comment.author.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>

                  {/* Display attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-2">
                          <p className="text-sm font-medium text-foreground">Attachments:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                              {comment.attachments.map((attachment, idx) => (
                                  <a key={idx} href={attachment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80">
                                      <Paperclip className="h-3 w-3" />
                                      {attachment.name}
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 