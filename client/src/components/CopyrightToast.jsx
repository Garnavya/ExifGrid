import React from 'react';
import '../css/toast.css';

export default function CopyrightToast({ onClose }) {
  return (
    <div className="copyright-toast-wrapper">
      <div className="copyright-toast">
        <div className="toast-header">
          <span className="toast-icon">⚠️</span>
          <h4>Protected Assets Detected</h4>
          <button className="toast-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="toast-body">
          <p className="toast-main-text">
            We noticed some files in your batch contain embedded copyright or artist metadata. 
            Just to be clear: <strong>ExifGrid is a neutral utility tool and is not involved in your workflow.</strong> 
            You are solely responsible for how you manage, modify, or distribute these files, and any repercussions fall entirely on you.
          </p>
          
          <p className="toast-caveat">
            <em>(If these copyrights are your personal belongings, feel free to ignore this—it's just a friendly heads-up for the curious!)</em>
          </p>

          <div className="toast-punishments">
            <h5>Legal Risks of Tampering with Metadata:</h5>
            <p>Under laws like the Digital Millennium Copyright Act (DMCA), intentionally removing or altering Copyright Management Information (CMI) is illegal and can lead to:</p>
            <ul>
              <li><strong>Civil Penalties:</strong> Statutory damages ranging from $2,500 to $25,000 per violation.</li>
              <li><strong>Injunctions:</strong> Legal orders forcing the immediate takedown and destruction of the tampered media.</li>
              <li><strong>Criminal Charges:</strong> In cases of commercial advantage, offenses can lead to massive fines or imprisonment.</li>
              <li><strong>Platform Bans:</strong> Immediate strikes and permanent account bans on social media and portfolio sites.</li>
            </ul>
          </div>

          <button className="toast-acknowledge-btn" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}