import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faHeart, faLayerGroup, faLink, faLocationDot, faPen, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PostDetailModal from '../components/PostDetailModal';
import VerifiedBadge from '../components/VerifiedBadge';
import EditProfileModal from '../components/profile/EditProfileModal';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import './Profile.css';

const Profile = ({ onOpenCreateModal, refreshKey }) => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeModalPost, setActiveModalPost] = useState(null);

  const [followModalType, setFollowModalType] = useState(null);
  const [followUsersList, setFollowUsersList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const isOwnProfile =
    currentUser &&
    profileUser &&
    (currentUser._id === profileUser._id || currentUser.username === profileUser.username);

  useEffect(() => {
    fetchProfile();
  }, [username, refreshKey]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${username}`);
      if (res.data.success) {
        setProfileUser(res.data.data.user);
        setPosts(res.data.data.posts);
        setIsFollowing(res.data.data.user.isFollowing);
      }
    } catch {
      // Profile fetch failure handled
    } finally {
      setLoading(false);
    }
  };

  const openFollowModal = async (type) => {
    if (!profileUser?._id) return;
    setFollowModalType(type);
    setLoadingFollowList(true);
    try {
      const res = await api.get(`/users/${profileUser._id}/${type}`);
      if (res.data.success) {
        setFollowUsersList(res.data.data || []);
      }
    } catch {
      // Fetch follow list failure handled
    } finally {
      setLoadingFollowList(false);
    }
  };

  const handleUserFollowInModal = async (targetUser) => {

    const currentIsFollowing = targetUser.isFollowing;
    setFollowUsersList((prev) =>
      prev.map((u) =>
        u._id === targetUser._id ? { ...u, isFollowing: !currentIsFollowing } : u
      )
    );

    if (isOwnProfile && followModalType === 'following' && currentIsFollowing) {
      setProfileUser((prev) => ({
        ...prev,
        followingCount: Math.max(0, (prev.followingCount || 0) - 1),
      }));
    } else if (isOwnProfile && followModalType === 'following' && !currentIsFollowing) {
      setProfileUser((prev) => ({
        ...prev,
        followingCount: (prev.followingCount || 0) + 1,
      }));
    }

    try {
      const res = await api.post(`/users/${targetUser._id}/follow`);
      updateUser({ followingCount: res.data.followingCount });
    } catch {
      setFollowUsersList((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, isFollowing: currentIsFollowing } : u
        )
      );
    }
  };

  const handleFollowToggle = async () => {

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setProfileUser((prev) => ({
      ...prev,
      followersCount: nextState
        ? prev.followersCount + 1
        : Math.max(0, prev.followersCount - 1),
    }));

    try {
      const res = await api.post(`/users/${profileUser._id}/follow`);
      updateUser({ followingCount: res.data.followingCount });
    } catch {
      setIsFollowing(!nextState);
      setProfileUser((prev) => ({
        ...prev,
        followersCount: nextState
          ? Math.max(0, prev.followersCount - 1)
          : prev.followersCount + 1,
      }));
    }
  };

  if (loading) {
    return (
      <div className="profile-container skeleton-profile-view">
        <div className="skeleton profile-cover-skeleton" style={{ height: 160 }} />
        <div className="profile-header-skeleton" style={{ padding: 20 }}>
          <div className="skeleton skeleton-circle" style={{ width: 80, height: 80 }} />
          <div className="skeleton" style={{ width: '40%', height: 20, marginTop: 16 }} />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-container not-found">
        <h2>User not found</h2>
        <p>The profile @{username} doesn't seem to exist.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-cover-wrapper">
        {profileUser.coverPhoto ? (
          <img
            src={profileUser.coverPhoto}
            alt="Cover"
            className="profile-cover-img"
            style={{ objectPosition: `50% ${profileUser.coverPositionY ?? 50}%` }}
            draggable={false}
          />
        ) : null}
      </div>

      <div className="profile-header-card card">
        <div className="profile-top-row">
          <div className="story-ring-wrapper profile-ring">
            <div className="story-ring-inner">
              <img
                src={getAvatarUrl(profileUser.avatar, profileUser.fullName || profileUser.username)}
                alt={profileUser.fullName}
                className="profile-avatar"
              />
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button
                className="btn btn-secondary edit-btn"
                onClick={() => setShowEditModal(true)}
              >
                <FontAwesomeIcon icon={faPen} style={{ fontSize: 15 }} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollowToggle}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="profile-info-details">
          <div className="profile-name-line">
            <h1 className="profile-username-title">{profileUser.username}</h1>
            {profileUser.isVerified && <VerifiedBadge size={18} />}
          </div>
          <span className="profile-fullname">{profileUser.fullName}</span>

          {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}

          <div className="profile-meta-tags">
            {profileUser.location && (
              <div className="meta-tag">
                <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 13 }} />
                <span>{profileUser.location}</span>
              </div>
            )}
            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noreferrer"
                className="meta-tag link-tag"
              >
                <FontAwesomeIcon icon={faLink} style={{ fontSize: 13 }} />
                <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          <div className="profile-stats-bar">
            <div className="stat-item">
              <span className="stat-number">{profileUser.postsCount ?? posts.length}</span>
              <span className="stat-label">{(profileUser.postsCount ?? posts.length) === 1 ? 'post' : 'posts'}</span>
            </div>
            <div
              className="stat-item stat-item-clickable"
              onClick={() => openFollowModal('followers')}
            >
              <span className="stat-number">{profileUser.followersCount || 0}</span>
              <span className="stat-label">followers</span>
            </div>
            <div
              className="stat-item stat-item-clickable"
              onClick={() => openFollowModal('following')}
            >
              <span className="stat-number">{profileUser.followingCount || 0}</span>
              <span className="stat-label">following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-posts-section">
        <div className="section-tab active">
          <FontAwesomeIcon icon={faTableCellsLarge} style={{ fontSize: 16 }} />
          <span>POSTS</span>
        </div>

        {posts.length > 0 ? (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div
                key={post._id}
                className="profile-post-card"
                onClick={() => setActiveModalPost(post)}
              >
                <img
                  src={post.images?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'}
                  alt="User post"
                  loading="lazy"
                />

                {post.images && post.images.length > 1 && (
                  <div className="carousel-indicator">
                    <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: 14 }} />
                  </div>
                )}

                <div className="post-grid-overlay">
                  <div className="overlay-stat">
                    <FontAwesomeIcon icon={faHeart} style={{ fontSize: 18, color: '#ffffff' }} />
                    <span>{post.likesCount || post.likes?.length || 0}</span>
                  </div>
                  <div className="overlay-stat">
                    <FontAwesomeIcon icon={faComment} style={{ fontSize: 18, color: '#ffffff' }} />
                    <span>{post.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card profile-empty-posts">
            <FontAwesomeIcon icon={faTableCellsLarge} style={{ fontSize: 36 }} className="empty-icon" />
            <h3>No Posts Yet</h3>
            {isOwnProfile && (
              <button className="btn btn-primary" onClick={onOpenCreateModal}>
                Share your first post
              </button>
            )}
          </div>
        )}
      </div>

      {followModalType && (
        <div className="modal-overlay" onClick={() => setFollowModalType(null)}>
          <div
            className="follow-list-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="follow-modal-header">
              <h3>{followModalType === 'followers' ? 'Followers' : 'Following'}</h3>
              <button
                className="close-modal-btn"
                onClick={() => setFollowModalType(null)}
              >
                &times;
              </button>
            </div>
            <div className="follow-modal-body">
              {loadingFollowList ? (
                <div className="follow-list-loading">Loading users...</div>
              ) : followUsersList.length === 0 ? (
                <div className="follow-list-empty">
                  No {followModalType} found.
                </div>
              ) : (
                <div className="follow-users-list">
                  {followUsersList.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    return (
                      <div key={u._id} className="follow-user-item">
                        <div
                          className="follow-user-info"
                          onClick={() => {
                            setFollowModalType(null);
                            navigate(`/profile/${u.username}`);
                          }}
                        >
                          <img
                            src={getAvatarUrl(u.avatar, u.fullName)}
                            alt={u.username}
                            className="follow-user-avatar"
                          />
                          <div className="follow-user-details">
                            <span className="follow-user-username">
                              {u.username}
                              {u.isVerified && <VerifiedBadge size={14} />}
                            </span>
                            <span className="follow-user-fullname">
                              {u.fullName}
                            </span>
                          </div>
                        </div>
                        {!isSelf && (
                          <button
                            className={`btn ${
                              u.isFollowing ? 'btn-secondary' : 'btn-primary'
                            } btn-sm`}
                            onClick={() => handleUserFollowInModal(u)}
                          >
                            {u.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          initialUser={profileUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updates) => {
            setProfileUser((prev) => ({
              ...prev,
              ...updates,
            }));
            updateUser(updates);
          }}
        />
      )}

      {activeModalPost && (
        <PostDetailModal
          post={activeModalPost}
          isOpen={!!activeModalPost}
          onClose={() => setActiveModalPost(null)}
          onPostUpdated={(updated) => {
            setPosts((prev) =>
              prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
            );
          }}
        />
      )}
    </div>
  );
};

export default Profile;
