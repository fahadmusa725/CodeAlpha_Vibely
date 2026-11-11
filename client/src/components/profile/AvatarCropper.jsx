import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import './AvatarCropper.css';

const CIRCLE_DIAMETER = 200;

const AvatarCropper = forwardRef(({
  imageSrc,
  disabled = false,
}, ref) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampPan = useCallback((targetPan, targetZoom, naturalW, naturalH) => {
    if (!naturalW || !naturalH) return { x: 0, y: 0 };
    const baseScale = Math.max(CIRCLE_DIAMETER / naturalW, CIRCLE_DIAMETER / naturalH);
    const scale = baseScale * targetZoom;
    const currentW = naturalW * scale;
    const currentH = naturalH * scale;
    const maxPanX = Math.max(0, (currentW - CIRCLE_DIAMETER) / 2);
    const maxPanY = Math.max(0, (currentH - CIRCLE_DIAMETER) / 2);
    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, targetPan.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, targetPan.y)),
    };
  }, []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgNaturalSize(null);
  }, [imageSrc]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(clampedZoom);
    if (imgNaturalSize) {
      setPan((prevPan) =>
        clampPan(prevPan, clampedZoom, imgNaturalSize.width, imgNaturalSize.height)
      );
    }
  };

  const handlePointerDown = (e) => {
    if (disabled || !imgNaturalSize) return;
    const container = containerRef.current;
    if (!container) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture fallback
    }

    setIsDragging(true);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId || !imgNaturalSize) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const rawPan = {
      x: dragRef.current.startPanX + deltaX,
      y: dragRef.current.startPanY + deltaY,
    };
    setPan(clampPan(rawPan, zoom, imgNaturalSize.width, imgNaturalSize.height));
  };

  const handlePointerUp = (e) => {
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      if (containerRef.current?.hasPointerCapture?.(e.pointerId)) {
        try {
          containerRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // release fallback
        }
      }
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  useImperativeHandle(ref, () => ({
    getCroppedBlob: () => {
      return new Promise((resolve, reject) => {
        const img = imgRef.current;
        if (!img || !imgNaturalSize) {
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const baseScale = Math.max(
          CIRCLE_DIAMETER / imgNaturalSize.width,
          CIRCLE_DIAMETER / imgNaturalSize.height
        );
        const scale = baseScale * zoom;
        const currentW = imgNaturalSize.width * scale;
        const currentH = imgNaturalSize.height * scale;

        const imgLeft = CIRCLE_DIAMETER / 2 + pan.x - currentW / 2;
        const imgTop = CIRCLE_DIAMETER / 2 + pan.y - currentH / 2;

        const sx = (0 - imgLeft) / scale;
        const sy = (0 - imgTop) / scale;
        const sWidth = CIRCLE_DIAMETER / scale;
        const sHeight = CIRCLE_DIAMETER / scale;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 512, 512);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate image blob'));
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          0.9
        );
      });
    },
  }));

  const baseScale = imgNaturalSize
    ? Math.max(CIRCLE_DIAMETER / imgNaturalSize.width, CIRCLE_DIAMETER / imgNaturalSize.height)
    : 1;
  const currentScale = baseScale * zoom;
  const renderedW = imgNaturalSize ? imgNaturalSize.width * currentScale : CIRCLE_DIAMETER;
  const renderedH = imgNaturalSize ? imgNaturalSize.height * currentScale : CIRCLE_DIAMETER;

  return (
    <div className="avatar-cropper">
      <div
        ref={containerRef}
        className={`avatar-cropper-circle ${isDragging ? 'is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="region"
        aria-label="Profile picture crop preview"
      >
        <img
          ref={imgRef}
          src={imageSrc}
          crossOrigin="anonymous"
          alt="Avatar crop preview"
          className="avatar-cropper-img"
          onLoad={handleImageLoad}
          style={{
            width: `${renderedW}px`,
            height: `${renderedH}px`,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
          draggable={false}
        />
      </div>

      <div className="avatar-cropper-controls">
        <label htmlFor="avatar-zoom-slider" className="avatar-cropper-zoom-label">
          Zoom
        </label>
        <input
          id="avatar-zoom-slider"
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          disabled={disabled || !imgNaturalSize}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="avatar-cropper-slider"
          aria-label="Avatar zoom level"
        />
      </div>
    </div>
  );
});

export default AvatarCropper;

