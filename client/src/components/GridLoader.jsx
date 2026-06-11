import React from 'react';
import '../css/progress.css';

export default function GridLoader({ active, percent }) {
  return (
    <div className={`global-progress-container ${active ? 'visible' : ''}`}>
      <div 
        className="global-progress-bar" 
        style={{ width: `${percent}%` }}
      >
        <div className="progress-glow"></div>
      </div>
    </div>
  );
}