import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchStoriesFeed, createStory, markStoryAsSeen, deleteStory } from '../../services/storyService'
import AddStoryModal from './AddStoryModal'
import StoryViewer from './StoryViewer'
import './StoriesBar.css'

function StoriesBar({ activeUser }) {
  const [userGroups, setUserGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeViewerIdx, setActiveViewerIdx] = useState(null)

  const loadFeed = useCallback(async () => {
    try {
      const data = await fetchStoriesFeed()
      setUserGroups(data)
    } catch (err) {
      console.error('Failed to load stories feed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  // Own story group check
  const ownGroup = userGroups.find((g) => g.isOwn)
  const ownHasStories = ownGroup && ownGroup.stories && ownGroup.stories.length > 0

  const handleCircleClick = (group, idx) => {
    if (group.stories && group.stories.length > 0) {
      setActiveViewerIdx(idx)
    } else if (group.isOwn) {
      setShowAddModal(true)
    }
  }

  const handleAddStory = async (storyData) => {
    await createStory(storyData)
    await loadFeed()
  }

  const handleStorySeen = useCallback(async (storyId, userId) => {
    try {
      await markStoryAsSeen(storyId)
      setUserGroups((prevGroups) => {
        return prevGroups.map((group) => {
          if (group.userId !== userId) return group

          const updatedStories = group.stories.map((s) =>
            s.id === storyId ? { ...s, seen: true } : s
          )
          const stillHasUnseen = updatedStories.some((s) => !s.seen)

          return {
            ...group,
            stories: updatedStories,
            hasUnseen: stillHasUnseen,
          }
        })
      })
    } catch (err) {
      console.error('Failed to mark story as seen:', err)
    }
  }, [])

  const handleDeleteStory = async (storyId) => {
    await deleteStory(storyId)
    await loadFeed()
  }

  const scrollRowRef = useRef(null)

  const handleScrollRight = () => {
    if (scrollRowRef.current) {
      scrollRowRef.current.scrollBy({ left: 240, behavior: 'smooth' })
    }
  }

  if (loading && userGroups.length === 0) {
    return (
      <div className="stories-bar-skeleton">
        <div className="stories-circle-skel" />
        <div className="stories-circle-skel" />
        <div className="stories-circle-skel" />
      </div>
    )
  }

  return (
    <section className="stories-bar-container" aria-label="Stories">
      <div className="stories-bar-wrapper">
        <div className="stories-scroll-row" ref={scrollRowRef}>
          {/* 1. Own Profile Circle (Always First) */}
          <div className="story-circle-item own-circle">
            <div
              className={`story-avatar-ring ${
                ownHasStories ? (ownGroup.hasUnseen ? 'ring-unseen' : 'ring-seen') : 'ring-unseen'
              }`}
              onClick={() => handleCircleClick(ownGroup || { isOwn: true, stories: [] }, 0)}
            >
              <img
                src={activeUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt="Your story"
                className="story-avatar-img"
              />
              <button
                type="button"
                className="story-add-badge"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddModal(true)
                }}
                title="Post a story"
              >
                +
              </button>
            </div>
            <span className="story-username">Your story</span>
          </div>

          {/* 2. Other Users' Story Circles */}
          {userGroups
            .filter((g) => !g.isOwn)
            .map((group, filteredIdx) => {
              const actualIdx = userGroups.findIndex((g) => g.userId === group.userId)

              return (
                <div
                  key={group.userId}
                  className="story-circle-item"
                  onClick={() => handleCircleClick(group, actualIdx)}
                >
                  <div
                    className={`story-avatar-ring ${
                      group.hasUnseen ? 'ring-unseen' : 'ring-seen'
                    }`}
                  >
                    <img
                      src={group.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={group.name}
                      className="story-avatar-img"
                    />
                  </div>
                  <span className="story-username">
                    {group.username.length > 10
                      ? `${group.username.slice(0, 9)}..`
                      : group.username}
                  </span>
                </div>
              )
            })}
        </div>

        {/* Floating Right Scroll Arrow Button (Instagram Style) */}
        {userGroups.length > 3 && (
          <button type="button" className="stories-next-btn" onClick={handleScrollRight} title="Scroll right">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Story Creation Modal */}
      {showAddModal && (
        <AddStoryModal onClose={() => setShowAddModal(false)} onSubmit={handleAddStory} />
      )}

      {/* Story Viewer Modal */}
      {activeViewerIdx !== null && (
        <StoryViewer
          userGroups={userGroups}
          initialUserIdx={activeViewerIdx}
          onClose={() => setActiveViewerIdx(null)}
          onStorySeen={handleStorySeen}
          onDeleteStory={handleDeleteStory}
        />
      )}
    </section>
  )
}

export default StoriesBar
