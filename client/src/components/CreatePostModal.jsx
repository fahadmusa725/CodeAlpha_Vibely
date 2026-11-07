import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faGlobe, faHashtag, faImage, faLocationDot, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './CreatePostModal.css';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mobileTextareaRef = useRef(null);

  if (!isOpen) return null;

  const addFiles = (files) => {
    if (files.length === 0) return;

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Only JPG, PNG, and WEBP images are allowed.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Each image must be less than 10MB.');
        return;
      }
    }

    if (images.length + files.length > 10) {
      setError('You can upload a maximum of 10 images per post.');
      return;
    }

    setError('');
    setImages([...images, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleImageSelect = (e) => {
    addFiles(Array.from(e.target.files));
  };

  const handleDragOver = (e) => {
    if (step !== 1) return;
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    if (step !== 1) return;
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    if (step !== 1) return;
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setImages(updatedImages);
    setPreviewUrls(updatedPreviews);

    if (currentPreviewIdx >= updatedPreviews.length) {
      setCurrentPreviewIdx(Math.max(0, updatedPreviews.length - 1));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (images.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError('');

    try {
      const sigRes = await api.get('/uploads/signature?purpose=post');
      const sigData = sigRes.data;

      let postPayload;

      if (sigData.success && sigData.directUpload) {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
        const totalFiles = images.length;
        const progressPerFile = new Array(totalFiles).fill(0);

        const uploadPromises = images.map((imgFile, index) => {
          const formData = new FormData();
          formData.append('file', imgFile);
          formData.append('api_key', sigData.apiKey);
          formData.append('timestamp', sigData.timestamp);
          formData.append('folder', sigData.folder);
          if (sigData.allowedFormats) {
            formData.append('allowed_formats', sigData.allowedFormats);
          }
          formData.append('signature', sigData.signature);

          return axios.post(uploadUrl, formData, {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                progressPerFile[index] = progressEvent.loaded / progressEvent.total;
                const totalProgress = Math.round(
                  (progressPerFile.reduce((acc, curr) => acc + curr, 0) / totalFiles) * 100
                );
                setUploadProgress(totalProgress);
              }
            },
          });
        });

        let uploadResponses;
        try {
          uploadResponses = await Promise.all(uploadPromises);
        } catch (cldErr) {
          if (!cldErr.response) {
            setError('Network error uploading to Cloudinary. Please check your connection.');
          } else {
            setError(cldErr.response.data?.error?.message || 'Failed to upload images to Cloudinary.');
          }
          setLoading(false);
          setUploadProgress(0);
          return;
        }

        const uploadedImages = uploadResponses.map((res) => ({
          url: res.data.secure_url,
          public_id: res.data.public_id,
        }));

        postPayload = {
          caption,
          location,
          tags,
          images: uploadedImages,
        };

        const res = await api.post('/posts', postPayload);

        if (res.data.success) {
          updateUser({ postsCount: Math.max(0, (user.postsCount || 0) + 1) });
          if (onPostCreated) {
            onPostCreated(res.data.data);
          }
          handleClose();
        }
      } else {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append('images', img);
        });
        formData.append('caption', caption);
        formData.append('location', location);
        formData.append('tags', tags);

        const res = await api.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });

        if (res.data.success) {
          updateUser({ postsCount: Math.max(0, (user.postsCount || 0) + 1) });
          if (onPostCreated) {
            onPostCreated(res.data.data);
          }
          handleClose();
        }
      }
    } catch (err) {
      if (!err.response) {
        setError('Network failure. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviewUrls([]);
    setCurrentPreviewIdx(0);
    setStep(1);
    setCaption('');
    setLocation('');
    setTags('');
    setError('');
    onClose();
  };

  const handleCaptionInput = (e, targetRef) => {
    setCaption(e.target.value);
    if (targetRef && targetRef.current) {
      targetRef.current.style.height = 'auto';
      targetRef.current.style.height = `${targetRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="modal-overlay create-modal-overlay" onClick={handleClose}>
      <div
        className={`create-modal-container ${step === 2 ? 'step-two-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header (max-width 640px) */}
        <div className="create-modal-header mobile-header-only">
          <button className="icon-btn-ghost mobile-close-btn" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 20 }} />
          </button>
          <h3 className="create-modal-title">Create post</h3>
          <button
            type="button"
            className="mobile-header-post-btn"
            onClick={handleSubmit}
            disabled={images.length === 0 || loading}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 16 }} /> : 'Post'}
          </button>
        </div>

        {/* Desktop Header (> 640px) */}
        <div className="create-modal-header desktop-header-only">
          {step === 2 ? (
            <button className="icon-btn-ghost back-step-btn" onClick={() => setStep(1)} aria-label="Back">
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 20 }} />
            </button>
          ) : (
            <div className="header-placeholder" />
          )}

          <h3 className="create-modal-title">
            {step === 1 ? 'Create new post' : 'Details'}
          </h3>

          {previewUrls.length > 0 ? (
            step === 1 ? (
              <button
                className="step-next-btn"
                onClick={() => setStep(2)}
              >
                Next
              </button>
            ) : (
              <button
                className="step-share-btn"
                onClick={handleSubmit}
                disabled={loading || images.length === 0}
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 16 }} /> : 'Post'}
              </button>
            )
          ) : (
            <button className="icon-btn-ghost" onClick={handleClose} aria-label="Close">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 20 }} />
            </button>
          )}
        </div>

        {error && <div className="create-modal-error">{error}</div>}

        {loading && uploadProgress > 0 && (
          <div className="create-post-progress-wrapper">
            <div className="create-post-progress-bar-bg">
              <div
                className="create-post-progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="create-post-progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* Mobile Composer Body (max-width 640px) */}
        <div className="create-modal-body mobile-body-only">
          <div className="creator-user-row">
            <img src={user?.avatar} alt={user?.fullName || 'User avatar'} className="creator-avatar" />
            <div className="creator-meta">
              <span className="creator-username">{user?.username}</span>
              <div className="creator-privacy-badge">
                <FontAwesomeIcon icon={faGlobe} style={{ fontSize: 12 }} />
                <span>Public</span>
              </div>
            </div>
          </div>

          <div className="mobile-caption-group">
            <textarea
              ref={mobileTextareaRef}
              placeholder="What's on your mind?"
              value={caption}
              onChange={(e) => handleCaptionInput(e, mobileTextareaRef)}
              maxLength={2200}
              className="mobile-caption-textarea"
            />
            {caption.length > 1800 && (
              <div className="caption-footer-meta">
                <span className="char-count">{caption.length}/2,200</span>
              </div>
            )}
          </div>

          <div className="mobile-photos-section">
            {previewUrls.length === 0 ? (
              <div
                className="mobile-empty-photos"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mobile-empty-icon-ring">
                  <FontAwesomeIcon icon={faImage} style={{ fontSize: 28, color: 'var(--accent-primary)' }} />
                </div>
                <button
                  type="button"
                  className="btn btn-primary mobile-add-photos-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Add photos
                </button>
                <span className="mobile-empty-hint">JPG, PNG or WEBP, up to 10MB each</span>
              </div>
            ) : previewUrls.length === 1 ? (
              <div className="mobile-single-photo-wrapper">
                <img
                  src={previewUrls[0]}
                  alt="Post preview"
                  className="mobile-single-photo-img"
                />
                <button
                  type="button"
                  className="mobile-photo-remove-btn"
                  onClick={() => handleRemoveImage(0)}
                  aria-label="Remove image"
                >
                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
                </button>
              </div>
            ) : (
              <div className="mobile-multi-photos-strip">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="mobile-strip-thumb">
                    <img src={url} alt={`Thumb ${idx + 1}`} />
                    <button
                      type="button"
                      className="mobile-photo-remove-btn"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Remove image"
                    >
                      <FontAwesomeIcon icon={faXmark} style={{ fontSize: 12 }} />
                    </button>
                  </div>
                ))}
                {previewUrls.length < 10 && (
                  <button
                    type="button"
                    className="mobile-strip-add-tile"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Add more photos"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mobile-details-compact">
            <div className="details-field-row">
              <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 16 }} className="field-icon" />
              <input
                type="text"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="details-field-input"
              />
            </div>
            <div className="details-field-row">
              <FontAwesomeIcon icon={faHashtag} style={{ fontSize: 16 }} className="field-icon" />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="details-field-input"
              />
            </div>
          </div>
        </div>

        {/* Desktop Body (> 640px) */}
        <div
          className={`create-modal-body desktop-body-only ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {step === 1 ? (
            previewUrls.length === 0 ? (
              <div
                className="create-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon-ring">
                  <FontAwesomeIcon icon={faImage} style={{ fontSize: 48, color: 'var(--accent-primary)' }} />
                </div>
                <h4>Add photos</h4>
                <span className="dropzone-drag-hint">or drag them here</span>
                <p>JPG, PNG or WEBP, up to 10MB each</p>
                <button
                  type="button"
                  className="btn btn-primary select-photos-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Select photos
                </button>
              </div>
            ) : (
              <div className="create-preview-stage">
                <div className="stage-image-wrapper">
                  <img
                    src={previewUrls[currentPreviewIdx]}
                    alt="Current preview"
                    className="stage-preview-img"
                  />

                  {previewUrls.length > 1 && (
                    <>
                      <button
                        className="carousel-btn prev"
                        onClick={() =>
                          setCurrentPreviewIdx((prev) =>
                            prev > 0 ? prev - 1 : previewUrls.length - 1
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
                      </button>
                      <button
                        className="carousel-btn next"
                        onClick={() =>
                          setCurrentPreviewIdx((prev) =>
                            prev < previewUrls.length - 1 ? prev + 1 : 0
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 18 }} />
                      </button>
                    </>
                  )}
                </div>

                <div className="thumbnails-strip">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`thumb-box ${idx === currentPreviewIdx ? 'selected' : ''}`}
                      onClick={() => setCurrentPreviewIdx(idx)}
                    >
                      <img src={url} alt={`Thumb ${idx + 1}`} />
                      <button
                        type="button"
                        className="thumb-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  ))}
                  {previewUrls.length < 10 && (
                    <button
                      type="button"
                      className="thumb-add-more"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="create-split-view">
              <div className="split-preview-pane">
                <div className="stage-image-wrapper">
                  <img
                    src={previewUrls[currentPreviewIdx]}
                    alt="Final preview"
                    className="stage-preview-img"
                  />
                  {previewUrls.length > 1 && (
                    <div className="carousel-dots">
                      {previewUrls.map((_, idx) => (
                        <span
                          key={idx}
                          className={`dot ${idx === currentPreviewIdx ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="split-details-pane">
                <div className="creator-user-row">
                  <img src={user?.avatar} alt={user?.fullName} className="creator-avatar" />
                  <div className="creator-meta">
                    <span className="creator-username">{user?.username}</span>
                    <div className="creator-privacy-badge">
                      <FontAwesomeIcon icon={faGlobe} style={{ fontSize: 12 }} />
                      <span>Public</span>
                    </div>
                  </div>
                </div>

                <div className="caption-input-group">
                  <textarea
                    ref={textareaRef}
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => handleCaptionInput(e, textareaRef)}
                    rows={6}
                    maxLength={2200}
                    className="create-caption-textarea"
                  />
                  <div className="caption-footer-meta">
                    <span className="char-count">{caption.length}/2,200</span>
                  </div>
                </div>

                <div className="details-field-row">
                  <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 16 }} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Add location"
                    ref={locationInputRef}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="details-field-input"
                  />
                </div>

                <div className="details-field-row">
                  <FontAwesomeIcon icon={faHashtag} style={{ fontSize: 16 }} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="details-field-input"
                  />
                </div>

                <div className="add-to-post-row">
                  <span className="add-to-post-label">Add to your post</span>
                  <div className="add-to-post-icons">
                    <button type="button" className="add-icon-btn photo-add" title="Add more photos" onClick={() => fileInputRef.current?.click()}>
                      <FontAwesomeIcon icon={faImage} style={{ fontSize: 20 }} />
                    </button>
                    <button type="button" className="add-icon-btn location-add" title="Add location" onClick={() => locationInputRef.current?.focus()}>
                      <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 20 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            multiple
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
