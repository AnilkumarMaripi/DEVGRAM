import React from 'react'

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  onCreatePost,
  unreadCount = 0,
}) {
  return (
    <nav
      className="devgram-mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 9000,
        padding: '0 8px',
      }}
    >
      {/* Home */}
      <button
        type="button"
        onClick={() => onTabChange('feed')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'feed' ? '#6366f1' : '#a1a1aa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'feed' ? '700' : '500',
          cursor: 'pointer',
          padding: '6px 12px'
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🏠</span>
        <span>Feed</span>
      </button>

      {/* Explore / Reels */}
      <button
        type="button"
        onClick={() => onTabChange('reels')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'reels' ? '#6366f1' : '#a1a1aa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'reels' ? '700' : '500',
          cursor: 'pointer',
          padding: '6px 12px'
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>⚡</span>
        <span>Reels</span>
      </button>

      {/* Create Build Button */}
      <button
        type="button"
        onClick={onCreatePost}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          border: 'none',
          color: '#ffffff',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.5)',
          transform: 'translateY(-6px)'
        }}
        title="Create Build Post"
      >
        +
      </button>

      {/* Messages */}
      <button
        type="button"
        onClick={() => onTabChange('messages')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'messages' ? '#6366f1' : '#a1a1aa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'messages' ? '700' : '500',
          cursor: 'pointer',
          position: 'relative',
          padding: '6px 12px'
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>💬</span>
        <span>Chats</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '10px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            width: '8px',
            height: '8px',
          }} />
        )}
      </button>

      {/* Profile */}
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'profile' ? '#6366f1' : '#a1a1aa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'profile' ? '700' : '500',
          cursor: 'pointer',
          padding: '6px 12px'
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>👤</span>
        <span>Profile</span>
      </button>
    </nav>
  )
}

