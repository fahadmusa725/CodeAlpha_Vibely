import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import CoverRepositioner from './CoverRepositioner';
import AvatarCropper from './AvatarCropper';
import ConfirmDialog from '../ConfirmDialog';
import './EditProfileModal.css';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MEDIA_SIZE = 10 * 1024 * 1024;

const isDicebearAvatar = (url) => {
  if (!url || typeof url !== 'string') return true;
  return url.includes('dicebear.com');
};

const EditProfileModal = ({
  isOpen,
  onClose,
  initialUser,
  onSuccess,
}) => {
  const avatarCropperRef = useRef(null);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [coverPositionModified, setCoverPositionModified] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState('');
  const [avatarModified, setAvatarModified] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && initialUser) {
      setFullName(initialUser.fullName || '');
      setBio(initialUser.bio || '');
      setWebsite(initialUser.website || '');
      setLocation(initialUser.location || '');

      setCoverUrl(initialUser.coverPhoto || '');
      setCoverFile(null);
      setCoverPositionY(initialUser.coverPositionY ?? 50);
      setCoverPositionModified(false);

      const hasCustomAvatar = initialUser.avatar && !isDicebearAvatar(initialUser.avatar);
      setAvatarSrc(hasCustomAvatar ? initialUser.avatar : '');
      setAvatarModified(false);

      setError('');
      setShowDiscardConfirm(false);
    }
  }, [isOpen, initialUser]);

  const hasUnsavedChanges = () => {
    if (!initialUser) return false;
    if (fullName !== (initialUser.fullName || '')) return true;
    if (bio !== (initialUser.bio || '')) return true;
    if (website !== (initialUser.website || '')) return true;
    if (location !== (initialUser.location || '')) return true;
    if (coverFile !== null) return true;
    if (coverPositionModified && coverPositionY !== (initialUser.coverPositionY ?? 50)) return true;
    if (avatarModified) return true;
    return false;
  };

  const handleRequestClose = () => {
    if (saving) return;
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) {
        e.preventDefault();
        e.stopPropagation();
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, fullName, bio, website, location, coverFile, coverPositionY, coverPositionModified, avatarModified]);

  if (!isOpen) return null;

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, and GIF images are allowed for cover.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setError('Cover image must be less than 10MB.');
      e.target.value = '';
      return;
    }

    setError('');
    const objectUrl = URL.createObjectURL(file);
    setCoverUrl(objectUrl);
    setCoverFile(file);
    setCoverPositionY(50);
    setCoverPositionModified(true);
    e.target.value = '';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, and GIF images are allowed for profile picture.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setError('Profile picture must be less than 10MB.');
      e.target.value = '';
      return;
    }

    setError('');
    const objectUrl = URL.createObjectURL(file);
    setAvatarSrc(objectUrl);
    setAvatarModified(true);
    e.target.value = '';
  };

  const uploadMediaToCloudinary = async (fileOrBlob, purpose) => {
    const sigRes = await api.get(`/uploads/signature?purpose=${purpose}`);
    const sigData = sigRes.data;

    if (sigData.success && sigData.directUpload) {
      const formData = new FormData();
      formData.append('file', fileOrBlob);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('folder', sigData.folder);
      if (sigData.allowedFormats) {
        formData.append('allowed_formats', sigData.allowedFormats);
      }
      formData.append('signature', sigData.signature);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
      const cldRes = await axios.post(uploadUrl, formData);
      return {
        url: cldRes.data.secure_url,
        public_id: cldRes.data.public_id,
      };
    }

    const formData = new FormData();
    formData.append('image', fileOrBlob);
    formData.append('type', purpose === 'avatar' ? 'avatar' : 'coverPhoto');
    const localRes = await api.put('/users/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      url: purpose === 'avatar' ? localRes.data.data.avatar : localRes.data.data.coverPhoto,
      public_id: null,
      savedDirectly: true,
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const accumulatedUpdates = {};

    try {
      // Step 1: Avatar upload (if modified and crop exists)
      if (avatarModified && avatarCropperRef.current) {
        const croppedBlob = await avatarCropperRef.current.getCroppedBlob();
        if (croppedBlob) {
          const avatarUpload = await uploadMediaToCloudinary(croppedBlob, 'avatar');
          if (!avatarUpload.savedDirectly) {
            const mediaRes = await api.put('/users/media', {
              type: 'avatar',
              url: avatarUpload.url,
              public_id: avatarUpload.public_id,
            });
            accumulatedUpdates.avatar = mediaRes.data.data.avatar;
          } else {
            accumulatedUpdates.avatar = avatarUpload.url;
          }
          setAvatarModified(false);
        }
      }

      // Step 2: Cover upload (if new file picked)
      let coverJustUploaded = false;
      if (coverFile) {
        const coverUpload = await uploadMediaToCloudinary(coverFile, 'cover');
        if (!coverUpload.savedDirectly) {
          const mediaRes = await api.put('/users/media', {
            type: 'coverPhoto',
            url: coverUpload.url,
            public_id: coverUpload.public_id,
          });
          accumulatedUpdates.coverPhoto = mediaRes.data.data.coverPhoto;
          accumulatedUpdates.coverPositionY = mediaRes.data.data.coverPositionY ?? 50;
        } else {
          accumulatedUpdates.coverPhoto = coverUpload.url;
          accumulatedUpdates.coverPositionY = 50;
        }
        coverJustUploaded = true;
        setCoverFile(null);
      }

      // Step 3: Cover position
      // Run if position was modified OR if a new cover was just uploaded with a non-50 position
      if (coverPositionModified || (coverJustUploaded && coverPositionY !== 50)) {
        const posRes = await api.put('/users/cover-position', {
          coverPositionY,
        });
        if (posRes.data.success) {
          accumulatedUpdates.coverPositionY = coverPositionY;
          setCoverPositionModified(false);
        }
      }

      // Step 4: Text fields
      const profileRes = await api.put('/users/profile', {
        fullName,
        bio,
        website,
        location,
      });

      if (profileRes.data.success) {
        accumulatedUpdates.fullName = fullName;
        accumulatedUpdates.bio = bio;
        accumulatedUpdates.website = website;
        accumulatedUpdates.location = location;
      }

      onSuccess(accumulatedUpdates);
      onClose();
    } catch (err) {
      if (Object.keys(accumulatedUpdates).length > 0) {
        onSuccess(accumulatedUpdates);
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to save profile changes';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="edit-profile-modal-overlay" onClick={handleRequestClose}>
        <div
          className="edit-profile-modal-container card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
        >
          <div className="edit-profile-modal-header">
            <button
              type="button"
              className="edit-profile-modal-header-btn cancel-btn"
              onClick={handleRequestClose}
              disabled={saving}
              aria-label="Cancel editing"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} className="mobile-only-icon" />
              <span className="desktop-btn-text">Cancel</span>
            </button>
            <h2 id="edit-profile-modal-title" className="edit-profile-modal-title">
              Edit Profile
            </h2>
            <button
              type="button"
              className="edit-profile-modal-header-btn save-btn"
              onClick={handleSave}
              disabled={saving}
              aria-label="Save profile changes"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {error && <div className="profile-action-error edit-profile-modal-error">{error}</div>}

          <form onSubmit={handleSave} className="edit-profile-modal-body">
            <section className="edit-profile-section" aria-labelledby="section-cover-title">
              <div className="edit-profile-section-header">
                <h3 id="section-cover-title">Cover Photo</h3>
                <button
                  type="button"
                  className="btn btn-secondary edit-profile-action-btn"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={saving}
                >
                  <FontAwesomeIcon icon={faCamera} style={{ fontSize: 13 }} />
                  <span>Change cover</span>
                </button>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                />
              </div>

              <CoverRepositioner
                coverUrl={coverUrl}
                coverPositionY={coverPositionY}
                onChangePosition={(newPos) => {
                  setCoverPositionY(newPos);
                  setCoverPositionModified(true);
                }}
                disabled={saving}
              />
            </section>

            <section className="edit-profile-section" aria-labelledby="section-avatar-title">
              <div className="edit-profile-section-header">
                <h3 id="section-avatar-title">Profile Picture</h3>
                <button
                  type="button"
                  className="btn btn-secondary edit-profile-action-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={saving}
                >
                  <FontAwesomeIcon icon={faCamera} style={{ fontSize: 13 }} />
                  <span>Change photo</span>
                </button>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                />
              </div>

              {avatarSrc ? (
                <AvatarCropper
                  ref={avatarCropperRef}
                  imageSrc={avatarSrc}
                  disabled={saving}
                />
              ) : (
                <div className="avatar-cropper-placeholder">
                  <span>No custom photo selected</span>
                </div>
              )}
            </section>

            <section className="edit-profile-section" aria-labelledby="section-info-title">
              <h3 id="section-info-title">Personal Information</h3>

              <div className="edit-field">
                <label htmlFor="edit-profile-fullname">Full Name</label>
                <input
                  id="edit-profile-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="modal-input"
                  maxLength={50}
                  required
                  disabled={saving}
                />
              </div>

              <div className="edit-field">
                <label htmlFor="edit-profile-bio">Bio</label>
                <textarea
                  id="edit-profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="modal-textarea"
                  maxLength={200}
                  disabled={saving}
                />
              </div>

              <div className="edit-field">
                <label htmlFor="edit-profile-website">Website</label>
                <input
                  id="edit-profile-website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="modal-input"
                  maxLength={60}
                  disabled={saving}
                />
              </div>

              <div className="edit-field">
                <label htmlFor="edit-profile-location">Location</label>
                <input
                  id="edit-profile-location"
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="modal-input"
                  maxLength={100}
                  disabled={saving}
                />
              </div>
            </section>

            <div className="edit-profile-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRequestClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger={true}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};

export default EditProfileModal;

