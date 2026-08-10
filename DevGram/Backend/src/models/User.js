import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      default: '',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      default: 'local',
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      default: '',
    },
    statusNote: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    showDevBadge: {
      type: Boolean,
      default: true,
    },
    isAiCreator: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret.__v
    return ret
  },
})

export default mongoose.model('User', userSchema)
