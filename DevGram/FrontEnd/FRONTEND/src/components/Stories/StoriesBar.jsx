import { useState, useEffect, useCallback } from 'react'
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
      <div className="stories-scroll-row">
        {/* 1. Own Profile Circle (Always First) */}
        <div className="story-circle-item own-circle">
          <div
            className={`story-avatar-ring ${
              ownHasStories ? (ownGroup.hasUnseen ? 'ring-unseen' : 'ring-seen') : 'ring-none'
            }`}
            onClick={() => handleCircleClick(ownGroup || { isOwn: true, stories: [] }, 0)}
          >
            <img
              src={activeUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt="Your story"
              className="story-avatar-img"
            />
            <button
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
                    src={group.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
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
