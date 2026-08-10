import mongoose from 'mongoose'

const codelensGallerySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

codelensGallerySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret.__v
    return ret
  },
})

export default mongoose.model('CodelensGallery', codelensGallerySchema)
