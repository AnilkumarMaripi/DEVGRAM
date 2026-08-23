import { useState, useEffect, useCallback } from 'react'
import './App.css'
import AuthPanel from './components/AuthPanel/AuthPanel'
import HeroPanel from './components/HeroPanel/HeroPanel'
import HomeFeed from './components/HomeFeed/HomeFeed'
import DevGramLogo from './components/icons/DevGramLogo'
import { signInWithGithub, signInWithGoogle, checkAuthStatus, logoutUser, signUpUser, loginLocalUser, resetPassword } from './services/authService'

const BASE = '/DevGram'
const routeNames = ['login', 'register', 'forgot', 'home']

const getPageFromPath = (pathname, hash = window.location.hash) => {
  if (hash.startsWith('#/')) {
    const candidate = hash.slice(2)
    return routeNames.includes(candidate) ? candidate : 'landing'
  }
  const pathSegment = pathname.replace(BASE, '').split('/').filter(Boolean)[0]
  return routeNames.includes(pathSegment) ? pathSegment : 'landing'
}

function App() {

  const [page, setPageInternal] = useState(() => getPageFromPath(window.location.pathname))
  const [activeUser, setActiveUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const updateUrl = (newPage) => {
    const targetHash = newPage === 'landing' ? '#/' : `#/${newPage}`
    const targetPath = newPage === 'landing' ? `${BASE}/` : `${BASE}/${newPage}`

    if (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1') {
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath)
      }
    } else if (window.location.hash !== targetHash) {
      window.location.hash = targetHash
    }
  }

  const setPage = (newPage) => {
    setPageInternal(newPage)
    updateUrl(newPage)
  }

  const [showNavConfirmModal, setShowNavConfirmModal] = useState(false)
  const [pendingTargetPage, setPendingTargetPage] = useState('login')

  const requestLogoutOrNav = (targetPage = 'login') => {
    setPendingTargetPage(targetPage)
    setShowNavConfirmModal(true)
  }

  const handleConfirmLogoutNav = async () => {
    setShowNavConfirmModal(false)
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setActiveUser(null)
      setPage(pendingTargetPage || 'login')
    }
  }

  const handleCancelLogoutNav = () => {
    setShowNavConfirmModal(false)
    if (activeUser && page === 'home') {
      updateUrl('home')
    }
  }

  useEffect(() => {
    const handleNavigationChange = () => {
      const targetPage = getPageFromPath(window.location.pathname)

      // If user is logged in on home page and tries to go back to login/landing
      if (activeUser && page === 'home' && targetPage !== 'home') {
        updateUrl('home')
        requestLogoutOrNav(targetPage === 'landing' ? 'login' : targetPage)
        return
      }

      setPageInternal(targetPage)
    }

    window.addEventListener('popstate', handleNavigationChange)
    window.addEventListener('hashchange', handleNavigationChange)
    return () => {
      window.removeEventListener('popstate', handleNavigationChange)
      window.removeEventListener('hashchange', handleNavigationChange)
    }
  }, [activeUser, page])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await checkAuthStatus()
        if (data && data.user) {
          setActiveUser(data.user)
          const currentPath = window.location.pathname
          const currentHash = window.location.hash
          if (
            currentPath === `${BASE}/` ||
            currentPath === BASE ||
            currentPath === `${BASE}/login` ||
            currentPath === `${BASE}/register` ||
            currentPath === `${BASE}/forgot` ||
            currentHash === '#/' ||
            currentHash === '' ||
            currentHash === '#/login' ||
            currentHash === '#/register' ||
            currentHash === '#/forgot'
          ) {
            setPage('home')
          }
        } else {
          setActiveUser(null)
          if (window.location.pathname === `${BASE}/home` || window.location.hash === '#/home') {
            setPage('landing')
          }
        }
      } catch {
        setActiveUser(null)
        if (window.location.pathname === `${BASE}/home` || window.location.hash === '#/home') {
          setPage('landing')
        }
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  const registerUser = async (user) => {
    const data = await signUpUser(user)
    return data
  }

  const handleRegisterSuccess = (user) => {
    setActiveUser(user)
    setPage('home')
  }


  const loginUser = async ({ email, password }) => {
    const data = await loginLocalUser({ email, password })
    setActiveUser(data.user)
    setPage('home')
    return true
  }

  const handleResetPassword = async ({ email, password }) => {
    await resetPassword({ email, password })
  }

  const loginWithGoogle = async () => {
    const data = await signInWithGoogle()
    setActiveUser(data.user)
    setPage('home')
    return data
  }

  const loginWithGithub = async () => {
    const data = await signInWithGithub()
    setActiveUser(data.user)
    setPage('home')
    return data
  }

  const handleLogout = () => {
    requestLogoutOrNav('login')
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0c',
        color: '#ffffff',
        fontFamily: 'monospace'
      }}>
        Initializing DevGram Auth...
      </div>
    )
  }

  return (
    <main className={`app-shell ${page === 'home' ? 'app-shell-home' : ''}`}>
      {/* Go to Login Confirmation Modal */}
      {showNavConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#09090b',
            border: '1px solid #1f1f23',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px auto'
            }}>
              🔐
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Go to Login Page?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#a1a1aa', lineHeight: '1.5' }}>
              Are you sure you want to leave your active session and return to the login page?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCancelLogoutNav}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                No, Stay Here
              </button>
              <button
                type="button"
                onClick={handleConfirmLogoutNav}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                Yes, Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'home' ? (
        <HomeFeed activeUser={activeUser} onLogout={handleLogout} />
      ) : page === 'landing' ? (
        <div className="landing-page">
          <nav className="landing-nav">
            <div className="landing-nav-brand">
              <DevGramLogo size={36} />
              <span>DevGram</span>
            </div>
            <div className="landing-nav-actions">
              <button className="landing-login-btn" onClick={() => setPage('login')}>Log In</button>
              <button className="landing-signup-btn" onClick={() => setPage('register')}>Sign Up</button>
            </div>
          </nav>

          <section className="landing-hero">
            <div className="landing-hero-content">
              <h1 className="landing-title">
                Where developers <span className="landing-gradient-text">ship & share</span> their builds.
              </h1>
              <p className="landing-subtitle">
                A feed of code, commits, and creative chaos. Share screenshots, snippets,
                and shipped features with the people who actually get it.
              </p>
              <div className="landing-cta-group">
                <button className="landing-cta-primary" onClick={() => setPage('register')}>
                  Get Started — it's free
                </button>
                <button className="landing-cta-secondary" onClick={() => setPage('login')}>
                  I already have an account
                </button>
              </div>
            </div>
            <div className="landing-hero-visual">
              <img
                src="/image.png"
                alt="DevGram - developers collaborating with code overlays"
                className="landing-hero-img"
              />
            </div>
          </section>

          <section className="landing-features">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📡</div>
              <h3>Live Dev Feed</h3>
              <p>See builds, bugs, and breakthroughs from your network in real-time.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👥</div>
              <h3>Follow Builders</h3>
              <p>Connect with developers, follow their journey, and grow together.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💻</div>
              <h3>Share Code</h3>
              <p>Post code snippets, screenshots, and celebrate shipped features.</p>
            </div>
          </section>

          <footer className="landing-footer">
            &copy; {new Date().getFullYear()} DevGram — built for builders
          </footer>
        </div>
      ) : (
        <>
          <HeroPanel />
          <AuthPanel
            activeUser={activeUser}
            onGithubLogin={loginWithGithub}
            onGoogleLogin={loginWithGoogle}
            onLogin={loginUser}
            onNavigate={setPage}
            onRegister={registerUser}
            onRegisterSuccess={handleRegisterSuccess}
            onResetPassword={handleResetPassword}
            page={page}
          />
        </>
      )}
    </main>
  )

}

export default App
