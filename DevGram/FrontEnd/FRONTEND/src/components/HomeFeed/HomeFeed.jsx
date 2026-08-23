import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { API_BASE_URL } from '../../services/api'
import { fetchPosts, createPost, likePost } from '../../services/postService'
import {
  fetchUsers,
  fetchConnections,
  toggleConnection,
  fetchPendingFollowRequests,
  fetchSentFollowRequests,
  sendFollowRequest,
  confirmFollowRequest,
  rejectFollowRequest,
  updateUsername,
  updateProfile,
  updateAvatar,
  fetchNotifications,
  markNotificationsRead
} from '../../services/authService'
import DevGramLogo from '../icons/DevGramLogo'
import StoriesBar from '../Stories/StoriesBar'
import './HomeFeed.css'

function HomeFeed({ activeUser, onLogout }) {
  const [posts, setPosts] = useState([])
  const [builders, setBuilders] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileUser, setProfileUser] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [profileFollowers, setProfileFollowers] = useState([])
  const [profileFollowing, setProfileFollowing] = useState([])
  const [socialModalType, setSocialModalType] = useState(null)

  // Dynamic Reels index & state
  const [currentReelIdx, setCurrentReelIdx] = useState(0)
  const [reelsMuted, setReelsMuted] = useState(false)

  // Direct messages state
  const [selectedChatUser, setSelectedChatUser] = useState(null)
  const [chatMessagesMap, setChatMessagesMap] = useState({})
  const [chatInputText, setChatInputText] = useState('')
  const [chatConversations, setChatConversations] = useState([])

  // Fetch persistent conversations list from API
  const fetchConversations = useCallback(async () => {
    if (!activeUser) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setChatConversations(data)
        // Auto-select top conversation if no user is currently selected
        setSelectedChatUser((current) => {
          if (!current && data.length > 0) {
            return data[0]
          }
          return current
        })
      }
    } catch (err) {
      console.warn('Fetch conversations error:', err)
    }
  }, [activeUser])

  // Fetch persistent chat history between activeUser and selectedChatUser
  const fetchChatHistory = useCallback(async (partnerId) => {
    if (!partnerId) return
    const idStr = String(partnerId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${idStr}`, { credentials: 'include' })
      if (res.ok) {
        const history = await res.json()
        setChatMessagesMap((prev) => {
          const currentList = prev[idStr] || []
          if (
            currentList.length === history.length &&
            currentList[currentList.length - 1]?.id === history[history.length - 1]?.id
          ) {
            return prev
          }
          return {
            ...prev,
            [partnerId]: history,
            [idStr]: history,
          }
        })
      }
    } catch (err) {
      console.warn('Fetch chat history error:', err)
    }
  }, [])

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (activeTab === 'direct') {
      fetchConversations()
      const convTimer = setInterval(() => {
        fetchConversations()
      }, 2000) // Poll conversations list every 2 seconds
      return () => clearInterval(convTimer)
    }
  }, [activeTab, fetchConversations])

  useEffect(() => {
    if (activeTab === 'direct' && selectedChatUser) {
      const targetId = selectedChatUser.id || selectedChatUser._id
      if (targetId) {
        fetchChatHistory(targetId)
        const chatTimer = setInterval(() => {
          fetchChatHistory(targetId)
        }, 1500) // Poll active chat history every 1.5 seconds
        return () => clearInterval(chatTimer)
      }
    }
  }, [activeTab, selectedChatUser, fetchChatHistory])

  // Scroll to bottom ONLY when selecting a new chat partner
  useEffect(() => {
    if (selectedChatUser && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedChatUser])

  // Professional account state
  const [isProfessionalAccount, setIsProfessionalAccount] = useState(
    activeUser?.isProfessional !== undefined ? activeUser.isProfessional : true
  )

  // CodeLens / Camera states
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  // Captured images / gallery state
  const [capturedImage, setCapturedImage] = useState('')
  const [capturedGallery, setCapturedGallery] = useState([])


  // Follow requests states
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [showInbox, setShowInbox] = useState(false)
  const inboxRef = useRef(null)

  // Notification states
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsRef = useRef(null)

  // Username edit states
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [userSearchVal, setUserSearchVal] = useState('')
  const [searchPage, setSearchPage] = useState(0)
  const [discoverPage, setDiscoverPage] = useState(0)

  // DevGram Sidebar & Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)

  // Edit Profile & Photo Selector View States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false)
  const [editProfileName, setEditProfileName] = useState('')
  const [editProfileUsername, setEditProfileUsername] = useState('')
  const [editProfileBio, setEditProfileBio] = useState('')
  const [editProfileTitle, setEditProfileTitle] = useState('')
  const [editProfileWebsite, setEditProfileWebsite] = useState('')
  const [editProfileStatusNote, setEditProfileStatusNote] = useState('')
  const [editShowDevBadge, setEditShowDevBadge] = useState(true)
  const [editIsAiCreator, setEditIsAiCreator] = useState(false)
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('')
  const [avatarSourceTab, setAvatarSourceTab] = useState('upload') // 'upload' | 'camera'
  const [profileSaveError, setProfileSaveError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const openEditProfile = useCallback((userToEdit = activeUser) => {
    if (!userToEdit) return
    setEditProfileName(userToEdit.name || '')
    setEditProfileUsername(userToEdit.username || '')
    setEditProfileBio(userToEdit.bio || '')
    setEditProfileTitle(userToEdit.title || '')
    setEditProfileWebsite(userToEdit.website || '')
    setEditProfileStatusNote(userToEdit.statusNote || '')
    setEditShowDevBadge(userToEdit.showDevBadge !== undefined ? userToEdit.showDevBadge : true)
    setEditIsAiCreator(userToEdit.isAiCreator !== undefined ? userToEdit.isAiCreator : false)
    setProfileAvatarPreview(userToEdit.avatar || '')
    setProfileUser(null)
    setActiveTab('edit-profile')
  }, [activeUser])

  // Filter real user-posted reels from database posts
  const userReels = useMemo(() => {
    return posts.filter(p => p.category === 'reel' || p.category === 'reels' || p.isReel)
  }, [posts])

  // Real-time calculation of logged in user's posts & engagement stats
  const activeUserPosts = useMemo(() => {
    if (!activeUser) return []
    return posts.filter(p => p.user?.id === activeUser.id || p.user?._id === activeUser.id)
  }, [posts, activeUser])

  const totalRealStars = useMemo(() => {
    return activeUserPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)
  }, [activeUserPosts])

  const totalRealForks = useMemo(() => {
    return activeUserPosts.reduce((acc, p) => acc + (p.sharesCount || 0), 0)
  }, [activeUserPosts])

  const totalRealImpressions = useMemo(() => {
    const commentsCount = activeUserPosts.reduce((acc, p) => acc + (p.comments?.length || 0), 0)
    return activeUserPosts.length * 15 + totalRealStars * 8 + commentsCount * 4
  }, [activeUserPosts, totalRealStars])

  const totalRealProfileVisits = useMemo(() => {
    return profileFollowers.length * 6 + activeUserPosts.length * 4
  }, [profileFollowers.length, activeUserPosts.length])

  // Tech Stack Interest Distribution (real-time tag analysis across user posts)
  const realTechStackStats = useMemo(() => {
    const tagCounts = {}
    let totalTags = 0
    activeUserPosts.forEach(p => {
      (p.tags || []).forEach(tag => {
        const clean = tag.toLowerCase()
        tagCounts[clean] = (tagCounts[clean] || 0) + 1
        totalTags++
      })
    })
    if (totalTags === 0) {
      return []
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
    const colors = ['#818cf8', '#22c55e', '#eab308', '#f472b6']
    return topTags.map(([tag, count], i) => ({
      name: `#${tag.toUpperCase()}`,
      percentage: Math.round((count / totalTags) * 100),
      color: colors[i % colors.length]
    }))
  }, [activeUserPosts])

  // Reel Endless Loop Handlers over dynamic database userReels
  const handleNextReel = useCallback(() => {
    if (userReels.length === 0) return
    setCurrentReelIdx(prev => prev + 1)
  }, [userReels.length])

  const handlePrevReel = useCallback(() => {
    setCurrentReelIdx(prev => Math.max(0, prev - 1))
  }, [])





  const randomExploreBuilders = useMemo(() => {
    const pool = builders.filter(b => b.id !== activeUser?.id)
    const hash = (s) => String(s).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return [...pool].sort((a, b) => (hash(a.id) - hash(b.id))).slice(0, 4)
  }, [builders, activeUser])

  const categoryLabels = {
    build: '🚀 build',
    bug: '🐛 bug',
    refactor: '♻️ refactor',
    ui: '🎨 ui',
    design: '📐 design',
    help: '❓ help',
  }

  const getCategoryLabel = (category) => categoryLabels[category] || category

  const renderBuilderCard = (builder) => {
    const handle = builder.username || 'builder'
    const isConnected = connections.some(c => c.id === builder.id)
    const isRequested = sentRequests.includes(builder.id)

    return (
      <div
        key={builder.id}
        className="explore-builder-card builder-card"
        onClick={() => setProfileUser(builder)}
      >
        <img
          className="builder-card-avatar"
          src={builder.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
          alt={builder.name}
        />
        <h4 className="builder-card-name">{builder.name || 'Dev Builder'}</h4>
        <span className="builder-card-handle">@{handle}</span>
        <div className="builder-card-action">
          {isRequested ? (
            <button
              type="button"
              className="solid-button requested"
              onClick={(e) => e.stopPropagation()}
              disabled
            >
              Requested
            </button>
          ) : isConnected ? (
            <button
              type="button"
              className="solid-button unfollow"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleConnection(builder.id)
              }}
            >
              Unfollow
            </button>
          ) : (
            <button
              type="button"
              className="solid-button follow"
              onClick={(e) => {
                e.stopPropagation()
                handleSendFollowRequest(builder.id)
              }}
            >
              Follow
            </button>
          )}
        </div>
      </div>
    )
  }

  const PostCard = ({ post, onAuthorClick }) => {
    const userLikesIt = activeUser && post.likes?.includes(activeUser.id)
    const userSavedIt = activeUser && post.saves?.includes(activeUser.id)
    const isOwner = activeUser && post.user?.id === activeUser.id
    const [showPostMenu, setShowPostMenu] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content || '')
    const [showCommentsModal, setShowCommentsModal] = useState(false)
    const [commentInput, setCommentInput] = useState('')

    const handleUpdateCaption = async () => {
      try {
        const res = await updatePost(post._id, { content: editContent })
        setPosts(posts.map(p => p._id === post._id ? { ...p, content: res.content } : p))
        setIsEditing(false)
        setShowPostMenu(false)
      } catch (err) {
        alert(err.message || 'Failed to update caption')
      }
    }

    const handleDelete = async () => {
      if (!window.confirm('Are you sure you want to delete this post?')) return
      try {
        await deletePost(post._id)
        setPosts(posts.filter(p => p._id !== post._id))
        setShowPostMenu(false)
      } catch (err) {
        alert(err.message || 'Failed to delete post')
      }
    }

    const handleShare = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).then(r => r.json())
        setPosts(posts.map(p => p._id === post._id ? { ...p, sharesCount: res.sharesCount } : p))
      } catch (err) {
        console.warn('Share error:', err)
      }
    }

    const handleSave = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).then(r => r.json())
        setPosts(posts.map(p => p._id === post._id ? { ...p, saves: res.saves } : p))
      } catch (err) {
        console.warn('Save error:', err)
      }
    }

    const handleAddComment = async (e) => {
      e.preventDefault()
      if (!commentInput.trim()) return
      try {
        const updated = await createComment(post._id, commentInput)
        setPosts(posts.map(p => p._id === post._id ? updated : p))
        setCommentInput('')
      } catch (err) {
        alert(err.message || 'Failed to post comment')
      }
    }

    return (
      <article className="post-card" style={{ background: '#000000', border: '1px solid #1f1f23', borderRadius: '14px', marginBottom: '20px', overflow: 'hidden' }}>
        {/* Header */}
        <header className="post-card-header" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="post-author-info post-clickable" onClick={onAuthorClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            {/* Gradient ring avatar */}
            <div style={{ padding: '2px', background: 'linear-gradient(45deg, #f97316, #ec4899, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img className="post-avatar" src={post.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt={post.user?.name || 'Developer'} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #000000', objectFit: 'cover' }} />
            </div>
            <div className="post-author-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="author-name" style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>@{post.user?.username || post.user?.name?.toLowerCase().replace(/\s+/g, '.') || 'builder'}</span>
              <span className="post-time" style={{ fontSize: '0.8rem', color: '#71717a' }}>· {formatDate(post.createdAt)}</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowPostMenu(!showPostMenu)}
              style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}
            >
              •••
            </button>
            {showPostMenu && (
              <div style={{ position: 'absolute', right: 0, top: '28px', background: '#121215', border: '1px solid #27272a', borderRadius: '10px', width: '160px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                {isOwner ? (
                  <>
                    <button type="button" onClick={() => { setIsEditing(true); setShowPostMenu(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ffffff', textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer' }}>✏️ Edit Caption</button>
                    <button type="button" onClick={handleDelete} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer' }}>🗑️ Delete Post</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { if (post.user) setProfileUser(post.user); setShowPostMenu(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ffffff', textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer' }}>👤 View Profile</button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        {isEditing ? (
          <div style={{ padding: '14px 16px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              style={{ width: '100%', background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#ffffff', padding: '10px', fontSize: '0.9rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#27272a', border: 'none', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleUpdateCaption} style={{ background: '#4f46e5', border: 'none', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        ) : (
          <div className="post-content" style={{ padding: '12px 16px', fontSize: '0.92rem', color: '#e4e4e7', lineHeight: '1.5' }}>
            <p style={{ margin: 0 }}>{renderMentions(post.content)}</p>
          </div>
        )}

        {post.imageUrl && (
          <div className="post-attached-image" style={{ width: '100%', maxHeight: '520px', overflow: 'hidden', background: '#09090b' }}>
            <img src={post.imageUrl} alt="Attached build" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {post.codeSnippet && (
          <div style={{ padding: '0 16px 12px 16px' }}>
            <pre className="post-code" style={{ background: '#09090b', border: '1px solid #1f1f23', borderRadius: '10px', padding: '14px', color: '#818cf8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem', margin: 0, overflowX: 'auto' }}>{post.codeSnippet}</pre>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags-list" style={{ padding: '0 16px 8px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {post.tags.map((tag, idx) => (
              <span key={idx} className="post-tag-chip" style={{ fontSize: '0.8rem', color: '#818cf8' }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Action Row */}
        <footer className="post-card-footer" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" className={`like-btn ${userLikesIt ? 'liked' : ''}`} onClick={() => handleLikePost(post._id)} style={{ background: 'none', border: 'none', color: userLikesIt ? '#f43f5e' : '#ffffff', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{userLikesIt ? '❤️' : '🤍'}</span>
            </button>
            <button type="button" onClick={() => setShowCommentsModal(!showCommentsModal)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer' }}>
              💬
            </button>
            <button type="button" onClick={handleShare} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer' }}>
              🍴
            </button>
          </div>
          <button type="button" onClick={handleSave} style={{ background: 'none', border: 'none', color: userSavedIt ? '#818cf8' : '#ffffff', fontSize: '1.25rem', cursor: 'pointer' }}>
            {userSavedIt ? '🏷️' : '🔖'}
          </button>
        </footer>

        {/* Counter & Comments Preview */}
        <div style={{ padding: '0 16px 14px 16px', fontSize: '0.88rem', color: '#f4f4f5' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>{post.likes?.length || 0} likes</strong>
          {post.comments && post.comments.length > 0 && (
            <div style={{ color: '#a1a1aa', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px' }} onClick={() => setShowCommentsModal(true)}>
              View all {post.comments.length} comments
            </div>
          )}

          {/* Inline Comments Modal / Box */}
          {showCommentsModal && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1f1f23' }}>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {(post.comments || []).map((c, i) => (
                  <div key={i} style={{ fontSize: '0.84rem', color: '#e4e4e7' }}>
                    <strong style={{ color: '#ffffff', marginRight: '6px' }}>@{c.user?.username || c.user?.name || 'builder'}</strong>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{ flex: 1, background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#ffffff', padding: '8px 12px', fontSize: '0.85rem', outline: 'none' }}
                />
                <button type="submit" disabled={!commentInput.trim()} style={{ background: '#4f46e5', border: 'none', color: '#ffffff', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}>Post</button>
              </form>
            </div>
          )}
        </div>
      </article>
    )
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target)) {
        setShowInbox(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Instantly bind cameraStream when the stream changes or components mount/render
  useEffect(() => {
    const videoEl = document.getElementById('camera-preview-video')
    if (videoEl && cameraStream && videoEl.srcObject !== cameraStream) {
      videoEl.srcObject = cameraStream
    }
  }, [cameraStream])

  useEffect(() => {
    if (profileUser) {
      const fetchProfileStats = async () => {
        try {
          const resFollowing = await fetch(`${API_BASE_URL}/api/auth/following/${profileUser.id}`, {
            credentials: 'include'
          }).then(r => r.json())
          const resFollowers = await fetch(`${API_BASE_URL}/api/auth/followers/${profileUser.id}`, {
            credentials: 'include'
          }).then(r => r.json())
          setProfileFollowers(Array.isArray(resFollowers) ? resFollowers : [])
          setProfileFollowing(Array.isArray(resFollowing) ? resFollowing : [])
        } catch (e) {
          console.error('Failed to fetch profile social stats:', e)
        }
      }
      fetchProfileStats()
    } else {
      setTimeout(() => {
        setProfileFollowers([])
        setProfileFollowing([])
      }, 0)
    }
  }, [profileUser])

  useEffect(() => {
    if (activeTab === 'codelens') {
      const initCodeLens = async () => {
        try {
          const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
          initialStream.getTracks().forEach(track => track.stop())

          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devices.filter(d => d.kind === 'videoinput')
          setCameraDevices(videoInputs)
          if (videoInputs.length > 0) {
            setSelectedCameraId(videoInputs[0].deviceId)
          }
        } catch (err) {
          console.error('Error enumerating cameras for CodeLens:', err)
        }
      }
      initCodeLens()

      // Fetch saved gallery photos from database
      const fetchGallery = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/codelens-gallery`, {
            credentials: 'include'
          })
          if (res.ok) {
            const data = await res.json()
            setCapturedGallery(Array.isArray(data) ? data : [])
          }
        } catch (err) {
          console.error('Error fetching codelens gallery:', err)
        }
      }
      fetchGallery()
    } else {
      setCameraStream(prevStream => {
        if (prevStream) {
          prevStream.getTracks().forEach(track => track.stop())
        }
        return null
      })
    }
  }, [activeTab])

  // Composer form state
  const [content, setContent] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [category, setCategory] = useState('build')
  const [tagsInput, setTagsInput] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  // Load posts and builders
  const loadPostsData = async () => {
    try {
      setLoading(true)
      const data = await fetchPosts()
      setPosts(data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Could not connect to DevGram services. Please verify the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const loadBuildersData = async () => {
    try {
      const data = await fetchUsers()
      setBuilders(data)
      const connData = await fetchConnections()
      setConnections(connData)

      // Load follow requests
      const pendingData = await fetchPendingFollowRequests()
      setPendingRequests(pendingData)
      const sentData = await fetchSentFollowRequests()
      setSentRequests(sentData)

      // Load notifications
      try {
        const notifData = await fetchNotifications()
        setNotifications(notifData)
      } catch (notifErr) {
        console.warn('Notifications fetch failed:', notifErr.message)
      }
    } catch (err) {
      console.error('Failed to fetch builders/connections:', err)
    }
  }

  useEffect(() => {
    setTimeout(() => {
      loadPostsData()
      loadBuildersData()
    }, 0)

    // Background polling to fetch follow request updates immediately without page refresh
    const interval = setInterval(async () => {
      try {
        const pendingData = await fetchPendingFollowRequests()
        setPendingRequests(pendingData)
        const sentData = await fetchSentFollowRequests()
        setSentRequests(sentData)
        const connData = await fetchConnections()
        setConnections(connData)
        const notifData = await fetchNotifications()
        setNotifications(notifData)
      } catch (error) {
        console.warn('Background polling failed', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Handle new post submit
  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      setSubmitting(true)

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)

      const newPost = await createPost({
        content,
        codeSnippet: showCode ? codeSnippet : '',
        imageUrl: capturedImage,
        category,
        tags
      })

      // Add to list and clear form
      setPosts([newPost, ...posts])
      setContent('')
      setCodeSnippet('')
      setCapturedImage('')
      setTagsInput('')
      setShowCode(false)
      setCategory('build')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to submit post')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle toggle like
  const handleLikePost = async (postId) => {
    try {
      const data = await likePost(postId)
      setPosts(posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            likes: data.likes
          }
        }
        return p
      }))
    } catch (err) {
      console.error(err)
    }
  }

  // Handle connection toggle (unfollow)
  const handleToggleConnection = async (targetUserId) => {
    // Instant Optimistic UI Update
    setConnections(prev => {
      if (prev.some(c => c.id === targetUserId)) {
        return prev.filter(c => c.id !== targetUserId)
      } else {
        const foundBuilder = builders.find(b => b.id === targetUserId)
        return foundBuilder ? [...prev, foundBuilder] : prev
      }
    })

    try {
      await toggleConnection(targetUserId)
      const connData = await fetchConnections()
      setConnections(connData)

      // Also reload follow requests to ensure state coherence
      const pendingData = await fetchPendingFollowRequests()
      setPendingRequests(pendingData)
      const sentData = await fetchSentFollowRequests()
      setSentRequests(sentData)

      if (profileUser && profileUser.id === targetUserId) {
        const resFollowing = await fetch(`${API_BASE_URL}/api/auth/following/${targetUserId}`, {
          credentials: 'include'
        }).then(r => r.json())
        const resFollowers = await fetch(`${API_BASE_URL}/api/auth/followers/${targetUserId}`, {
          credentials: 'include'
        }).then(r => r.json())
        setProfileFollowers(Array.isArray(resFollowers) ? resFollowers : [])
        setProfileFollowing(Array.isArray(resFollowing) ? resFollowing : [])
      }
    } catch (err) {
      console.error('Failed to toggle connection:', err)
      loadBuildersData()
    }
  }

  // Send follow request
  const handleSendFollowRequest = async (targetUserId) => {
    // Instant Optimistic UI Update
    setSentRequests(prev => Array.from(new Set([...prev, targetUserId])))

    try {
      await sendFollowRequest(targetUserId)
      const sentData = await fetchSentFollowRequests()
      setSentRequests(sentData)
    } catch (err) {
      console.error('Failed to send follow request:', err)
      setSentRequests(prev => prev.filter(id => id !== targetUserId))
    }
  }

  // Confirm follow request
  const handleConfirmRequest = async (requestId, senderId) => {
    try {
      await confirmFollowRequest(senderId)
      // Reload stats and builders
      loadBuildersData()
    } catch (err) {
      console.error('Failed to confirm request:', err)
    }
  }

  // Reject follow request
  const handleRejectRequest = async (requestId, senderId) => {
    try {
      await rejectFollowRequest(senderId)
      // Reload stats and builders
      loadBuildersData()
    } catch (err) {
      console.error('Failed to reject request:', err)
    }
  }

  // Camera Handlers
  const handleCameraOpen = async () => {
    setShowCameraModal(true)
    try {
      // Trigger media permissions
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
      initialStream.getTracks().forEach(track => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')

      // Prioritize physical/integrated webcams over virtual camera drivers (I2404, OBS, etc.)
      videoInputs.sort((a, b) => {
        const labelA = (a.label || '').toLowerCase()
        const labelB = (b.label || '').toLowerCase()
        const isVirtualA = labelA.includes('virtual') || labelA.includes('obs') || labelA.includes('i2404')
        const isVirtualB = labelB.includes('virtual') || labelB.includes('obs') || labelB.includes('i2404')
        if (isVirtualA && !isVirtualB) return 1
        if (!isVirtualA && isVirtualB) return -1
        return 0
      })

      setCameraDevices(videoInputs)
      if (videoInputs.length > 0) {
        setSelectedCameraId(videoInputs[0].deviceId)
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const startCameraStream = useCallback(async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
    }

    setCameraLoading(true)
    try {
      const constraints = {
        video: selectedCameraId
          ? { deviceId: { ideal: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user' }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setCameraStream(stream)

      const videoEl = document.getElementById('camera-preview-video')
      if (videoEl) {
        videoEl.srcObject = stream
        videoEl.play().catch(e => console.warn('Video play error:', e))
      }
    } catch (err) {
      console.error('Error starting camera stream:', err)
      alert('Failed to start camera feed. Please select an active physical webcam from the dropdown.')
    } finally {
      setCameraLoading(false)
    }
  }, [cameraStream, selectedCameraId])

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCameraModal(false)
  }

  const captureSnapshot = () => {
    const videoEl = document.getElementById('camera-preview-video')
    if (!videoEl) return

    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth || 640
    canvas.height = videoEl.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setCapturedImage(dataUrl)

      // Save to database
      fetch(`${API_BASE_URL}/api/auth/codelens-gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: dataUrl }),
        credentials: 'include'
      })
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Failed to save to database')
        })
        .then(savedPhoto => {
          setCapturedGallery(prev => [savedPhoto, ...prev])
        })
        .catch(err => {
          console.error('Error saving captured photo to DB:', err)
          // Fallback: add locally with a temp ID so user can still see/use it
          setCapturedGallery(prev => [{ id: `temp-${Date.now()}`, image_url: dataUrl }, ...prev])
        })

      // Convert data URL to Blob to guarantee correct file extension download support in all browsers
      try {
        const parts = dataUrl.split(',')
        const byteString = atob(parts[1])
        const mimeString = parts[0].split(':')[1].split(';')[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([ab], { type: mimeString })
        const blobUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `devgram-codelens-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Cleanup the object URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
      } catch (err) {
        console.error('Error generating photo blob download:', err)
      }
    }

    stopCameraStream()
  }

  // Handlers for gallery actions
  const handleUseCaptured = (photo) => {
    setCapturedImage(photo.image_url || photo.imageUrl || '')
    setActiveTab('feed')
  }

  const handleDeleteCaptured = async (id) => {
    try {
      if (String(id).startsWith('temp-')) {
        setCapturedGallery(prev => prev.filter(p => p.id !== id))
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/codelens-gallery/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setCapturedGallery(prev => prev.filter(p => p.id !== id))
      } else {
        alert('Failed to delete photo from database')
      }
    } catch (err) {
      console.error('Error deleting photo:', err)
    }
  }

  // Auto-switch camera stream when selected camera ID changes
  useEffect(() => {
    if ((showCameraModal || activeTab === 'codelens') && cameraStream && selectedCameraId) {
      setTimeout(() => {
        startCameraStream()
      }, 0)
    }
  }, [selectedCameraId, showCameraModal, activeTab, cameraStream, startCameraStream])

  const getSearchScore = (post, query) => {
    if (!query) return 0;
    const lowerQuery = query.toLowerCase().trim();
    let score = 0;

    // Check tags (exact or substring)
    if (post.tags && Array.isArray(post.tags)) {
      for (const tag of post.tags) {
        const lowerTag = tag.toLowerCase();
        if (lowerTag === lowerQuery) {
          score += 100;
        } else if (lowerTag.startsWith(lowerQuery)) {
          score += 50;
        } else if (lowerTag.includes(lowerQuery)) {
          score += 20;
        }
      }
    }

    // Check content
    if (post.content) {
      const lowerContent = post.content.toLowerCase();
      if (lowerContent === lowerQuery) {
        score += 80;
      } else if (lowerContent.startsWith(lowerQuery)) {
        score += 40;
      } else {
        const words = lowerContent.split(/\s+/);
        if (words.includes(lowerQuery)) {
          score += 30;
        } else if (lowerContent.includes(lowerQuery)) {
          score += 10;
        }
      }
    }

    // Check user info
    if (post.user) {
      const lowerName = (post.user.name || '').toLowerCase();
      const lowerEmail = (post.user.email || '').toLowerCase();
      if (lowerName === lowerQuery) {
        score += 15;
      } else if (lowerName.includes(lowerQuery) || lowerEmail.includes(lowerQuery)) {
        score += 5;
      }
    }

    return score;
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.user?.name && post.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.user?.email && post.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.user?.id && post.user.id.toString().includes(searchQuery.toLowerCase()))

    // Category filter
    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      post.category === selectedCategoryFilter

    return matchesSearch && matchesCategory
  })

  // Sort filtered posts by search relevance score, falling back to newest first
  const sortedFilteredPosts = [...filteredPosts].sort((a, b) => {
    if (!searchQuery) return 0;
    const scoreA = getSearchScore(a, searchQuery);
    const scoreB = getSearchScore(b, searchQuery);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  })

  // Format date helper
  const formatDate = (dateString) => {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'just now'

    const diffMs = new Date() - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }


  // Render @mentions as clickable links
  const renderMentions = (text) => {
    if (!text) return text
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g)
    return parts.map((part, i) => {
      if (part.match(/^@[a-zA-Z0-9_]+$/)) {
        const username = part.slice(1)
        const mentionedUser = builders.find(b => b.username === username)
        return (
          <span
            key={i}
            style={{ color: '#818cf8', fontWeight: '600', cursor: mentionedUser ? 'pointer' : 'default' }}
            onClick={(e) => {
              if (mentionedUser) {
                e.stopPropagation()
                setProfileUser(mentionedUser)
              }
            }}
          >{part}</span>
        )
      }
      return part
    })
  }

  return (
    <div className="devgram-home-layout">
      {/* SVG Defs for Bottom-Left to Top-Right Gradient Shade on Logos & Icons */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <linearGradient id="devgram-gradient" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#818cf8" />
            <stop offset="70%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>

      {/* 1. Left Sidebar Navigation (DevGram Collapsible Auto-Hide Style) */}
      <aside className={`sidebar-container ${sidebarPinned ? 'expanded' : ''}`}>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: '100%', padding: '12px 0', boxSizing: 'border-box' }}>
          {/* Top Items Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
            {/* Item 1: App Logo (Top - Increased Size) */}
            <div
              className="devgram-nav-btn logo-btn"
              onClick={() => setSidebarPinned(!sidebarPinned)}
              style={{ cursor: 'pointer', marginBottom: '4px' }}
              title="DevGram"
            >
              <DevGramLogo size={38} />
              <span className="nav-text" style={{ fontWeight: '800', fontSize: '1.25rem', color: '#ffffff' }}>DevGram</span>
            </div>

            {/* Item 2: Home */}
            <button
              type="button"
              className={`devgram-nav-btn ${!profileUser && activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => { setProfileUser(null); setActiveTab('feed'); setSelectedCategoryFilter('all'); }}
              title="Home"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill={!profileUser && activeTab === 'feed' ? 'url(#devgram-gradient)' : 'none'} stroke="url(#devgram-gradient)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-5a3 3 0 0 0-6 0v5H5a2 2 0 0 1-2-2V10.5z" />
              </svg>
              <span className="nav-text">Home</span>
            </button>

            {/* Item 3: Reels */}
            <button
              type="button"
              className={`devgram-nav-btn ${!profileUser && activeTab === 'reels' ? 'active' : ''}`}
              onClick={() => { setProfileUser(null); setActiveTab('reels'); }}
              title="Reels"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span className="nav-text">Reels</span>
            </button>

            {/* Item 4: Messages (Paper Airplane Icon with Red Notification Dot Badge) */}
            <button
              type="button"
              className={`devgram-nav-btn ${!profileUser && activeTab === 'direct' ? 'active' : ''}`}
              onClick={() => { setProfileUser(null); setActiveTab('direct'); }}
              title="Messages"
            >
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={!profileUser && activeTab === 'direct' ? 'url(#devgram-gradient)' : 'none'} stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {(Object.keys(chatMessagesMap).length > 0 || connections.length > 0) && (
                  <span
                    className="msg-red-dot-badge"
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#ff3040',
                      borderRadius: '50%',
                      border: '2px solid #09090b',
                      boxShadow: '0 0 8px rgba(255, 48, 64, 0.9)'
                    }}
                  />
                )}
              </div>
              <span className="nav-text">Messages</span>
            </button>

            {/* Item 5: Search */}
            <button
              type="button"
              className={`devgram-nav-btn ${!profileUser && activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => { setProfileUser(null); setActiveTab('explore'); }}
              title="Search"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="nav-text">Search</span>
            </button>

            {/* Item 6: Notifications (Heart with Red Notification Dot Badge) */}
            <button
              type="button"
              className={`devgram-nav-btn ${!profileUser && activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => { setProfileUser(null); setActiveTab('notifications'); }}
              title="Notifications"
            >
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={!profileUser && activeTab === 'notifications' ? 'url(#devgram-gradient)' : 'none'} stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {(pendingRequests.length > 0 || notifications.length > 0) && (
                  <span
                    className="notif-red-dot-badge"
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#ff3040',
                      borderRadius: '50%',
                      border: '2px solid #09090b',
                      boxShadow: '0 0 8px rgba(255, 48, 64, 0.9)'
                    }}
                  />
                )}
              </div>
              <span className="nav-text">Notifications</span>
            </button>

            {/* Item 7: Create (Gradient Monitor Canvas Icon) */}
            <button
              type="button"
              className="devgram-nav-btn"
              onClick={() => setShowCreateModal(true)}
              title="Create Post"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.4))' }}>
                <rect x="2" y="3" width="20" height="14" rx="3" ry="3" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M14 7l4 4-6 6H8v-4l6-6z" />
              </svg>
              <span className="nav-text">Create</span>
            </button>

            {/* Item 8: Dashboard (Analytics Monitor - Only rendered if Professional Account) */}
            {isProfessionalAccount && (
              <button
                type="button"
                className={`devgram-nav-btn ${!profileUser && activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setProfileUser(null); setActiveTab('dashboard'); }}
                title="Dashboard"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  {/* Monitor Frame */}
                  <rect x="2" y="3" width="15" height="11" rx="2" ry="2" />
                  <line x1="6" y1="18" x2="13" y2="18" />
                  <line x1="9.5" y1="14" x2="9.5" y2="18" />
                  {/* Line Graph inside Screen */}
                  <polyline points="4.5 10 7.5 7 10.5 9 13.5 5.5" />
                  <circle cx="4.5" cy="10" r="0.8" fill="url(#devgram-gradient)" />
                  <circle cx="7.5" cy="7" r="0.8" fill="url(#devgram-gradient)" />
                  <circle cx="10.5" cy="9" r="0.8" fill="url(#devgram-gradient)" />
                  <circle cx="13.5" cy="5.5" r="0.8" fill="url(#devgram-gradient)" />
                  {/* Clock Circle Badge on Bottom Right */}
                  <circle cx="17.5" cy="16.5" r="4.5" fill="#09090b" stroke="url(#devgram-gradient)" strokeWidth="2" />
                  <polyline points="17.5 14 17.5 16.5 19 16.5" />
                </svg>
                <span className="nav-text">Dashboard</span>
              </button>
            )}

            {/* Item 9: Profile Avatar */}
            <button
              type="button"
              className={`devgram-nav-btn ${profileUser?.id === activeUser?.id ? 'active' : ''}`}
              onClick={() => activeUser && setProfileUser(activeUser)}
              title="Profile"
            >
              <img
                className="devgram-avatar-icon"
                src={activeUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={activeUser?.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #818cf8', flexShrink: 0 }}
              />
              <span className="nav-text">Profile</span>
            </button>
          </div>

          {/* Item 10: More (3-Line Rounded Hamburger Icon from User Screenshot - Positioned strictly at Bottom) */}
          <div style={{ width: '100%', position: 'relative' }}>
            <button
              type="button"
              className={`devgram-nav-btn ${showMoreMenu ? 'active' : ''}`}
              onClick={() => setShowMoreMenu(prev => !prev)}
              title="More Options"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', minWidth: '28px', minHeight: '28px' }}>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="nav-text">More</span>
            </button>

            {showMoreMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '10px',
                background: '#09090b',
                border: '1px solid #1f1f23',
                borderRadius: '14px',
                width: '200px',
                padding: '8px',
                zIndex: 99999,
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  🚪 Log Out / Switch
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>


      {/* 2. Main Middle Feed */}
      <main className="feed-container">
        {activeTab === 'edit-profile' ? (
          <div className="edit-profile-page" style={{ padding: '24px 32px', maxWidth: '680px', margin: '0 auto' }}>
            {/* Header with Clean Inline Back Arrow Button */}
            <div className="devgram-back-header">
              <button
                type="button"
                onClick={() => {
                  if (activeUser) {
                    setProfileUser(activeUser);
                  }
                  setActiveTab('feed');
                }}
                className="devgram-inline-back-btn"
                title="Go Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>Edit Profile</h2>
            </div>

            {/* Top Avatar Card matching Image 2 */}
            <div style={{
              background: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={profileAvatarPreview || activeUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={activeUser?.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f46e5' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', color: '#ffffff', fontWeight: '700' }}>
                    {editProfileUsername || activeUser?.username || 'mind.snap0'}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                    {editProfileTitle || editProfileName || activeUser?.name || 'Psychology Hub'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPhotoPickerModal(true)}
                style={{
                  background: '#4f46e5',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                Change photo
              </button>
            </div>

            {/* Form Fields matching Image 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field: Website */}
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>Website</label>
                <input
                  type="text"
                  value={editProfileWebsite}
                  onChange={(e) => setEditProfileWebsite(e.target.value)}
                  placeholder="Website"
                  style={{
                    width: '100%',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', color: '#71717a', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Editing your links is available on web & mobile. Customize your profile link.
                </p>
              </div>

              {/* Field: Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>Bio</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={3}
                    value={editProfileBio}
                    onChange={(e) => setEditProfileBio(e.target.value.slice(0, 150))}
                    placeholder="Bio"
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      paddingBottom: '32px',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', bottom: '10px', right: '16px', fontSize: '0.8rem', color: '#71717a' }}>
                    {editProfileBio.length} / 150
                  </span>
                </div>
              </div>

              {/* Additional optional handle & title inputs */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Display Name</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    placeholder="Anil Kumar"
                    style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: '#ffffff', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Username Handle</label>
                  <input
                    type="text"
                    value={editProfileUsername}
                    onChange={(e) => setEditProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="mind.snap0"
                    style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              </div>

              {profileSaveError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{profileSaveError}</div>
              )}

              {/* Submit Button */}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={async () => {
                    try {
                      setSavingProfile(true)
                      setProfileSaveError('')
                      const res = await updateProfile({
                        name: editProfileName,
                        username: editProfileUsername,
                        avatar: profileAvatarPreview,
                        bio: editProfileBio,
                        title: editProfileTitle,
                        website: editProfileWebsite,
                        statusNote: editProfileStatusNote,
                        showDevBadge: editShowDevBadge,
                        isAiCreator: editIsAiCreator
                      })
                      const updatedUser = res.user
                      if (activeUser) {
                        Object.assign(activeUser, updatedUser)
                      }
                      setBuilders(prev => prev.map(b => b.id === updatedUser.id ? { ...b, ...updatedUser } : b))
                      setProfileUser(updatedUser)
                      setActiveTab('feed')
                      alert('✅ Profile changes saved successfully!')
                    } catch (err) {
                      setProfileSaveError(err.message)
                    } finally {
                      setSavingProfile(false)
                    }
                  }}
                  style={{
                    background: '#4f46e5',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
                  }}
                >
                  {savingProfile ? 'Submitting...' : 'Submit / Save'}
                </button>
              </div>
            </div>
          </div>
        ) : profileUser ? (
          <div className="profile-view-container">
            {/* Clean Inline Header with Back Button */}
            <div className="devgram-back-header">
              <button
                type="button"
                onClick={() => { setProfileUser(null); setActiveTab('feed'); }}
                className="devgram-inline-back-btn"
                title="Back to Feed"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#devgram-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                {profileUser.id === activeUser?.id ? 'Your Profile' : profileUser.name}
              </h2>
            </div>

            {/* Profile Hero Card matching user screenshot */}
            <div className="profile-hero-card-v2" style={{ background: '#09090b', border: '1px solid #1f1f23', borderRadius: '14px', padding: '18px 20px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '22px', alignItems: 'flex-start' }}>
                {/* Left: Avatar */}
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={profileUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={profileUser.name}
                    style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #1f1f23', background: '#18181b' }}
                  />
                </div>

                {/* Right: Info Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Row 1: Display Name */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                      {profileUser.name || profileUser.username}
                    </h2>
                  </div>

                  {/* Row 2: Handle Tag (@username) */}
                  <div style={{ fontSize: '0.92rem', color: '#818cf8', fontWeight: '600' }}>
                    @{profileUser.username || profileUser.name.toLowerCase().replace(/\s+/g, '.')}
                  </div>

                  {/* Row 3: Stat counters inline */}
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.92rem', color: '#f4f4f5', margin: '4px 0' }}>
                    <span><strong style={{ fontWeight: '700' }}>{posts.filter(p => p.user?.id === profileUser.id).length}</strong> posts</span>
                    <span onClick={() => setSocialModalType('followers')} style={{ cursor: 'pointer' }}><strong style={{ fontWeight: '700' }}>{profileFollowers.length}</strong> followers</span>
                    <span onClick={() => setSocialModalType('following')} style={{ cursor: 'pointer' }}><strong style={{ fontWeight: '700' }}>{profileFollowing.length}</strong> following</span>
                  </div>

                  {/* Row 4: Bio text */}
                  {profileUser.bio && (
                    <div style={{ fontSize: '0.9rem', color: '#d4d4d8', whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                      {profileUser.bio}
                    </div>
                  )}

                  {/* Row 5: Website Link (Only rendered if website URL exists) */}
                  {profileUser.website && (
                    <div style={{ fontSize: '0.88rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span>🔗</span>
                      <a
                        href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {profileUser.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 6: Wide Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                {profileUser.id === activeUser?.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditProfile(profileUser)}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('View Archive: Displaying your saved & archived build posts.')}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      View archive
                    </button>
                  </>
                ) : (
                  <>
                    {connections.some(c => c.id === profileUser.id) ? (
                      <button
                        type="button"
                        onClick={() => handleToggleConnection(profileUser.id)}
                        style={{
                          flex: 1,
                          height: '36px',
                          background: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#ef4444',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Following
                      </button>
                    ) : sentRequests.includes(profileUser.id) ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          flex: 1,
                          height: '36px',
                          background: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#a1a1aa',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}
                      >
                        Requested
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendFollowRequest(profileUser.id)}
                        style={{
                          flex: 1,
                          height: '36px',
                          background: '#818cf8',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Follow
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (profileUser) {
                          setSelectedChatUser(profileUser)
                          setProfileUser(null)
                          setActiveTab('direct')
                        }
                      }}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="posts-list">
              {posts.filter((p) => p.user?.id === profileUser.id).length === 0 ? (
                <div className="feed-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                  <h3>No builds shipped yet</h3>
                  <p>This user hasn't posted any updates to their timeline.</p>
                </div>
              ) : (
                posts.filter((p) => p.user?.id === profileUser.id).map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onAuthorClick={() => post.user && setProfileUser(post.user)}
                  />
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'codelens' ? (
          <div className="codelens-view-container">
            <div className="explore-hero-banner green">
              <div>
                <h2 className="hero-title">CodeLens Interactive Sandbox</h2>
                <p className="hero-desc">Open your system camera stream directly in the webpage below, capture a snapshot, and append it as a post.</p>
              </div>
            </div>

            <div className="card-panel">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#a1a1aa' }}>Select Camera Input Device</label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="modal-select"
                >
                  {cameraDevices.map((dev, i) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                  {cameraDevices.length === 0 && (
                    <option value="">No cameras detected</option>
                  )}
                </select>
              </div>

              {/* Embedded video preview viewport */}
              <div className="camera-preview-panel video">
                {cameraStream ? (
                  <video id="camera-preview-video" autoPlay playsInline className="camera-preview-video" />
                ) : (
                  <div className="camera-preview-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                    <span className="hero-desc">CodeLens Web Camera is inactive</span>
                  </div>
                )}

                {cameraLoading && (
                  <div className="overlay-dim"><div className="spinner"></div></div>
                )}
              </div>

              <div className="card-actions">
                {!cameraStream ? (
                  <button
                    type="button"
                    onClick={startCameraStream}
                    className="modal-action-button primary"
                  >
                    Open Camera
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={stopCameraStream} className="modal-action-button danger">Close Camera</button>
                    <button type="button" onClick={captureSnapshot} className="modal-action-button primary">Capture Photo</button>
                  </>
                )}
              </div>

              {capturedImage && (
                <div className="composer-captured-preview">
                  <label className="modal-label">Captured Photo Preview</label>
                  <div className="composer-captured-image">
                    <img src={capturedImage} alt="Captured build preview" />
                    <button type="button" onClick={() => setCapturedImage('')} className="image-close-button">&times;</button>
                  </div>
                  <p className="hero-desc">✅ Image attached successfully! Navigate back to the <strong>Feed</strong> to compose and ship your post.</p>
                </div>
              )}
            </div>

            {/* Captured Gallery Section */}
            {capturedGallery.length > 0 && (
              <div className="card-panel">
                <h3 className="modal-title">🖼️ Gallery <span className="modal-label">({capturedGallery.length} {capturedGallery.length === 1 ? 'photo' : 'photos'} captured)</span></h3>
                <div className="gallery-grid">
                  {capturedGallery.map((photo, idx) => (
                    <div key={photo.id || idx} className="gallery-item">
                      <img src={photo.image_url} alt={`Captured ${idx}`} />
                      <div className="gallery-overlay">
                        <button type="button" onClick={() => handleUseCaptured(photo)} className="gallery-action-btn use">Use</button>
                        <button type="button" onClick={() => handleDeleteCaptured(photo.id || idx)} className="gallery-action-btn delete">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'explore' ? (
          <div className="explore-view-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            {/* Search Builders Input */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="Search builders by username or name..."
                value={userSearchVal}
                onChange={(e) => { setUserSearchVal(e.target.value); setSearchPage(0); }}
                style={{
                  background: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.95rem',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  boxSizing: 'border-box'
                }}
              />
              {userSearchVal && (
                <button
                  type="button"
                  onClick={() => setUserSearchVal('')}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1.4rem'
                  }}
                >
                  &times;
                </button>
              )}
            </div>

            {/* Search Results / Discover Builders */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '16px', marginTop: 0 }}>
                {userSearchVal ? 'Search Results' : 'Discover Builders'}
              </h3>

              {(() => {
                const targetBuilders = userSearchVal ? builders.filter(b => {
                  if (b.id === activeUser?.id) return false;
                  const query = userSearchVal.toLowerCase();
                  if (query === '@') return true;
                  const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
                  return (
                    (b.username && b.username.toLowerCase().includes(cleanQuery)) ||
                    (b.name && b.name.toLowerCase().includes(cleanQuery))
                  );
                }) : randomExploreBuilders;

                if (targetBuilders.length === 0) {
                  return <p style={{ color: '#71717a', fontSize: '0.9rem' }}>No builders found.</p>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {targetBuilders.map(builder => (
                      <div
                        key={builder.id}
                        onClick={() => setProfileUser(builder)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.02)', border: '1px solid #1f1f23',
                          borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        className="explore-builder-row"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={builder.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={builder.name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff' }}>{builder.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#818cf8' }}>@{builder.username || 'builder'}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="badge-pill"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileUser(builder);
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : activeTab === 'reels' ? (
          <div className="reels-view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px', margin: '0 auto', padding: '16px 0', boxSizing: 'border-box' }}>
            {/* Header Banner */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🎬</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: '700', letterSpacing: '-0.01em' }}>Reels</h3>
              </div>
              {userReels.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: currentReelIdx >= userReels.length ? '#c084fc' : '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                  {currentReelIdx >= userReels.length ? `🔀 Endless Loop (${(currentReelIdx % userReels.length) + 1}/${userReels.length})` : `▶ ${currentReelIdx + 1}/${userReels.length}`}
                </div>
              )}
            </div>

            {userReels.length === 0 ? (
              /* Ultra Clean Modern Empty State */
              <div className="reels-empty-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '440px', textAlign: 'center', padding: '48px 24px', background: '#09090b', border: '1px solid #1f1f23', borderRadius: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, rgba(9, 9, 11, 0.8) 100%)', border: '1px solid rgba(129, 140, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', marginBottom: '20px', boxShadow: '0 0 30px rgba(79, 70, 229, 0.25)' }}>
                  🎬
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  No Reels Yet
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.88rem', color: '#a1a1aa', maxWidth: '340px', lineHeight: '1.5' }}>
                  Be the first developer to share a code reel update or build demo video!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('reel');
                    setShowCreateModal(true);
                  }}
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', border: 'none', color: '#ffffff', padding: '11px 24px', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)', transition: 'transform 0.15s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  + Create Reel
                </button>
              </div>
            ) : (
              /* Dynamic Database User Reel Card */
              (() => {
                const activeReel = userReels[currentReelIdx % userReels.length];
                const userLikesIt = activeUser && activeReel.likes?.includes(activeUser.id);
                return (
                  <>
                    <div className="reel-card-viewport" style={{ position: 'relative', width: '100%', height: '600px', background: '#000000', borderRadius: '20px', border: '1px solid #27272a', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 12px 36px rgba(0,0,0,0.6)' }}>
                      {/* Video/Image Backdrop or Code Snippet */}
                      <div style={{ position: 'absolute', inset: 0, background: activeReel.imageUrl ? `url(${activeReel.imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
                        {!activeReel.imageUrl && (
                          <div style={{ width: '100%', background: 'rgba(9, 9, 11, 0.88)', backdropFilter: 'blur(12px)', border: '1px solid #27272a', borderRadius: '14px', padding: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#f4f4f5', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '8px', marginBottom: '12px', color: '#818cf8', fontWeight: '700' }}>
                              <span>⚡ Code Snippet</span>
                              <span style={{ color: '#a1a1aa' }}>Reel</span>
                            </div>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#e4e4e7' }}>
                              {activeReel.codeSnippet || activeReel.content}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Top Overlay Badge */}
                      <div style={{ zIndex: 5, padding: '16px', display: 'flex', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                        <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '600', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '12px' }}>
                          🎬 User Reel
                        </span>
                        <button
                          type="button"
                          onClick={() => setReelsMuted(!reelsMuted)}
                          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #27272a', borderRadius: '50%', width: '34px', height: '34px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {reelsMuted ? '🔇' : '🔊'}
                        </button>
                      </div>

                      {/* Right Side Engagement Column */}
                      <div style={{ position: 'absolute', right: '14px', bottom: '90px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleLikePost(activeReel._id)}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '44px', height: '44px', color: userLikesIt ? '#f43f5e' : '#ffffff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
                        >
                          {userLikesIt ? '❤️' : '⭐'}
                        </button>
                        <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: '700', marginTop: '-12px' }}>
                          {activeReel.likes?.length || 0}
                        </span>

                        <button
                          type="button"
                          onClick={() => { if (activeReel.user) setProfileUser(activeReel.user); }}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '44px', height: '44px', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          💬
                        </button>
                        <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: '700', marginTop: '-12px' }}>
                          {activeReel.comments?.length || 0}
                        </span>
                      </div>

                      {/* Bottom Info Bar */}
                      <div style={{ zIndex: 5, padding: '20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <img src={activeReel.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #818cf8', cursor: 'pointer' }} onClick={() => activeReel.user && setProfileUser(activeReel.user)} />
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff', cursor: 'pointer' }} onClick={() => activeReel.user && setProfileUser(activeReel.user)}>{activeReel.user?.name || 'Developer'}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#818cf8' }}>@{activeReel.user?.username || 'builder'}</span>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f4f4f5', lineHeight: '1.4' }}>
                          {activeReel.content}
                        </p>
                      </div>
                    </div>

                    {/* Prev / Next Controls */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                      <button
                        type="button"
                        disabled={currentReelIdx === 0}
                        onClick={handlePrevReel}
                        style={{ flex: 1, padding: '10px', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', color: '#ffffff', fontWeight: '600', cursor: currentReelIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentReelIdx === 0 ? 0.5 : 1 }}
                      >
                        ▲ Previous Reel
                      </button>
                      <button
                        type="button"
                        onClick={handleNextReel}
                        style={{ flex: 1, padding: '10px', background: '#4f46e5', border: 'none', borderRadius: '10px', color: '#ffffff', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                      >
                        ▼ Next Reel {currentReelIdx >= userReels.length - 1 ? '(Endless Loop 🔀)' : ''}
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        ) : activeTab === 'direct' ? (
          <div className="direct-view-container" style={{ display: 'flex', height: 'calc(100vh - 40px)', width: '100%', maxWidth: '960px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
            {connections.length === 0 && chatConversations.length === 0 && builders.length === 0 ? (
              /* Empty Messages State */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px', background: '#09090b', border: '1px solid #1f1f23', borderRadius: '16px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#818cf8', marginBottom: '16px' }}>
                  💬
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: '800', color: '#ffffff' }}>No Direct Messages Yet</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#a1a1aa', maxWidth: '380px', lineHeight: '1.5' }}>
                  Your inbox is currently empty. Connect and follow other developers to start direct messaging and sharing code updates!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  style={{ background: '#4f46e5', border: 'none', color: '#ffffff', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)' }}
                >
                  Discover Builders
                </button>
              </div>
            ) : (
              /* Dual Pane Messaging UI */
              <div style={{ display: 'flex', width: '100%', height: '100%', background: '#09090b', border: '1px solid #1f1f23', borderRadius: '16px', overflow: 'hidden' }}>
                {/* Left: Chat User List */}
                <div style={{ width: '280px', borderRight: '1px solid #1f1f23', display: 'flex', flexDirection: 'column', background: '#08080a' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: '700' }}>Messages</h3>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                      {Array.from(new Set([...chatConversations.map(c => c.id), ...connections.map(c => c.id), ...builders.filter(b => b.id !== activeUser?.id).map(b => b.id)])).length} Builders
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(() => {
                      const allChatUsersMap = new Map()
                      chatConversations.forEach(c => allChatUsersMap.set(c.id, { ...c, lastMsg: c.lastMessage }))
                      connections.forEach(u => {
                        if (!allChatUsersMap.has(u.id)) {
                          allChatUsersMap.set(u.id, { ...u, lastMsg: `@${u.username || u.name}` })
                        }
                      })
                      builders.filter(b => b.id !== activeUser?.id).forEach(u => {
                        if (!allChatUsersMap.has(u.id)) {
                          allChatUsersMap.set(u.id, { ...u, lastMsg: `@${u.username || u.name}` })
                        }
                      })
                      const userList = Array.from(allChatUsersMap.values())

                      return userList.map((user) => {
                        const targetId = String(user.id || user._id)
                        const isSelected = String(selectedChatUser?.id || selectedChatUser?._id) === targetId

                        return (
                          <div
                            key={targetId}
                            onClick={() => setSelectedChatUser(user)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer',
                              background: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #818cf8' : '3px solid transparent',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                              <span style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '11px',
                                height: '11px',
                                borderRadius: '50%',
                                background: user.isOnline ? '#22c55e' : '#71717a',
                                border: '2px solid #08080a',
                                boxShadow: user.isOnline ? '0 0 8px rgba(34, 197, 94, 0.9)' : 'none'
                              }} title={user.isOnline ? 'Online' : 'Offline'} />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                                <span style={{ fontSize: '0.7rem', color: user.isOnline ? '#4ade80' : '#71717a', fontWeight: '600' }}>
                                  {user.isOnline ? '🟢 Online' : '⚪ Offline'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chatMessagesMap[targetId]?.slice(-1)[0]?.text || user.lastMsg || `@${user.username}`}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Right: Message Window */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
                  {selectedChatUser ? (
                    <>
                      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1f1f23', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={selectedChatUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '11px',
                            height: '11px',
                            borderRadius: '50%',
                            background: selectedChatUser.isOnline ? '#22c55e' : '#71717a',
                            border: '2px solid #09090b',
                            boxShadow: selectedChatUser.isOnline ? '0 0 8px rgba(34, 197, 94, 0.9)' : 'none'
                          }} />
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff' }}>{selectedChatUser.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: selectedChatUser.isOnline ? '#4ade80' : '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {selectedChatUser.isOnline ? '🟢 Active Now' : '⚪ Offline'} • @{selectedChatUser.username || 'builder'}
                          </span>
                        </div>
                      </div>

                      {/* Chat Messages Log */}
                      {(() => {
                        const targetPartnerId = selectedChatUser.id || selectedChatUser._id
                        const activeMessages = (chatMessagesMap[targetPartnerId] || chatMessagesMap[String(targetPartnerId)] || [])

                        return (
                          <>
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {activeMessages.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.85rem', margin: 'auto' }}>Say hi to start the conversation! 🚀</p>
                              ) : (
                                activeMessages.map((msg, i) => {
                                  const myIds = [
                                    activeUser?.id,
                                    activeUser?._id,
                                    activeUser?.userId,
                                    activeUser?.uid
                                  ].filter(Boolean).map(String)

                                  const senderIds = [
                                    msg.senderId,
                                    msg.sender?._id,
                                    msg.sender?.id,
                                    msg.sender
                                  ].filter(Boolean).map(String)

                                  const isMe = myIds.some((myId) => senderIds.includes(myId))

                                  return (
                                    <div
                                      key={msg.id || msg._id || i}
                                      style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '75%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start',
                                        gap: '4px'
                                      }}
                                    >
                                      <div style={{ fontSize: '0.72rem', color: isMe ? '#818cf8' : '#a1a1aa', padding: '0 4px', fontWeight: '600' }}>
                                        {isMe ? 'You' : (selectedChatUser.name || 'Partner')}
                                      </div>
                                      <div
                                        style={{
                                          background: isMe
                                            ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                                            : '#18181b',
                                          border: isMe ? 'none' : '1px solid #27272a',
                                          color: '#ffffff',
                                          padding: '11px 16px',
                                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                          fontSize: '0.9rem',
                                          lineHeight: '1.45',
                                          wordBreak: 'break-word',
                                          boxShadow: isMe ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none'
                                        }}
                                      >
                                        {msg.text}
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!chatInputText.trim() || !selectedChatUser) return;
                                const messageText = chatInputText.trim();
                                setChatInputText('');
                                const tempMsg = { id: `temp-${Date.now()}`, senderId: activeUser?.id || activeUser?._id, text: messageText, createdAt: new Date().toISOString() };
                                setChatMessagesMap(prev => ({
                                  ...prev,
                                  [targetPartnerId]: [...(prev[targetPartnerId] || []), tempMsg]
                                }));
                                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

                                try {
                                  const res = await fetch(`${API_BASE_URL}/api/messages/${targetPartnerId}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ text: messageText })
                                  })
                                  if (res.ok) {
                                    const savedMsg = await res.json()
                                    setChatMessagesMap(prev => ({
                                      ...prev,
                                      [targetPartnerId]: (prev[targetPartnerId] || []).map(m => m.id === tempMsg.id ? savedMsg : m)
                                    }))
                                    fetchConversations()
                                  }
                                } catch (err) {
                                  console.warn('Send message error:', err)
                                }
                              }}
                              style={{ padding: '16px', borderTop: '1px solid #1f1f23', display: 'flex', gap: '10px' }}
                            >
                              <input
                                type="text"
                                placeholder={`Message ${selectedChatUser.name}...`}
                                value={chatInputText}
                                onChange={(e) => setChatInputText(e.target.value)}
                                style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: '#ffffff', outline: 'none' }}
                              />
                              <button type="submit" style={{ background: '#4f46e5', border: 'none', color: '#ffffff', padding: '0 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                                Send
                              </button>
                            </form>
                          </>
                        )
                      })()}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#71717a', fontSize: '0.9rem' }}>
                      Select a conversation to start messaging
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="notifications-view-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '640px', margin: '0 auto', padding: '20px 16px', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', marginBottom: '20px', margin: 0 }}>
              Notifications & Activity
            </h2>

            {/* Follow Requests Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#818cf8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Follow Requests ({pendingRequests.length})
              </h3>

              {pendingRequests.length === 0 ? (
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f23', borderRadius: '12px', color: '#71717a', fontSize: '0.85rem' }}>
                  No pending follow requests.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id || req._id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid #1f1f23',
                        borderRadius: '12px', padding: '12px 16px'
                      }}
                    >
                      {/* Left: User Profile Photo & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={req.name}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #818cf8' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#ffffff' }}>{req.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>@{req.username} • sent a follow request</div>
                        </div>
                      </div>

                      {/* Right: Accept / Deny Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleConfirmRequest(req.id || req._id, req.id || req._id)}
                          style={{
                            background: '#4f46e5', border: 'none', color: '#ffffff',
                            padding: '8px 16px', borderRadius: '8px', fontWeight: '700',
                            fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                          }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.id || req._id, req.id || req._id)}
                          style={{
                            background: '#18181b', border: '1px solid #27272a', color: '#ef4444',
                            padding: '8px 14px', borderRadius: '8px', fontWeight: '600',
                            fontSize: '0.82rem', cursor: 'pointer'
                          }}
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Notifications Feed */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a1a1aa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Recent Activity
              </h3>
              {notifications.length === 0 ? (
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f23', borderRadius: '12px', color: '#71717a', fontSize: '0.85rem' }}>
                  You're all caught up! No recent activity notifications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f23', borderRadius: '10px' }}>
                      <span>🔔</span>
                      <div style={{ flex: 1, fontSize: '0.88rem', color: '#f4f4f5' }}>{n.message || n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="dashboard-view-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '820px', margin: '0 auto', padding: '20px 16px', width: '100%', boxSizing: 'border-box' }}>
            {!isProfessionalAccount ? (
              /* Restricted Access Banner */
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#09090b', border: '1px solid #1f1f23', borderRadius: '16px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>Professional Dashboard Locked</h3>
                <p style={{ fontSize: '0.9rem', color: '#a1a1aa', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Switch to a DevGram Professional Creator Account to unlock build analytics, code reach metrics, and developer profile insights.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfessionalAccount(true);
                    alert('🎉 Congratulations! Your account is now a Professional Creator Account. Access granted!');
                  }}
                  style={{ background: 'linear-gradient(45deg, #4f46e5, #9333ea)', border: 'none', color: '#ffffff', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)' }}
                >
                  Upgrade to Professional Account (Free)
                </button>
              </div>
            ) : (
              /* Full Professional Dashboard */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#ffffff' }}>Professional Developer Dashboard</h2>
                    <span style={{ fontSize: '0.82rem', color: '#818cf8' }}>⚡ Creator Insights & Code Analytics</span>
                  </div>
                  <span style={{ background: 'rgba(79, 70, 229, 0.15)', border: '1px solid #4f46e5', color: '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                    ✓ Professional Account Active
                  </span>
                </div>

                {/* 4 Stat Metric Cards (Real-time database metrics) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div style={{ background: '#121215', border: '1px solid #1f1f23', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Code Impressions</span>
                    <strong style={{ fontSize: '1.3rem', color: '#ffffff', display: 'block' }}>{totalRealImpressions}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>⚡ Realtime Reach</span>
                  </div>
                  <div style={{ background: '#121215', border: '1px solid #1f1f23', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Profile Visits</span>
                    <strong style={{ fontSize: '1.3rem', color: '#ffffff', display: 'block' }}>{totalRealProfileVisits}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>👤 Live Engagement</span>
                  </div>
                  <div style={{ background: '#121215', border: '1px solid #1f1f23', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Stars Received</span>
                    <strong style={{ fontSize: '1.3rem', color: '#ffffff', display: 'block' }}>{totalRealStars}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>⭐ Real Likes</span>
                  </div>
                  <div style={{ background: '#121215', border: '1px solid #1f1f23', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Forks Created</span>
                    <strong style={{ fontSize: '1.3rem', color: '#ffffff', display: 'block' }}>{totalRealForks}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>🍴 Real Shares</span>
                  </div>
                </div>

                {/* Real-time Tech Stack Distribution */}
                <div style={{ background: '#121215', border: '1px solid #1f1f23', padding: '20px', borderRadius: '14px' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#ffffff', fontWeight: '700' }}>Audience Tech Stack Interest (Live Tag Analysis)</h3>
                  {realTechStackStats.length === 0 ? (
                    <div style={{ color: '#71717a', fontSize: '0.85rem', padding: '12px 0', lineHeight: '1.5' }}>
                      No tech stack tags recorded in your posts yet. Add tags like <span style={{ color: '#818cf8', fontWeight: '600' }}>#react</span>, <span style={{ color: '#22c55e', fontWeight: '600' }}>#node</span>, or <span style={{ color: '#eab308', fontWeight: '600' }}>#python</span> when shipping build posts to analyze live interest!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {realTechStackStats.map((item, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d4d4d8', marginBottom: '4px' }}>
                            <span>{item.name}</span>
                            <strong>{item.percentage}%</strong>
                          </div>
                          <div style={{ height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.percentage}%`, height: '100%', background: item.color, transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', margin: '0', padding: '0 40px 0 24px', boxSizing: 'border-box' }}>
            {/* Top Full Width Header Line */}
            <header className="feed-app-header-stylish" style={{ width: '100%', padding: '12px 0 10px 0', borderBottom: '1px solid #1f1f23', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'visible' }}>
              <h1 style={{
                margin: 0,
                fontSize: '2.6rem',
                fontWeight: '500',
                fontFamily: "'Grand Hotel', 'Great Vibes', 'Dancing Script', cursive",
                background: 'linear-gradient(45deg, #ffffff 0%, #818cf8 40%, #c084fc 75%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '1px',
                filter: 'drop-shadow(0 0 16px rgba(192, 132, 252, 0.4))',
                lineHeight: '1.25',
                paddingBottom: '4px',
                overflow: 'visible'
              }}>
                Devgram
              </h1>
            </header>

            {/* Two Column Container Below Full Header */}
            <div style={{ display: 'flex', gap: '40px', width: '100%', justifyContent: 'space-between' }}>
              {/* Left Main Feed Column (~65%, max-w-2xl) */}
              <div style={{ flex: 1, maxWidth: '630px', width: '100%' }}>
                {/* Stories Bar Component */}
                <StoriesBar activeUser={activeUser} />

                {/* Error State */}
                {error && (
                  <div className="feed-alert error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span>{error}</span>
                    <button className="retry-btn" onClick={loadPostsData}>Retry Connection</button>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="feed-loading">
                    <div className="spinner"></div>
                    <span>Fetching builds from DevGram network...</span>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="feed-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    <h3>No builds found</h3>
                    <p>Try sharing your own build update or change your search filter!</p>
                  </div>
                ) : (
                  <div className="posts-list">
                    {sortedFilteredPosts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onAuthorClick={() => post.user && setProfileUser(post.user)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Sidebar Below Header (~35%, hidden on mobile) */}
              <aside className="feed-right-sidebar" style={{ width: '320px', flexShrink: 0, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '20px', marginLeft: 'auto' }}>
                {/* Current User Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => activeUser && setProfileUser(activeUser)}>
                    <img src={activeUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#ffffff', fontWeight: '700' }}>@{activeUser?.username || 'user'}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{activeUser?.name || 'Developer'}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8', cursor: 'pointer' }} onClick={onLogout}>Switch</span>
                </div>

                {/* Suggested For You */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a1a1aa' }}>Suggested for you</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }} onClick={() => setActiveTab('explore')}>See All</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const myIdStr = String(activeUser?.id || activeUser?._id || '')
                      const otherBuilders = builders.filter(b => {
                        const bIdStr = String(b.id || b._id || '')
                        return bIdStr && bIdStr !== myIdStr
                      })

                      if (otherBuilders.length === 0) {
                        return (
                          <div style={{ fontSize: '0.8rem', color: '#71717a', padding: '6px 0' }}>
                            No other registered builders yet.
                          </div>
                        )
                      }

                      return otherBuilders.slice(0, 10).map(suggested => {
                        const targetId = String(suggested.id || suggested._id)
                        const isConnected = connections.some(c => String(c.id || c._id) === targetId)
                        const isRequested = sentRequests.includes(targetId)

                        return (
                          <div key={targetId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setProfileUser(suggested)}>
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img src={suggested.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{
                                  position: 'absolute',
                                  bottom: '0',
                                  right: '0',
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: suggested.isOnline ? '#22c55e' : '#71717a',
                                  border: '2px solid #09090b',
                                  boxShadow: suggested.isOnline ? '0 0 6px rgba(34, 197, 94, 0.8)' : 'none'
                                }} title={suggested.isOnline ? 'Online' : 'Offline'} />
                              </div>
                              <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff' }}>@{suggested.username || 'builder'}</strong>
                                <span style={{ fontSize: '0.74rem', color: suggested.isOnline ? '#4ade80' : '#71717a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                  {suggested.isOnline ? '🟢 Online' : '⚪ Offline'}
                                </span>
                              </div>
                            </div>
                            {isRequested ? (
                              <span style={{ color: '#a1a1aa', fontWeight: '700', fontSize: '0.78rem' }}>Requested</span>
                            ) : isConnected ? (
                              <button
                                type="button"
                                onClick={() => handleToggleConnection(targetId)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Following
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendFollowRequest(targetId)}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Follow
                              </button>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Footer Links & Copyright */}
                <footer style={{ fontSize: '0.75rem', color: '#52525b', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language</p>
                  <p style={{ margin: '12px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>© 2026 DEVGRAM FROM GOOGLE DEEPMIND</p>
                </footer>
              </aside>
            </div>
          </div>
        )}
      </main>


      {/* System Camera Overlay Modal */}
      {showCameraModal && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <h3 className="modal-title">CodeLens Camera Capture</h3>
              <button type="button" onClick={stopCameraStream} className="modal-close-button">&times;</button>
            </div>

            <div className="modal-body">
              <label className="modal-label">Select Camera Device</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="modal-select"
              >
                {cameraDevices.map((dev, i) => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.label || `Camera ${i + 1}`}
                  </option>
                ))}
                {cameraDevices.length === 0 && (
                  <option value="">No cameras detected</option>
                )}
              </select>
            </div>

            <div className="camera-preview-panel video">
              {cameraStream ? (
                <video
                  id="camera-preview-video"
                  autoPlay
                  playsInline
                  muted
                  className="camera-preview-video"
                  ref={(el) => {
                    if (el && cameraStream && el.srcObject !== cameraStream) {
                      el.srcObject = cameraStream
                      el.play().catch((e) => console.warn('Video play error:', e))
                    }
                  }}
                />
              ) : (
                <div className="camera-preview-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  <span style={{ fontSize: '0.85rem' }}>Camera preview is inactive</span>
                </div>
              )}

              {cameraLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner"></div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={stopCameraStream}
                className="modal-action-button secondary"
              >
                Cancel
              </button>

              {!cameraStream ? (
                <button
                  type="button"
                  onClick={startCameraStream}
                  className="modal-action-button primary"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startCameraStream}
                    className="modal-action-button secondary"
                  >
                    Switch/Reload
                  </button>
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="modal-action-button primary"
                  >
                    Capture Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Centered Edit Username Modal */}
      {editingUsername && (
        <div className="modal-overlay">
          <div className="modal-panel small">
            <div className="modal-header">
              <h3 className="modal-title">Update Username</h3>
              <button type="button" onClick={() => { setEditingUsername(false); setUsernameError('') }} className="modal-close-button">&times;</button>
            </div>

            <p className="modal-description">Choose a unique username. Others will be able to tag you in posts using this handle.</p>

            <div className="modal-body">
              <div className="input-prefix-wrapper">
                <span className="input-prefix">@</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setUsernameError('') }}
                  placeholder="username"
                  className="modal-input with-prefix"
                  autoFocus
                />
              </div>
              {usernameError && <span className="modal-error-text">{usernameError}</span>}
            </div>

            <div className="modal-actions">
              <button type="button" className="modal-action-button secondary" onClick={() => { setEditingUsername(false); setUsernameError('') }}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-action-button primary"
                onClick={async () => {
                  try {
                    const res = await updateUsername(newUsername)
                    setProfileUser(prev => prev ? { ...prev, username: res.username || newUsername } : prev)
                    setBuilders(prev => prev.map(b => b.id === (res.id || profileUser?.id) ? { ...b, username: res.username || newUsername } : b))
                    setEditingUsername(false)
                    setUsernameError('')
                  } catch (err) {
                    setUsernameError(err.message)
                  }
                }}
              >
                Save handle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following List Modal */}
      {socialModalType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#09090b',
            border: '1px solid #1f1f23',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f23', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', textTransform: 'capitalize' }}>
                {socialModalType}
              </h3>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '1.8rem', cursor: 'pointer', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                &times;
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {(() => {
                const list = socialModalType === 'followers' ? profileFollowers : profileFollowing;
                if (list.length === 0) {
                  return (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#71717a', textAlign: 'center', padding: '24px 0' }}>
                      No {socialModalType} yet.
                    </p>
                  );
                }
                return list.map(u => {
                  const handle = u.username || 'builder';
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setProfileUser(u);
                        setSocialModalType(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid #1f1f23',
                        padding: '12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderColor = '#3f3f46';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = '#1f1f23';
                      }}
                    >
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={u.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3f3f46' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.name}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>@{handle}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* DevGram Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-panel medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✨ Create New Build Post</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="modal-close-button">&times;</button>
            </div>

            <form onSubmit={async (e) => {
              await handleCreatePost(e)
              setShowCreateModal(false)
            }}>
              <div className="modal-body" style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did you build today? Share code updates, tags, or tag @builders..."
                  className="composer-textarea"
                  rows={5}
                  required
                  autoFocus
                  style={{
                    background: '#121215',
                    border: '1px solid #1f1f23',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    resize: 'none'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa' }}>Post Type / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', outline: 'none', fontSize: '0.9rem' }}
                  >
                    <option value="build">🚀 Build Update</option>
                    <option value="reel">🎬 Developer Reel</option>
                    <option value="bug">🐛 Bug Fix</option>
                    <option value="refactor">♻️ Refactor</option>
                    <option value="ui">🎨 UI Design</option>
                  </select>
                </div>

                {capturedImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
                    <img src={capturedImage} alt="Attached" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.85rem', color: '#10b981', flex: 1 }}>Photo Attached</span>
                    <button type="button" onClick={() => setCapturedImage('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="modal-action-button secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="modal-action-button primary" disabled={submitting || !content.trim()}>
                  {submitting ? 'Shipping...' : '🚀 Ship Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Profile Photo Modal - Device or Camera only */}
      {showPhotoPickerModal && (
        <div className="modal-overlay" onClick={() => { setShowPhotoPickerModal(false); stopCameraStream(); }}>
          <div className="modal-panel medium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🖼️ Select Profile Photo</h3>
              <button type="button" onClick={() => { setShowPhotoPickerModal(false); stopCameraStream(); }} className="modal-close-button">&times;</button>
            </div>

            <div className="modal-body" style={{ gap: '16px', display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
              {/* Only 2 Options: Choose from Device or From Camera */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setAvatarSourceTab('upload'); stopCameraStream(); }}
                  style={{
                    flex: 1,
                    background: avatarSourceTab === 'upload' ? 'rgba(79, 70, 229, 0.25)' : '#18181b',
                    border: '1.5px solid',
                    borderColor: avatarSourceTab === 'upload' ? '#4f46e5' : '#27272a',
                    color: avatarSourceTab === 'upload' ? '#818cf8' : '#a1a1aa',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📁 Choose from Device
                </button>
                <button
                  type="button"
                  onClick={() => { setAvatarSourceTab('camera'); startCameraStream(); }}
                  style={{
                    flex: 1,
                    background: avatarSourceTab === 'camera' ? 'rgba(79, 70, 229, 0.25)' : '#18181b',
                    border: '1.5px solid',
                    borderColor: avatarSourceTab === 'camera' ? '#4f46e5' : '#27272a',
                    color: avatarSourceTab === 'camera' ? '#818cf8' : '#a1a1aa',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📷 From Camera
                </button>
              </div>

              {/* Option 1: Choose from Device */}
              {avatarSourceTab === 'upload' && (
                <div style={{ background: '#121215', padding: '32px 20px', borderRadius: '14px', border: '2px dashed #27272a', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <input
                    id="theme-custom-avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setProfileAvatarPreview(event.target?.result)
                          setShowPhotoPickerModal(false)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="theme-custom-avatar-input"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📁 Choose Photo File
                  </label>
                  <span style={{ color: '#71717a', fontSize: '0.8rem' }}>Supports PNG, JPG, WEBP, or SVG</span>
                </div>
              )}

              {/* Option 2: Live Camera */}
              {avatarSourceTab === 'camera' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#121215', padding: '16px', borderRadius: '12px', border: '1px solid #1f1f23' }}>
                  <div style={{ position: 'relative', width: '100%', height: '230px', background: '#000000', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cameraStream ? (
                      <video id="camera-avatar-picker-video" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#71717a' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Camera Stream Inactive</p>
                        <button type="button" onClick={startCameraStream} className="modal-action-button primary" style={{ marginTop: '10px' }}>Start Live Camera</button>
                      </div>
                    )}
                  </div>
                  {cameraStream && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const videoEl = document.getElementById('camera-avatar-picker-video')
                          if (videoEl) {
                            const canvas = document.createElement('canvas')
                            canvas.width = videoEl.videoWidth || 640
                            canvas.height = videoEl.videoHeight || 480
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
                              const dataUrl = canvas.toDataURL('image/png')
                              setProfileAvatarPreview(dataUrl)
                              stopCameraStream()
                              setShowPhotoPickerModal(false)
                            }
                          }
                        }}
                        className="modal-action-button primary"
                      >
                        📸 Snap & Use Photo
                      </button>
                      <button type="button" onClick={stopCameraStream} className="modal-action-button secondary">Stop Camera</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="modal-action-button secondary" onClick={() => { setShowPhotoPickerModal(false); stopCameraStream(); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DevGram More Menu Popover */}
      {showMoreMenu && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '16px',
          background: '#121215',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '8px',
          width: '210px',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(false)
              if (activeUser) {
                openEditProfile(activeUser)
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#f4f4f5', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
            className="more-menu-item"
          >
            ⚙️ Edit Profile
          </button>
          <button
            type="button"
            onClick={() => { setShowMoreMenu(false); if (activeUser) setProfileUser(activeUser); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#f4f4f5', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
            className="more-menu-item"
          >
            👤 View Profile
          </button>
          <div style={{ height: '1px', background: '#27272a', margin: '4px 0' }} />
          <button
            type="button"
            onClick={() => { setShowMoreMenu(false); onLogout(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}
            className="more-menu-item danger"
          >
            🚪 Log Out
          </button>
        </div>
      )}
    </div>
  )
}



export default HomeFeed
