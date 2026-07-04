import React from 'react';

export default function ConsentModal({ onChoice }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content batch-settings">
        <div className="modal-header">
          <h3>Help Improve ExifGrid</h3>
        </div>
        <p className="modal-desc" style={{ marginBottom: '16px' }}>
          We value your privacy. ExifGrid processes all your photos locally on your device. 
        </p>
        <p className="modal-desc">
          Would you like to opt-in to anonymous telemetry? If you agree, we will only send a <strong>simple number representing how many images you drop</strong> to help us track the app's overall usage. No image data, metadata, or personal information is ever sent.
        </p>
        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button className="btn-secondary" onClick={() => onChoice(false)}>
            Opt Out
          </button>
          <button className="btn-primary" onClick={() => onChoice(true)}>
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}