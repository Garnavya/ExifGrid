// client/src/components/PrivacySettingsModal.jsx
import React from 'react';

export default function PrivacySettingsModal({ onClose, isOptedIn, onToggle }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content batch-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Privacy & Telemetry</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <p className="modal-desc">
          ExifGrid is a privacy-first application. All metadata extraction, Polaroid generation, and processing happens directly in your browser. 
        </p>
        
        <div className="exif-toggles-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
          <div className={`toggle-label ${isOptedIn ? 'active' : ''}`} onClick={onToggle}>
            <div className="checkbox-custom"></div>
            <span>Share Anonymous Image Counts</span>
          </div>
        </div>

        <p className="modal-desc" style={{ fontSize: '12px', marginTop: '-12px' }}>
          When enabled, we only track the number of images processed per session. No files, metadata, or personal data are ever sent to our servers.
        </p>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}