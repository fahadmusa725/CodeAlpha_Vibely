import React, { useRef, useState, useEffect } from 'react';
import './CoverRepositioner.css';

const CoverRepositioner = ({
  coverUrl,
  coverPositionY = 50,
  onChangePosition,
  disabled = false,
}) => {
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);
  const dragStartRef = useRef(null);

  const [hasVerticalRange, setHasVerticalRange] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const checkRange = () => {
    const img = imgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper) {
      setHasVerticalRange(false);
      return;
    }
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = wrapper.clientWidth / wrapper.clientHeight;
    const hasRange = naturalRatio < containerRatio - 0.005;
    setHasVerticalRange(hasRange);
  };

  useEffect(() => {
    checkRange();
    window.addEventListener('resize', checkRange);
    return () => window.removeEventListener('resize', checkRange);
  }, [coverUrl]);

  const handlePointerDown = (e) => {
    if (disabled || !hasVerticalRange) return;
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img) return;

    const renderedHeight = (img.naturalHeight / img.naturalWidth) * wrapper.clientWidth;
    const maxDragDistance = renderedHeight - wrapper.clientHeight;
    if (maxDragDistance <= 0) return;

    try {
      wrapper.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture failure on platforms that do not support it
    }

    setIsDragging(true);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startPosY: coverPositionY,
      maxDragDistance,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;

    const { startY, startPosY, maxDragDistance } = dragStartRef.current;
    const deltaY = e.clientY - startY;
    const deltaPercent = (deltaY / maxDragDistance) * 100;
    const newPos = Math.round(Math.min(100, Math.max(0, startPosY - deltaPercent)));
    onChangePosition(newPos);
  };

  const handlePointerUp = (e) => {
    if (dragStartRef.current && dragStartRef.current.pointerId === e.pointerId) {
      if (wrapperRef.current && wrapperRef.current.hasPointerCapture?.(e.pointerId)) {
        try {
          wrapperRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // pointer capture release fallback
        }
      }
      dragStartRef.current = null;
      setIsDragging(false);
    }
  };

  if (!coverUrl) {
    return (
      <div className="cover-repositioner-empty">
        <span>No cover photo</span>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`cover-repositioner-wrapper ${hasVerticalRange ? 'can-reposition' : ''} ${
        isDragging ? 'is-dragging' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="region"
      aria-label="Cover photo preview"
    >
      <img
        ref={imgRef}
        src={coverUrl}
        alt="Cover preview"
        className="cover-repositioner-img"
        onLoad={checkRange}
        style={{ objectPosition: `50% ${coverPositionY}%` }}
        draggable={false}
      />
      {hasVerticalRange && (
        <div className="cover-repositioner-hint">
          <span>Drag to reposition vertically</span>
        </div>
      )}
    </div>
  );
};

export default CoverRepositioner;

