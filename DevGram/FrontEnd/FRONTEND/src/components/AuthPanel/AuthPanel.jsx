import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import './AuthPanel.css'
import GitHubIcon from '../icons/GitHubIcon'

const loginZodSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerZodSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  mobile: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms of Service and Privacy Policy to register' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const forgotZodSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
})

function FloatingField({
  label,
  name,
  onChange,
  options,
  placeholder = ' ',
  revealable = false,
  type = 'text',
  value,
  registration,
  error,
}) {
  const [visible, setVisible] = useState(false)
  const inputType = revealable && visible ? 'text' : type

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label className={`field-group floating-field ${error ? 'field-error' : ''}`} style={error ? { borderColor: '#ef4444' } : {}}>
        {options ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            {...(registration || {})}
          >
            <option value=""></option>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            name={name}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...(registration || {})}
          />
        )}
        <span>{label}</span>
        {revealable && (
          <button
            className="password-toggle"
            type="button"
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? 'hide' : 'show'}
          </button>
        )}
      </label>
      {error && (
        <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', textAlign: 'left', fontWeight: '500' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="button-icon">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.70 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.60 3.30-4.52 6.16-4.52z" />
    </svg>
  )
}

function AuthPanel({
  onGithubLogin,
  onGoogleLogin,
  onLogin,
  onNavigate,
  onRegister,
  onRegisterSuccess,
  onResetPassword,
  page,
}) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isResetSending, setIsResetSending] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [alert, setAlert] = useState('')

  // react-hook-form setups with Zod
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoggingIn },
  } = useForm({
    resolver: zodResolver(loginZodSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors, isSubmitting: isRegistering },
  } = useForm({
    resolver: zodResolver(registerZodSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      gender: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  })

  const {
    register: forgotRegister,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm({
    resolver: zodResolver(forgotZodSchema),
    defaultValues: { email: '' },
  })

  const onLoginSubmit = async (data) => {
    setAlert('')
    try {
      await onLogin(data)
    } catch (error) {
      setAlert(error.message || 'Use a valid email and password.')
    }
  }

  const onRegisterSubmit = async (data) => {
    setAlert('')
    try {
      const res = await onRegister(data)
      onRegisterSuccess(res.user)
    } catch (error) {
      setAlert(error.message || 'Registration failed.')
    }
  }

  const onForgotSubmit = async (data) => {
    setAlert('')
    setIsResetSending(true)
    try {
      await onResetPassword(data)
      setResetEmailSent(true)
      setAlert('If an account exists, a 15-minute reset link has been dispatched.')
    } catch (error) {
      setAlert(error.message || 'Password reset request failed.')
    } finally {
      setIsResetSending(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setAlert('')
    try {
      await onGoogleLogin()
    } catch (error) {
      setAlert(error.message || 'Google sign-in failed.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setIsGithubLoading(true)
    setAlert('')
    try {
      await onGithubLogin()
    } catch (error) {
      setAlert(error.message || 'GitHub sign-in failed.')
    } finally {
      setIsGithubLoading(false)
    }
  }

  if (page === 'forgot') {
    return (
      <section className="auth-panel" aria-label="Reset password">
        <div className="auth-card">
          {alert && <div className={`status-alert ${resetEmailSent ? 'success' : ''}`}>{alert}</div>}
          <div className="auth-heading">
            <span>/ auth / forgot-password</span>
            <h2>Reset Password</h2>
          </div>
          {resetEmailSent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
                Please check your email inbox for a link to set a new password. The link expires in <strong>15 minutes</strong>.
              </p>
              <button className="primary-button" type="button" onClick={() => { setResetEmailSent(false); onNavigate('login'); }}>
                Back to Login
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleForgotSubmit(onForgotSubmit)}>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                Enter your registered developer email address to receive a secure one-time password reset link.
              </p>
              <FloatingField
                label="Registered Email"
                name="email"
                type="email"
                registration={forgotRegister('email')}
                error={loginErrors?.email?.message}
              />
              <button className="primary-button" type="submit" disabled={isResetSending}>
                {isResetSending ? 'Sending Link...' : 'Send Reset Link'}
              </button>
              <p className="register-copy">
                remember your credentials?{' '}
                <button type="button" onClick={() => onNavigate('login')}>
                  back to login -&gt;
                </button>
              </p>
            </form>
          )}
        </div>
      </section>
    )
  }

  if (page === 'register') {
    return (
      <section className="auth-panel" aria-label="Register">
        <div className="auth-card auth-card-large">
          {alert && <div className={`status-alert ${alert.includes('match') ? 'error' : ''}`}>{alert}</div>}
          <div className="auth-heading">
            <span>/ auth / register</span>
            <h2>Create Account</h2>
          </div>
          <form className="login-form register-form" onSubmit={handleRegSubmit(onRegisterSubmit)}>
            <FloatingField
              label="Name"
              name="name"
              registration={regRegister('name')}
              error={regErrors?.name?.message}
            />
            <FloatingField
              label="Email"
              name="email"
              type="email"
              registration={regRegister('email')}
              error={regErrors?.email?.message}
            />
            <FloatingField
              label="Mobile Number"
              name="mobile"
              type="tel"
              registration={regRegister('mobile')}
              error={regErrors?.mobile?.message}
            />
            <FloatingField
              label="Gender"
              name="gender"
              options={['Female', 'Male', 'Other', 'Prefer not to say']}
              registration={regRegister('gender')}
              error={regErrors?.gender?.message}
            />
            <FloatingField
              label="Password (min 8 chars)"
              name="password"
              type="password"
              revealable
              registration={regRegister('password')}
              error={regErrors?.password?.message}
            />
            <FloatingField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              revealable
              registration={regRegister('confirmPassword')}
              error={regErrors?.confirmPassword?.message}
            />

            {/* Required Terms & Privacy Checkbox */}
            <div style={{ marginTop: '4px', textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#a1a1aa' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '3px' }}
                  {...regRegister('termsAccepted')}
                />
                <span>
                  I accept the{' '}
                  <span
                    style={{ color: '#818cf8', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
                  >
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span
                    style={{ color: '#818cf8', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
                  >
                    Privacy Policy
                  </span>{' '}
                  <em style={{ fontSize: '0.72rem', color: '#eab308' }}>[REVIEW BEFORE LAUNCH]</em>
                </span>
              </label>
              {regErrors?.termsAccepted && (
                <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                  {regErrors.termsAccepted.message}
                </span>
              )}
            </div>

            <button className="primary-button" type="submit" disabled={isRegistering}>
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </button>
            <p className="register-copy">already joined? <button type="button" onClick={() => onNavigate('login')}>back to login -&gt;</button></p>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1f1f23', display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '0.75rem', color: '#71717a' }}>
              <button type="button" onClick={() => onNavigate('privacy')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Privacy Policy</button>
              <span>&bull;</span>
              <button type="button" onClick={() => onNavigate('terms')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Terms of Service</button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-panel" aria-label="Login">
      <div className="auth-card">
        {alert && <div className={`status-alert ${alert.includes('valid') || alert.includes('failed') ? 'error' : ''}`}>{alert}</div>}
        <div className="auth-heading">
          <span>/ auth / login</span>
          <h2>Welcome Back</h2>
        </div>
        <form className="login-form" onSubmit={handleLoginSubmit(onLoginSubmit)}>
          <FloatingField
            label="Email"
            name="email"
            type="email"
            registration={loginRegister('email')}
            error={loginErrors?.email?.message}
          />
          <FloatingField
            label="Password"
            name="password"
            type="password"
            revealable
            registration={loginRegister('password')}
            error={loginErrors?.password?.message}
          />
          <button className="help-link" type="button" onClick={() => onNavigate('forgot')}>forgot password?</button>
          <button className="primary-button" type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </button>
          <div className="form-divider"><span>continue with</span></div>
          <div className="social-grid">
            <button className="ghost-button" type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
              <GoogleMark /> {isGoogleLoading ? 'Opening Google...' : 'Google'}
            </button>
            <button className="ghost-button" type="button" onClick={handleGithubLogin} disabled={isGithubLoading || isGoogleLoading}>
              <GitHubIcon /> {isGithubLoading ? 'Opening GitHub...' : 'GitHub'}
            </button>
          </div>
          <p className="register-copy">new builder? <button type="button" onClick={() => onNavigate('register')}>create account -&gt;</button></p>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1f1f23', display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '0.75rem', color: '#71717a' }}>
            <button type="button" onClick={() => onNavigate('privacy')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Privacy Policy</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigate('terms')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Terms of Service</button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AuthPanel
