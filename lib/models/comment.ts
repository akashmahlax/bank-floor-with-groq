import mongoose from "mongoose"

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "document", "video", "audio", "other"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: "",
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    default: "",
  },
  size: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: "",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [attachmentSchema],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: String, // User email or ID
      },
    ],
    status: {
      type: String,
      enum: ["active", "deleted", "hidden"],
      default: "active",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Add indexes for better performance
commentSchema.index({ blog: 1, createdAt: -1 })
commentSchema.index({ parentComment: 1 })
commentSchema.index({ author: 1 })

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema)

export default Comment
