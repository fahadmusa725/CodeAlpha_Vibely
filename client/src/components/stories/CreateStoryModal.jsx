import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import './CreateStoryModal.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Only JPEG, PNG, WEBP, and GIF images are allowed.');
      setFile(null);
      setPreview('');
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('Image must be less than 10MB.');
      setFile(null);
      setPreview('');
      return;
    }

    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to share.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, WEBP, and GIF images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 10MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const sigRes = await api.get('/stories/upload-signature');
      const sigData = sigRes.data;

      if (sigData.success && sigData.directUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp);
        formData.append('folder', sigData.folder);
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
          mediaType: 'image',
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
              <img src={preview} alt="Story Preview" className="story-preview-img" />
            ) : (
              <div className="upload-placeholder">
                <FontAwesomeIcon icon={faCamera} style={{ fontSize: 32 }} />
                <span>Select an image or GIF for your 24h story</span>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
              {file ? 'Change Photo' : 'Choose Photo'}
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
