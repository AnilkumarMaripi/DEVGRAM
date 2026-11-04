import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = parseInt(process.env.SMTP_PORT || '587', 10)
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const fromEmail = process.env.EMAIL_FROM || 'DevGram Security <no-reply@devgram.local>'

let transporter = null

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

/**
 * Sends a transactional email with fallback simulation logging.
 */
async function sendEmail({ to, subject, html, text }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text,
        html,
      })
      console.log(`📧 Email sent to ${to} (MessageId: ${info.messageId})`)
      return { success: true, messageId: info.messageId }
    } catch (err) {
      console.error('❌ Failed to send email via SMTP:', err.message)
      // Fall through to logging simulation
    }
  }

  // Fallback dev simulation logger
  console.log('\n================== 📬 DEVGRAM EMAIL SIMULATION ==================')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('-----------------------------------------------------------------')
  console.log(text || html)
  console.log('=================================================================\n')
  return { success: true, simulated: true }
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = 'DevGram: Reset your password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0c; color: #ffffff; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #6366f1; margin-top: 0;">DevGram Password Reset</h2>
      <p>We received a request to reset your DevGram account password.</p>
      <p>Click the link below to set a new password. This link expires in <strong>15 minutes</strong>:</p>
      <p style="margin: 32px 0;">
        <a href="${resetUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #a1a1aa; font-size: 13px;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #818cf8;">${resetUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 12px;">If you did not request this, please ignore this email. Your password remains unchanged.</p>
    </div>
  `
  const text = `DevGram Password Reset\n\nReset your password within 15 minutes by clicking:\n${resetUrl}\n\nIf you did not request this, ignore this email.`
  return sendEmail({ to, subject, html, text })
}

export async function sendVerificationEmail({ to, verifyUrl }) {
  const subject = 'DevGram: Verify your email address'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0c; color: #ffffff; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #10b981; margin-top: 0;">Welcome to DevGram! 🚀</h2>
      <p>Thanks for joining DevGram. Please verify your email address to unlock full developer platform features (posting, messaging, and commenting).</p>
      <p style="margin: 32px 0;">
        <a href="${verifyUrl}" style="background: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </p>
      <p style="color: #a1a1aa; font-size: 13px;">Or copy and paste this URL into your browser:<br/><a href="${verifyUrl}" style="color: #34d399;">${verifyUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 12px;">If you did not create this account, you can safely disregard this email.</p>
    </div>
  `
  const text = `Welcome to DevGram!\n\nPlease verify your email by clicking:\n${verifyUrl}\n\nThis unlocks posting, messaging, and community interactions.`
  return sendEmail({ to, subject, html, text })
}

