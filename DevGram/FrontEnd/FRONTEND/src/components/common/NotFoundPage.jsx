import React from 'react'
import DevGramLogo from '../icons/DevGramLogo'

export default function NotFoundPage({ onNavigate }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      color: '#ffffff',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: '#121217',
        border: '1px solid #27272a',
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          <DevGramLogo size={42} />
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>DevGram</span>
        </div>

        <div style={{
          display: 'inline-block',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontFamily: 'monospace',
          marginBottom: '16px'
        }}>
          HTTP 404 &bull; ERR_ROUTE_NOT_FOUND
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '900',
          margin: '0 0 12px 0',
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          404
        </h1>

        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 10px 0', color: '#f4f4f5' }}>
          fatal: branch or commit not found
        </h2>

        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 32px 0' }}>
          The developer endpoint or page you tried to check out doesn't exist on origin/main.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          style={{
            background: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.45)',
            transition: 'transform 0.15s ease',
          }}
        >
          &larr; Back to Feed
        </button>
      </div>
    </div>
  )
}

