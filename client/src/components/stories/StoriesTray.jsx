import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StoryViewerModal from './StoryViewerModal';
import CreateStoryModal from './CreateStoryModal';
import { getAvatarUrl } from '../../utils/avatar';
import './StoriesTray.css';

const getStoryThumbnailUrl = (story, userFallback) => {
  if (!story) {
    return userFallback;
  }

  if (story.mediaType === 'video' && story.mediaUrl) {
    const videoUrl = story.mediaUrl;
    const uploadIdx = videoUrl.indexOf('/upload/');
    if (uploadIdx !== -1) {
      const prefix = videoUrl.slice(0, uploadIdx + 8); // includes '/upload/'
      const rest = videoUrl.slice(uploadIdx + 8);
      const dotIdx = rest.lastIndexOf('.');
      const pathWithoutExt = dotIdx !== -1 ? rest.slice(0, dotIdx) : rest;
      return `${prefix}so_0/${pathWithoutExt}.jpg`;
    }
  }

  return story.mediaUrl || userFallback;
};

const StoriesTray = () => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStories = async () => {
    if (!isAuthenticated) {
      setGroups([]);
      return;
    }
    try {
      const res = await api.get('/stories/feed');
      setGroups(res.data.data || []);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const myGroup = groups.find((g) => g.user._id === user?._id);

  const handleOpenViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  return (
    <div className="stories-tray-container">
      <div className="stories-scroll-wrapper">
        <div className="story-item my-story-item">
          <div
            className={`story-avatar-ring ${
              myGroup ? (myGroup.hasUnseenStories ? 'unseen' : 'seen') : 'add-story'
            }`}
            onClick={() => {
              if (myGroup && myGroup.stories.length > 0) {
                const myIdx = groups.findIndex((g) => g.user._id === user._id);
                handleOpenViewer(myIdx);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            <img
              src={
                myGroup && myGroup.stories.length > 0
                  ? getStoryThumbnailUrl(
                      myGroup.stories[0],
                      getAvatarUrl(user?.avatar, user?.fullName)
                    )
                  : getAvatarUrl(user?.avatar, user?.fullName)
              }
              alt={user?.username || 'My Story'}
              className="story-avatar-img"
            />
            <button
              className="add-story-btn"
              title="Add Story"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
            >
              +
            </button>
          </div>
          <span className="story-username">Your Story</span>
        </div>

        {groups
          .filter((g) => g.user._id !== user?._id)
          .map((group) => {
            const globalIdx = groups.findIndex((g) => g.user._id === group.user._id);
            const firstStory = group.stories && group.stories[0];
            const fallbackAvatar = getAvatarUrl(group.user.avatar, group.user.fullName);
            return (
              <div
                key={group.user._id}
                className="story-item"
                onClick={() => handleOpenViewer(globalIdx)}
              >
                <div
                  className={`story-avatar-ring ${
                    group.hasUnseenStories ? 'unseen' : 'seen'
                  }`}
                >
                  <img
                    src={getStoryThumbnailUrl(firstStory, fallbackAvatar)}
                    alt={group.user.username}
                    className="story-avatar-img"
                  />
                </div>
                <span className="story-username">{group.user.username}</span>
              </div>
            );
          })}
      </div>

      {activeGroupIndex !== null && (
        <StoryViewerModal
          groups={groups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => {
            setActiveGroupIndex(null);
            fetchStories();
          }}
        />
      )}

      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
};

export default StoriesTray;
