import React from 'react'
import DevGramLogo from '../components/icons/DevGramLogo'

export default function TermsPage({ onNavigate }) {
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
          Terms of Service
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
          Last updated: November 2026 &bull; Status: <em>[REVIEW BEFORE LAUNCH - Placeholder Legal Text]</em>
        </p>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>1. Agreement to Terms</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            By registering for an account or using the DevGram platform, you agree to comply with and be legally bound by these Terms of Service. If you disagree, do not use the service.
          </p>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>2. Acceptable Developer Use</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            DevGram is a professional network dedicated to software builders and engineers. You agree not to:
          </p>
          <ul style={{ color: '#a1a1aa', fontSize: '0.9rem', paddingLeft: '20px' }}>
            <li>Upload malware, ransomware, exploit payloads, or malicious scripts.</li>
            <li>Abuse, scrape, or flood platform APIs or rate limits.</li>
            <li>Harass, impersonate, or defame other builders or project maintainers.</li>
          </ul>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>3. Code & Content Ownership</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            You retain all copyright and proprietary rights to code snippets, project screenshots, and commentary you publish on DevGram. By posting, you grant DevGram a non-exclusive license to host, display, and distribute your content across the platform.
          </p>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: '700' }}>4. Disclaimer of Warranty</h2>
          <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>
            DevGram is provided "AS IS" and "AS AVAILABLE" without warranty of any kind. We do not guarantee uninterrupted availability or zero downtime.
          </p>
        </section>
      </div>
    </div>
  )
}

