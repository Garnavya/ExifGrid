import { useState } from 'react';

export default function BatchSettingsModal({ onCancel, onConfirm }) {
  // Default selections
  const [selectedExif, setSelectedExif] = useState([
    'Model', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength'
  ]);
  const [caption, setCaption] = useState('');

  // These map to the logic you already built inside polaroid.js
  const availableFields = [
    { id: 'Make', label: 'Camera Make' },
    { id: 'Model', label: 'Camera Model' },
    { id: 'FNumber', label: 'Aperture' },
    { id: 'ExposureTime', label: 'Shutter Speed' },
    { id: 'ISO', label: 'ISO' },
    { id: 'FocalLength', label: 'Focal Length' },
    { id: 'DateTimeOriginal', label: 'Date Taken' },
    { id: 'GPS', label: 'GPS Coordinates' }
  ];

  const toggleField = (id) => {
    setSelectedExif(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content batch-settings">
        <div className="modal-header">
          <h3>Batch Polaroid Settings</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>
        
        <p className="modal-desc">Select which EXIF fields to print globally across all exported polaroid frames.</p>
        
        <div className="exif-toggles-grid">
          {availableFields.map(field => (
            <label key={field.id} className={`toggle-label ${selectedExif.includes(field.id) ? 'active' : ''}`}>
              <input 
                type="checkbox" 
                checked={selectedExif.includes(field.id)}
                onChange={() => toggleField(field.id)}
                style={{ display: 'none' }}
              />
              <span className="checkbox-custom"></span>
              {field.label}
            </label>
          ))}
        </div>

        <div className="caption-input-group">
          <label>Global Caption (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g., Summer Trip 2026" 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button 
            onClick={() => onConfirm({ exifToggles: selectedExif, caption })} 
            className="btn-primary"
          >
            Start Packaging ZIP
          </button>
        </div>
      </div>
    </div>
  );
}