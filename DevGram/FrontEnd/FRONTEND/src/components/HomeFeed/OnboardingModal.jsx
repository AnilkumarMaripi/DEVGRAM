import { useState, useEffect } from 'react'
import { completeOnboarding, fetchUsers } from '../../services/authService'
import DevGramLogo from '../icons/DevGramLogo'

const POPULAR_TAGS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust',
  'PostgreSQL', 'Docker', 'Kubernetes', 'Next.js', 'TailwindCSS',
  'GraphQL', 'AWS', 'Linux', 'Java', 'Spring Boot'
]

const AVATAR_SEEDS = ['octocat', 'coder', 'pixel', 'bot', 'cyber', 'matrix']

export default function OnboardingModal({ activeUser, onComplete }) {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(activeUser?.username || '')
  const [avatar, setAvatar] = useState(activeUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUser?.name || 'developer'}`)
  const [bio, setBio] = useState(activeUser?.bio || '')
  const [selectedTags, setSelectedTags] = useState(activeUser?.techStack || ['React', 'TypeScript'])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [selectedFollows, setSelectedFollows] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const users = await fetchUsers()
        if (Array.isArray(users)) {
          const filtered = users
            .filter((u) => u.id !== activeUser?.id && u.username)
            .slice(0, 6)
          setSuggestedUsers(filtered)
          // Default select first 2
          setSelectedFollows(filtered.slice(0, 2).map((u) => u.id))
        }
      } catch (e) {
        console.warn('Failed to load suggested devs:', e)
      }
    }
    loadSuggestions()
  }, [activeUser])

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const toggleFollow = (userId) => {
    if (selectedFollows.includes(userId)) {
      setSelectedFollows(selectedFollows.filter((id) => id !== userId))
    } else {
      setSelectedFollows([...selectedFollows, userId])
    }
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await completeOnboarding({
        username,
        avatar,
        bio,
        techStack: selectedTags,
        followUserIds: selectedFollows,
      })
      if (onComplete) {
        onComplete(res.user)
      }
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#121217',
        border: '1px solid #27272a',
        borderRadius: '20px',
        padding: '32px 28px',
        color: '#ffffff',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DevGramLogo size={28} />
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>DevGram Onboarding</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a1a1aa', background: '#1c1c22', padding: '4px 10px', borderRadius: '12px' }}>
            Step {step} of 4
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Avatar & Username */}
        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '700' }}>
              Choose your developer persona
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Set your handle and select your default avatar robot.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <img
                src={avatar}
                alt="Avatar preview"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#27272a',
                  border: '2px solid #6366f1'
                }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                  Pick Avatar Variant:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {AVATAR_SEEDS.map((seed) => {
                    const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
                    return (
                      <img
                        key={seed}
                        src={url}
                        alt={seed}
                        onClick={() => setAvatar(url)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: avatar === url ? '2px solid #4f46e5' : '1px solid #3f3f46',
                          background: '#18181b'
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>
                Username (@handle)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="developer_handle"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!username.trim()}
                style={{
                  padding: '10px 20px',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: username.trim() ? 'pointer' : 'not-allowed',
                  opacity: username.trim() ? 1 : 0.5
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '700' }}>
              Tell the community about your work
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              A short bio helps other builders find you and see what you ship.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Full-stack engineer building AI tools, open-source enthusiast..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ padding: '10px 18px', background: '#1c1c22', color: '#a1a1aa', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tech Stack */}
        {step === 3 && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '700' }}>
              Select your Tech Stack
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Select languages and frameworks you work with to tailor your feed.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', maxHeight: '180px', overflowY: 'auto' }}>
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '700' : '500',
                      background: isSelected ? '#4f46e5' : '#1c1c22',
                      color: isSelected ? '#ffffff' : '#d4d4d8',
                      border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ padding: '10px 18px', background: '#1c1c22', color: '#a1a1aa', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Suggested Developers to Follow */}
        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '700' }}>
              Connect with fellow builders
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Follow a few developers to start populating your feed with builds.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
              {suggestedUsers.length > 0 ? (
                suggestedUsers.map((dev) => {
                  const isFollowing = selectedFollows.includes(dev.id)
                  return (
                    <div
                      key={dev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#18181b',
                        borderRadius: '10px',
                        border: '1px solid #27272a'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={dev.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${dev.username || 'user'}`}
                          alt={dev.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{dev.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>@{dev.username}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFollow(dev.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: isFollowing ? '#27272a' : '#4f46e5',
                          color: isFollowing ? '#a1a1aa' : '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                  No extra developer suggestions available right now.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ padding: '10px 18px', background: '#1c1c22', color: '#a1a1aa', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                style={{
                  padding: '10px 22px',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Finalizing Setup...' : 'Enter DevGram 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

