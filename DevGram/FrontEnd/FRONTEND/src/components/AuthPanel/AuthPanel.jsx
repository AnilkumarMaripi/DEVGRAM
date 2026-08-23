import { useState } from 'react'
import './AuthPanel.css'
import GitHubIcon from '../icons/GitHubIcon'

const initialRegisterData = {
  name: '',
  email: '',
  mobile: '',
  gender: '',
  password: '',
  confirmPassword: '',
}

function FloatingField({
  label,
  name,
  onChange,
  options,
  placeholder = ' ',
  revealable = false,
  type = 'text',
  value,
}) {
  const [visible, setVisible] = useState(false)
  const inputType = revealable && visible ? 'text' : type

  return (
    <label className="field-group floating-field">
      {options ? (
        <select name={name} value={value} onChange={onChange} required>
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
          required
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
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState(initialRegisterData)
  const [resetData, setResetData] = useState({ email: '', password: '', confirmPassword: '' })
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [alert, setAlert] = useState('')

  const updateLogin = (event) => {
    setLoginData({ ...loginData, [event.target.name]: event.target.value })
  }

  const updateRegister = (event) => {
    setRegisterData({ ...registerData, [event.target.name]: event.target.value })
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setAlert('')
    try {
      await onLogin(loginData)
    } catch (error) {
      setAlert(error.message || 'Use a valid email and password.')
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      setAlert('Passwords do not match.')
      return
    }
    setAlert('')
    try {
      const data = await onRegister(registerData)
      onRegisterSuccess(data.user)
    } catch (error) {
      setAlert(error.message || 'Registration failed.')
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    if (!resetData.email) {
      setAlert('Email is required.')
      return
    }
    if (resetData.password !== resetData.confirmPassword) {
      setAlert('New passwords do not match.')
      return
    }
    setAlert('')
    try {
      await onResetPassword(resetData)
      setResetData({ email: '', password: '', confirmPassword: '' })
      setAlert('Password updated. Return to login.')
      onNavigate('login')
    } catch (error) {
      setAlert(error.message || 'Password update failed.')
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
          {alert && <div className="status-alert">{alert}</div>}
          <div className="auth-heading">
            <span>/ auth / reset</span>
            <h2>New Password</h2>
          </div>
          <form className="login-form" onSubmit={handleReset}>
            <FloatingField label="Registered Email" name="email" type="email" value={resetData.email} onChange={(event) => setResetData({ ...resetData, email: event.target.value })} />
            <FloatingField label="New Password" name="password" type="password" revealable value={resetData.password} onChange={(event) => setResetData({ ...resetData, password: event.target.value })} />
            <FloatingField label="Confirm New Password" name="confirmPassword" type="password" revealable value={resetData.confirmPassword} onChange={(event) => setResetData({ ...resetData, confirmPassword: event.target.value })} />
            <button className="primary-button" type="submit">Update Password</button>
            <p className="register-copy"><button type="button" onClick={() => onNavigate('login')}>back to login -&gt;</button></p>
          </form>
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
          <form className="login-form register-form" onSubmit={handleRegister}>
            <FloatingField label="Name" name="name" value={registerData.name} onChange={updateRegister} />
            <FloatingField label="Email" name="email" type="email" value={registerData.email} onChange={updateRegister} />
            <FloatingField label="Mobile Number" name="mobile" type="tel" value={registerData.mobile} onChange={updateRegister} />
            <FloatingField
              label="Gender"
              name="gender"
              value={registerData.gender}
              onChange={updateRegister}
              options={['Female', 'Male', 'Other', 'Prefer not to say']}
            />
            <FloatingField label="Password" name="password" type="password" revealable value={registerData.password} onChange={updateRegister} />
            <FloatingField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              revealable
              value={registerData.confirmPassword}
              onChange={updateRegister}
            />
            <button className="primary-button" type="submit">Create Account</button>
            <p className="register-copy">already joined? <button type="button" onClick={() => onNavigate('login')}>back to login -&gt;</button></p>
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
        <form className="login-form" onSubmit={handleLogin}>
          <FloatingField label="Email" name="email" type="email" value={loginData.email} onChange={updateLogin} />
          <FloatingField label="Password" name="password" type="password" revealable value={loginData.password} onChange={updateLogin} />
          <button className="help-link" type="button" onClick={() => onNavigate('forgot')}>forgot password?</button>
          <button className="primary-button" type="submit">Log In</button>
          <div className="form-divider"><span>continue with</span></div>
          <div className="social-grid">
            <button className="ghost-button" type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
              <GoogleMark /> {isGoogleLoading ? 'Opening Google...' : 'Google'}
            </button>
            <button className="ghost-button" type="button" onClick={handleGithubLogin} disabled={isGithubLoading || isGoogleLoading}>
              <GitHubIcon /> {isGithubLoading ? 'Opening GitHub...' : 'GitHub'}
            </button>
          </div>
          <p className="register-copy">new here? <button type="button" onClick={() => onNavigate('register')}>create an account -&gt;</button></p>
        </form>
      </div>
    </section>
  )
}

export default AuthPanel
