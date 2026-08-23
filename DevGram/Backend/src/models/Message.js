import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 })

export default mongoose.models.Message || mongoose.model('Message', messageSchema)
