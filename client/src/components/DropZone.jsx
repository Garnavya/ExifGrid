import React, { useState } from 'react';

export default function DropZone({ onFilesSelected, onBrowse }) {
  // 1. Safe React state for hover tracking
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div id="drop-zone-wrapper">
      {/* 1. The new "dead space" wrapper (No clicks or drag events here!) */}
      
      {/* 2. Your original drop-zone, now acting as the true interactive core */}
      <div 
        id="drop-zone"
        onClick={onBrowse}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragOver ? 'drag-over' : ''}
      >
        <div className="drop-inner">
          <div className="drop-icon">📂</div>
          <h3 className="drop-title">Drop photos here</h3>
          <p className="drop-sub">or click to browse your files</p>
          <span className="drop-accent">Supports JPG, PNG, WEBP</span>
          <div className="drop-hints">
            <span className="hint-pill">Max 50MB</span>
            <span className="hint-pill">Exif Preserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}