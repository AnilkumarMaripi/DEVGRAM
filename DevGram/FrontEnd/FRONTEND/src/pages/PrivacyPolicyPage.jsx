import React from 'react'
import DevGramLogo from '../components/icons/DevGramLogo'

export default function PrivacyPolicyPage({ onNavigate }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#ffffff',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '760px',
        margin: '0 auto',
        background: '#121217',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '36px 32px',
        lineHeight: 1.7
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #27272a', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DevGramLogo size={32} />
            <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>DevGram</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              background: '#27272a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            &larr; Back
          </button>
        </div>

        <div style={{
          display: 'inline-block',
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.35)',
          color: '#facc15',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          marginBottom: '16px'
        }}>
          LEGAL DRAFT &bull; REVIEW BEFORE LAUNCH
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
          Last updated: November 2026 &bull; Status: <em>[REVIEW BEFORE LAUNCH - Placeholder Legal Text]</em>
        </p>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>1. Information We Collect</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            DevGram collects information you provide directly to us when creating a developer account, publishing build updates, code snippets, photos, and communicating with other members.
          </p>
          <ul style={{ color: '#a1a1aa', fontSize: '0.9rem', paddingLeft: '20px' }}>
            <li><strong>Account Profile:</strong> Name, username, email address, password hash, bio, title, tech stack tags, and profile avatar.</li>
            <li><strong>Build Content:</strong> Code snippets, build descriptions, tags, uploaded screenshots, and comments.</li>
            <li><strong>Direct Messages:</strong> Messages transmitted between developers via DevGram.</li>
          </ul>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>2. Authentication & Cookies</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            DevGram utilizes secure, HttpOnly, SameSite cookies (<code>devgram_session</code> and <code>devgram_refresh</code>) strictly for maintaining authenticated session state. We do not use third-party tracking or advertising cookies.
          </p>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>3. Data Storage & Deletion (Your Rights)</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            Under GDPR and CCPA, developers have full rights to inspect, export, and delete their data at any time. You can permanently delete your account and all associated posts, comments, stories, and chats through Settings &rarr; Edit Profile &rarr; Delete Account.
          </p>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>4. Contact Us</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            For privacy inquiries or data protection officer communications, reach out to <code>privacy@devgram.local</code> <em>[REVIEW BEFORE LAUNCH]</em>.
          </p>
        </section>
      </div>
    </div>
  )
}

