import { z } from 'zod'

/**
 * Higher-order middleware to validate incoming request body against a Zod schema.
 * Returns consistent 400 Problem Details format on validation error.
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body)
      return next()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {}
        for (const issue of err.issues) {
          const path = issue.path.join('.') || 'root'
          if (!fieldErrors[path]) {
            fieldErrors[path] = []
          }
          fieldErrors[path].push(issue.message)
        }

        return res.status(400).json({
          status: 400,
          error: 'VALIDATION_ERROR',
          message: 'Request payload validation failed',
          fieldErrors,
        })
      }
      return res.status(400).json({
        status: 400,
        error: 'INVALID_PAYLOAD',
        message: err.message || 'Malformed request payload',
      })
    }
  }
}

// ----------------------------------------------------
// DTO Schemas (Equivalent to Bean Validation @Valid DTOs)
// ----------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  mobile: z.string().optional(),
  gender: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  token: z.string().min(16, 'Invalid or truncated reset token'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
})

export const verifyEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  token: z.string().min(16, 'Invalid or truncated verification token'),
})

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'Post content cannot be empty').max(5000, 'Post content cannot exceed 5000 characters'),
  codeSnippet: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  videoUrl: z.string().optional().default(''),
  category: z.string().optional().default('build'),
  tags: z.union([z.array(z.string()), z.string()]).optional().default([]),
})

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment text cannot be empty').max(1000, 'Comment text cannot exceed 1000 characters'),
})

export const createStorySchema = z.object({
  mediaUrl: z.string().trim().min(1, 'mediaUrl is required'),
  caption: z.string().optional().default(''),
})

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
})

export const onboardingSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username cannot exceed 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  avatar: z.string().optional(),
  bio: z.string().max(300, 'Bio cannot exceed 300 characters').optional().default(''),
  techStack: z.array(z.string()).optional().default([]),
  followUserIds: z.array(z.string()).optional().default([]),
})

