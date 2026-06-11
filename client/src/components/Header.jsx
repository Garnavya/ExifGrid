// client/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../css/header.css';

export default function Header({
  isLight,
  hasPhotos,
  onToggleTheme,
  onClearAll,
  onAddPhotos,
  onExportCSV,
  onBatchDownload, // <--- 1. ADDED THIS PROP
  fileInputRef,
  onFilesSelected,
  viewMode,
  onToggleView
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <h1 className="header-title">ExifGrid</h1>
      </div>

      <div className="header-actions">
        {/* Hidden file input for adding photos */}
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => onFilesSelected(e.target.files)}
        />

        {/* Theme Toggle is always visible */}
        <button className="icon-btn" onClick={onToggleTheme} title={isLight ? "Dark Mode" : "Light Mode"}>
          {isLight ? (
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ) : (
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>

        {hasPhotos && (
          <>
            {/* Map/Gallery Toggle */}
            <button 
              className={`icon-btn feature-btn ${viewMode === 'map' ? 'active-map-btn' : ''}`} 
              onClick={onToggleView} 
              title={viewMode === 'gallery' ? "View Global Journey" : "Return to Gallery"}
            >
              {viewMode === 'gallery' ? (
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="2" y1="12" x2="22" y2="12"></line>
                   <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                 </svg>
              ) : (
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <rect x="3" y="3" width="7" height="7"></rect>
                   <rect x="14" y="3" width="7" height="7"></rect>
                   <rect x="14" y="14" width="7" height="7"></rect>
                   <rect x="3" y="14" width="7" height="7"></rect>
                 </svg>
              )}
            </button>

            {/* Quick Add Photos */}
            <button className="icon-btn" onClick={onAddPhotos} title="Add More Photos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>

            {/* More Options Dropdown */}
            <div className="dropdown-container" ref={menuRef}>
              <button 
                className={`icon-btn ${isMenuOpen ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                title="More Options"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>

              {isMenuOpen && (
                <div className="dropdown-menu">
                  {/* 2. ADDED THE BATCH DOWNLOAD BUTTON HERE */}
                  <button className="dropdown-item" onClick={() => { onBatchDownload(); setIsMenuOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Export Batch Polaroids
                  </button>

                  <button className="dropdown-item" onClick={() => { onExportCSV(); setIsMenuOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export to CSV
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item danger" onClick={() => { onClearAll(); setIsMenuOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Clear All Data
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}