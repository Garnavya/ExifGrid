import React, { useEffect, useState } from 'react';
import { fetchGlobalInsights } from '../api/telemetry.js';

export default function InsightsDashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Global Escape Key Listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchGlobalInsights().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const sortData = (obj) => {
    if (!obj) return [];
    return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  // 2. Added onClick={onClose} to the background overlay (Moved comment here!)
  return (
    <div className="modal-overlay" onClick={onClose}>
      
      {/* 3. Added stopPropagation so clicking inside the modal DOES NOT close it */}
      <div className="modal-content insights-dashboard" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Global Hardware Insights</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <p className="modal-desc">Anonymous telemetry aggregated globally from all ExifGrid extractions.</p>
        
        {loading ? (
          <div className="loading-spinner">Loading network data...</div>
        ) : !data ? (
          <div className="error-state">Telemetry server unreachable.</div>
        ) : (
          <div className="insights-grid">
            <div className="insight-card highlight">
              <h4>Total Processed</h4>
              <span className="big-number">{data.totalProcessed}</span>
              <span className="label">Images Scanned</span>
            </div>

            <div className="insight-columns">
              <div className="insight-column">
                <h4>Top Cameras</h4>
                <ul className="leaderboard">
                  {sortData(data.cameras).map(([cam, count]) => (
                    <li key={cam}><span className="name">{cam}</span><span className="count">{count}</span></li>
                  ))}
                </ul>
              </div>

              <div className="insight-column">
                <h4>Top Focal Lengths</h4>
                <ul className="leaderboard">
                  {sortData(data.focalLengths).map(([focal, count]) => (
                    <li key={focal}><span className="name">{focal}</span><span className="count">{count}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}