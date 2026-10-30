import React from 'react';
import '../css/progress.css';

export default function GridLoader({ 
  active, 
  percent = 0, 
  current = 0, 
  total = 0, 
  currentName = '' 
}) {
  if (!active) return null;

  const displayPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const hasCount = total > 0;

  return (
    <div className="global-drop-loader-overlay">
      <div className="drop-loader-card">
        <div className="drop-loader-spinner"></div>
        
        <div className="drop-loader-title">Ingesting Photography Assets</div>
        
        <div className="drop-loader-counter">
          {hasCount ? (
            <>Processing Image {current} of {total} ({displayPercent}%)</>
          ) : (
            <>Parsing RAW & EXIF Headers ({displayPercent}%)</>
          )}
        </div>

        {currentName && (
          <div className="drop-loader-filename" title={currentName}>
            📷 {currentName}
          </div>
        )}

        <div className="drop-loader-bar-bg">
          <div 
            className="drop-loader-bar-fill" 
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        <div className="drop-loader-status">
          <span>Extracting Metadata & Previews</span>
          <span>{displayPercent}%</span>
        </div>

        <div className="drop-loader-hint">
          <span>✨ Gallery updating live in the background</span>
        </div>
      </div>
    </div>
  );
}
