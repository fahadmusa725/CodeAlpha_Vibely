import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faVolumeHigh, faVolumeXmark, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../../utils/avatar';
import ConfirmDialog from '../ConfirmDialog';
import './StoryViewerModal.css';

const DEFAULT_IMAGE_DURATION = 5000;

const StoryViewerModal = ({ groups, initialGroupIndex, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isVideo = currentStory?.mediaType === 'video';

  const viewRequest = useRef(null);
  const videoRef = useRef(null);
  const imageStartRef = useRef(null);
  const imageElapsedRef = useRef(0);
  const animationFrameRef = useRef(null);

  const closeViewer = useCallback(async () => {
    await viewRequest.current;
    onClose();
  }, [onClose]);

  const openSenderProfile = (e) => {
    e.stopPropagation();
    closeViewer();
    navigate(`/profile/${currentGroup.user.username}`);
  };

  const handleNext = useCallback(() => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      closeViewer();
    }
  }, [storyIndex, groupIndex, currentGroup, groups.length, closeViewer]);

  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  useEffect(() => {
    if (currentStory && !currentStory.isSeen) {
      viewRequest.current = api
        .post(`/stories/${currentStory._id}/view`)
        .catch(() => {
          // non-critical; story progress still advances
        });
    }
  }, [currentStory]);

  const isPaused = showDeleteConfirm || isHolding;

  // Reset progress and elapsed time whenever the active story changes
  useEffect(() => {
    setProgressPercent(0);
    imageElapsedRef.current = 0;
    imageStartRef.current = null;
  }, [groupIndex, storyIndex]);

  // Video playback management (pause/resume when paused or story changes)
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;
    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isVideo, isPaused, groupIndex, storyIndex]);

  // Image timer driven by requestAnimationFrame so it can pause and resume accurately
  useEffect(() => {
    if (isVideo) return undefined;
    if (!currentStory) return undefined;

    if (isPaused) {
      cancelAnimationFrame(animationFrameRef.current);
      imageStartRef.current = null;
      return undefined;
    }

    const step = (timestamp) => {
      if (!imageStartRef.current) {
        imageStartRef.current = timestamp;
      }
      const totalElapsed = imageElapsedRef.current + (timestamp - imageStartRef.current);
      const ratio = Math.min(1, totalElapsed / DEFAULT_IMAGE_DURATION);
      setProgressPercent(ratio * 100);

      if (ratio >= 1) {
        imageElapsedRef.current = 0;
        imageStartRef.current = null;
        handleNext();
      } else {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (imageStartRef.current !== null) {
        imageElapsedRef.current += performance.now() - imageStartRef.current;
        imageStartRef.current = null;
      }
    };
  }, [isVideo, currentStory, isPaused, handleNext]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const percent = (video.currentTime / video.duration) * 100;
    setProgressPercent(Math.min(100, percent));
  };

  const handleVideoEnded = () => {
    setProgressPercent(100);
    handleNext();
  };

  const handlePointerDown = () => {
    setIsHolding(true);
  };

  const handlePointerUp = () => {
    setIsHolding(false);
  };

  if (!currentGroup || !currentStory) return null;

  const isMyStory = currentGroup.user._id === user?._id;

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/stories/${currentStory._id}`);
      setShowDeleteConfirm(false);
      closeViewer();
    } catch {
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={closeViewer}>
      <div className="story-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="story-progress-bar-container">
          {currentGroup.stories.map((s, idx) => {
            let fillWidth = '0%';
            if (idx < storyIndex) {
              fillWidth = '100%';
            } else if (idx === storyIndex) {
              fillWidth = `${progressPercent}%`;
            }
            return (
              <div key={s._id} className="story-progress-track">
                <div
                  className="story-progress-fill"
                  style={{ width: fillWidth }}
                />
              </div>
            );
          })}
        </div>

        <div className="story-viewer-header">
          <div className="story-viewer-user" onClick={openSenderProfile}>
            <img
              src={getAvatarUrl(currentGroup.user.avatar, currentGroup.user.fullName)}
              alt={currentGroup.user.username}
              className="story-viewer-avatar"
            />
            <span className="story-viewer-username">{currentGroup.user.username}</span>
          </div>
          <div className="story-viewer-actions">
            {isVideo && (
              <button
                className="story-mute-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                type="button"
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} style={{ fontSize: 16 }} />
              </button>
            )}
            {isMyStory && (
              <button
                className="story-delete-btn"
                onClick={handleDelete}
                title="Delete Story"
                type="button"
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: 16 }} />
              </button>
            )}
            <button className="story-close-btn" onClick={closeViewer} title="Close" type="button">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        <div
          className="story-media-container"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory._id}
              src={currentStory.mediaUrl}
              autoPlay
              muted={isMuted}
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              className="story-media-video"
            />
          ) : (
            <img
              key={currentStory._id}
              src={currentStory.mediaUrl}
              alt="Story"
              className="story-media-img"
            />
          )}
          <div className="story-nav-area left" onClick={handlePrev} />
          <div className="story-nav-area right" onClick={handleNext} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete story"
        message="Delete this story? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default StoryViewerModal;
