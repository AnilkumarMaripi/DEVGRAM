import React from 'react'

export default function EmptyState({ type = 'feed', query = '', onAction }) {
  if (type === 'feed') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        maxWidth: '440px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '16px',
          filter: 'drop-shadow(0 10px 20px rgba(99, 102, 241, 0.3))'
        }}>
          🚀
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
          No developer builds yet
        </h3>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          Be the first to share a shipped feature, code snippet, or WIP architecture with the community!
        </p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '11px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
            }}
          >
            + Create First Build Post
          </button>
        )}
      </div>
    )
  }

  if (type === 'messages') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: '0 0 6px 0' }}>
          No direct messages yet
        </h3>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 18px 0', maxWidth: '320px' }}>
          Connect with other builders, exchange ideas, and collaborate on projects.
        </p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              background: '#27272a',
              color: '#ffffff',
              border: '1px solid #3f3f46',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Find Developers
          </button>
        )}
      </div>
    )
  }

  if (type === 'notifications') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '36px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☕</div>
        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
          You're all caught up!
        </h4>
        <p style={{ color: '#a1a1aa', fontSize: '0.82rem', margin: 0 }}>
          No new build likes, comments, or follow requests.
        </p>
      </div>
    )
  }

  if (type === 'search') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>
          No developers found
        </div>
        <p style={{ color: '#a1a1aa', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
          {query ? `No builders match "${query}"` : 'Try searching by username or skill'}
        </p>
      </div>
    )
  }

  return null
}

