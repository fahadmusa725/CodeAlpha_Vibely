import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import './CreateStoryModal.css';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 30; // 30 seconds

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const checkVideoDuration = (videoUrl) => {
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        resolve(tempVideo.duration);
      };
      tempVideo.onerror = () => {
        reject(new Error('Failed to load video metadata.'));
      };
      tempVideo.src = videoUrl;
    });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview('');
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(selected.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(selected.type);

    if (!isImage && !isVideo) {
      setError('Only JPG, PNG, WEBP, GIF images and MP4, MOV, WEBM videos are allowed.');
      setFile(null);
      setMediaType('image');
      return;
    }

    if (isImage && selected.size > MAX_IMAGE_SIZE) {
      setError('Images must be less than 10MB.');
      setFile(null);
      setMediaType('image');
      return;
    }

    if (isVideo && selected.size > MAX_VIDEO_SIZE) {
      setError('Videos must be less than 50MB.');
      setFile(null);
      setMediaType('image');
      return;
    }

    const objectUrl = URL.createObjectURL(selected);

    if (isVideo) {
      try {
        const duration = await checkVideoDuration(objectUrl);
        if (duration > MAX_VIDEO_DURATION) {
          URL.revokeObjectURL(objectUrl);
          setError(`Video must be 30 seconds or less (${Math.round(duration)}s selected).`);
          setFile(null);
          setMediaType('image');
          return;
        }
      } catch {
        URL.revokeObjectURL(objectUrl);
        setError('Failed to inspect video duration. Please try another video.');
        setFile(null);
        setMediaType('image');
        return;
      }
    }

    setError('');
    setFile(selected);
    setMediaType(isVideo ? 'video' : 'image');
    setPreview(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image, GIF, or video to share.');
      return;
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setError('Only JPG, PNG, WEBP, GIF images and MP4, MOV, WEBM videos are allowed.');
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setError('Images must be less than 10MB.');
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      setError('Videos must be less than 50MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const sigRes = await api.get('/uploads/signature?purpose=story');
      const sigData = sigRes.data;

      if (sigData.success && sigData.directUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp);
        formData.append('folder', sigData.folder);
        if (sigData.allowedFormats) {
          formData.append('allowed_formats', sigData.allowedFormats);
        }
        formData.append('signature', sigData.signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;

        let cldRes;
        try {
          cldRes = await axios.post(uploadUrl, formData, {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percent);
              }
            },
          });
        } catch (cldErr) {
          if (!cldErr.response) {
            setError('Network error uploading to Cloudinary. Please check your connection.');
          } else {
            setError(cldErr.response.data?.error?.message || 'Failed to upload media to Cloudinary.');
          }
          return;
        }

        const secureUrl = cldRes.data.secure_url;
        await api.post('/stories', {
          mediaUrl: secureUrl,
          mediaType: isVideo ? 'video' : 'image',
        });
      } else {
        const formData = new FormData();
        formData.append('image', file);

        await api.post('/stories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });
      }

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      if (!err.response) {
        setError('Network failure. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload story');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="create-story-overlay" onClick={onClose}>
      <div className="create-story-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-story-header">
          <h3>Create Story</h3>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
          </button>
        </div>

        {error && <div className="create-story-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-story-form">
          <div className="preview-container">
            {preview ? (
              mediaType === 'video' ? (
                <video
                  src={preview}
                  muted
                  playsInline
                  autoPlay
                  loop
                  className="story-preview-video"
                />
              ) : (
                <img src={preview} alt="Story Preview" className="story-preview-img" />
              )
            ) : (
              <div className="upload-placeholder">
                <FontAwesomeIcon icon={faCamera} style={{ fontSize: 32 }} />
                <span>Select a photo, GIF, or video (up to 30s)</span>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
            id="story-file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {uploading && uploadProgress > 0 && (
            <div className="story-progress-wrapper">
              <div className="story-progress-bar-bg">
                <div
                  className="story-progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="story-progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="create-story-actions">
            <label htmlFor="story-file-input" className="select-file-btn">
              {file ? 'Change Media' : 'Choose Media'}
            </label>
            <button
              type="submit"
              disabled={!file || uploading}
              className="submit-story-btn"
            >
              {uploading ? 'Sharing...' : 'Share Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;
