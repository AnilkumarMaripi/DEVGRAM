import { useState, useEffect, useRef, useCallback } from 'react'
import './StoryViewer.css'

const STORY_DURATION_MS = 5000

function StoryViewer({ userGroups, initialUserIdx = 0, onClose, onStorySeen, onDeleteStory }) {
  const [currentUserIdx, setCurrentUserIdx] = useState(initialUserIdx)
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0) // 0 to 100
  const [isPaused, setIsPaused] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const activeUserGroup = userGroups[currentUserIdx] || userGroups[0]
  const activeStory = activeUserGroup?.stories[currentStoryIdx]

  // Track story as seen
  useEffect(() => {
    if (activeStory && onStorySeen) {
      onStorySeen(activeStory.id, activeUserGroup.userId)
    }
    setProgress(0)
  }, [currentUserIdx, currentStoryIdx, activeStory, onStorySeen, activeUserGroup?.userId])

  const handleNext = useCallback(() => {
    if (!activeUserGroup) return

    if (currentStoryIdx < activeUserGroup.stories.length - 1) {
      setCurrentStoryIdx((prev) => prev + 1)
      setProgress(0)
    } else {
      // Move to next user's stories
      if (currentUserIdx < userGroups.length - 1) {
        setCurrentUserIdx((prev) => prev + 1)
        setCurrentStoryIdx(0)
        setProgress(0)
      } else {
        // Reached end of all stories
        onClose()
      }
    }
  }, [activeUserGroup, currentStoryIdx, currentUserIdx, userGroups.length, onClose])

  const handlePrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((prev) => prev - 1)
      setProgress(0)
    } else if (currentUserIdx > 0) {
      const prevUserIdx = currentUserIdx - 1
      const prevUserStories = userGroups[prevUserIdx].stories
      setCurrentUserIdx(prevUserIdx)
      setCurrentStoryIdx(prevUserStories.length - 1)
      setProgress(0)
    } else {
      // Re-start first story
      setProgress(0)
    }
  }, [currentStoryIdx, currentUserIdx, userGroups])

  const handleNextRef = useRef()
  handleNextRef.current = handleNext

  // Timer loop for active story progress bar
  useEffect(() => {
    if (isPaused || !activeStory) return

    const intervalTime = 50 // Update every 50ms
    const step = (intervalTime / STORY_DURATION_MS) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (handleNextRef.current) handleNextRef.current()
          return 0
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [isPaused, activeStory?.id])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, onClose])

  const handleDelete = async () => {
    if (!activeStory || deleting) return
    if (!window.confirm('Delete this story?')) return

    setDeleting(true)
    try {
      await onDeleteStory(activeStory.id)
      if (activeUserGroup.stories.length <= 1) {
        onClose()
      } else {
        handleNext()
      }
    } catch (err) {
      alert(err.message || 'Failed to delete story')
    } finally {
      setDeleting(false)
    }
  }

  if (!activeUserGroup || !activeStory) return null

  return (
    <div
      className="story-viewer-overlay"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Segmented Progress Bar */}
        <div className="story-progress-bar-container">
          {activeUserGroup.stories.map((story, idx) => {
            let widthPercent = 0
            if (idx < currentStoryIdx) widthPercent = 100
            else if (idx === currentStoryIdx) widthPercent = progress
            else widthPercent = 0

            return (
              <div key={story.id} className="story-progress-segment-bg">
                <div
                  className="story-progress-segment-fill"
                  style={{
                    width: `${widthPercent}%`,
                    transition: widthPercent === 0 ? 'none' : 'width 0.05s linear',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Story Top Header Bar */}
        <div className="story-header">
          <div className="story-author-info">
            <img
              src={activeUserGroup.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={activeUserGroup.name}
              className="story-author-avatar"
            />
            <div className="story-author-names">
              <span className="story-author-username">@{activeUserGroup.username}</span>
              <span className="story-time-left">{activeStory.timeRemaining}</span>
            </div>
          </div>

          <div className="story-header-actions">
            {activeUserGroup.isOwn && (
              <button
                className="story-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete story"
              >
                🗑️
              </button>
            )}
            <button className="story-close-icon-btn" onClick={onClose} title="Close story viewer">
              ✕
            </button>
          </div>
        </div>

        {/* Main Media Content */}
        <div className="story-media-display">
          <img src={activeStory.mediaUrl} alt="Story content" className="story-main-image" />
          {activeStory.caption && (
            <div className="story-caption-badge">
              <p>{activeStory.caption}</p>
            </div>
          )}
        </div>

        {/* Tap Controls (Left / Right) */}
        <button
          className="story-tap-area story-tap-left"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          aria-label="Previous story"
        >
          ‹
        </button>
        <button
          className="story-tap-area story-tap-right"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          aria-label="Next story"
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default StoryViewer
