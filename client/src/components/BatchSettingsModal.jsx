import React, { useState, useRef } from 'react';

export default function BatchSettingsModal({ onCancel, onConfirm }) {
  const [settings, setSettings] = useState({
    showCamera: true, showLens: true, showAperture: true,
    showShutter: true, showIso: true, caption: ''
  });
  
  // 1. Create the reference for the input field
  const inputRef = useRef(null);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 2. The WhatsApp-style keyboard slide-up fix
  const handleInputFocus = () => {
    setTimeout(() => {
      // Smoothly pushes the input to the center of the screen after the keyboard opens
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); 
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content batch-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Batch Export Settings</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>
        
        <p className="modal-desc">Configure the EXIF data printed on your polaroids.</p>

        <div className="exif-toggles-grid">
          {Object.entries({
            showCamera: 'Camera Model', showLens: 'Focal Length',
            showAperture: 'Aperture (f-stop)', showShutter: 'Shutter Speed',
            showIso: 'ISO Speed'
          }).map(([key, label]) => (
            <div key={key} className={`toggle-label ${settings[key] ? 'active' : ''}`} onClick={() => handleToggle(key)}>
              <div className="checkbox-custom"></div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Caption Input */}
        <div className="caption-input-group">
          <label>Custom Caption (Optional)</label>
          <input 
            ref={inputRef} /* 3. Attach the reference */
            type="text" 
            placeholder="E.g., Summer Trip 2026"
            value={settings.caption}
            onChange={(e) => setSettings(prev => ({ ...prev, caption: e.target.value }))}
            onFocus={handleInputFocus} /* 4. Fire the slide-up function when tapped */
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onConfirm(settings)}>Package Zip</button>
        </div>
      </div>
    </div>
  );
}