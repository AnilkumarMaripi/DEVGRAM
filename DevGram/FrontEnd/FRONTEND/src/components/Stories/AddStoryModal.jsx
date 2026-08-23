import { useState } from 'react'
import './AddStoryModal.css'

const CODE_PRESETS = [
  {
    name: 'Cyber Neon',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
    textColor: '#818cf8',
    sample: 'const shipIt = () => { console.log("🚀 Live in prod!"); };',
  },
  {
    name: 'Sunset Code',
    bg: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #991b1b 100%)',
    textColor: '#fde047',
    sample: '// Late night refactoring magic ✨\nconst bug = null;',
  },
  {
    name: 'Matrix Dark',
    bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)',
    textColor: '#34d399',
    sample: 'while (coffee.isEmpty()) {\n  coffee.refill();\n  code.write();\n}',
  },
  {
    name: 'Deep Space',
    bg: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
    textColor: '#a1a1aa',
    sample: 'git commit -m "feat: added stories bar 🔥"',
  },
]

function AddStoryModal({ onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'preset'
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(CODE_PRESETS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageUrl(reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let finalMediaUrl = imageUrl

      if (activeTab === 'preset') {
        // Create an SVG / Canvas background image for preset snippet
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 800
        const ctx = canvas.getContext('2d')

        // Fill gradient
        const grd = ctx.createLinearGradient(0, 0, 600, 800)
        grd.addColorStop(0, '#0f172a')
        grd.addColorStop(0.5, '#1e1b4b')
        grd.addColorStop(1, '#311042')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, 600, 800)

        // Draw code box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.roundRect(40, 150, 520, 500, 16)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw dots
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(70, 180, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#eab308'
        ctx.beginPath()
        ctx.arc(95, 180, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(120, 180, 8, 0, Math.PI * 2)
        ctx.fill()

        // Text
        ctx.fillStyle = selectedPreset.textColor
        ctx.font = '20px "JetBrains Mono", monospace'
        const textLines = (caption || selectedPreset.sample).split('\n')
        textLines.forEach((line, idx) => {
          ctx.fillText(line, 70, 230 + idx * 36)
        })

        finalMediaUrl = canvas.toDataURL('image/png')
      }

      if (!finalMediaUrl) {
        setError('Please upload an image or select a preset.')
        setSubmitting(false)
        return
      }

      await onSubmit({ mediaUrl: finalMediaUrl, caption })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to post story.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="story-modal-header">
          <h3>Create Story</h3>
          <button className="story-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="story-modal-error">{error}</div>}

        <div className="story-tab-switcher">
          <button
            className={`story-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📷 Upload Image / Screenshot
          </button>
          <button
            className={`story-tab-btn ${activeTab === 'preset' ? 'active' : ''}`}
            onClick={() => setActiveTab('preset')}
          >
            💻 Code Snippet Canvas
          </button>
        </div>

        <form onSubmit={handleSubmit} className="story-form">
          {activeTab === 'upload' ? (
            <div className="story-upload-zone">
              {imageUrl ? (
                <div className="story-preview-wrapper">
                  <img src={imageUrl} alt="Story preview" className="story-preview-img" />
                  <button type="button" className="story-change-img-btn" onClick={() => setImageUrl('')}>
                    Change Image
                  </button>
                </div>
              ) : (
                <label className="story-dropzone">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="story-upload-icon">📸</span>
                  <span className="story-upload-text">Click to choose a photo or screenshot</span>
                  <span className="story-upload-sub">PNG, JPG, WebP up to 5MB</span>
                </label>
              )}
            </div>
          ) : (
            <div className="story-presets-grid">
              {CODE_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  className={`story-preset-card ${selectedPreset.name === preset.name ? 'selected' : ''}`}
                  style={{ background: preset.bg }}
                  onClick={() => setSelectedPreset(preset)}
                >
                  <span className="story-preset-name">{preset.name}</span>
                  <code style={{ color: preset.textColor }}>{preset.sample}</code>
                </div>
              ))}
            </div>
          )}

          <div className="story-input-group">
            <label>Caption / Dev Note</label>
            <input
              type="text"
              placeholder="What are you building today? 🚀"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="story-actions">
            <button type="button" className="story-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="story-submit-btn" disabled={submitting}>
              {submitting ? 'Posting Story...' : 'Share Story (24h)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStoryModal
