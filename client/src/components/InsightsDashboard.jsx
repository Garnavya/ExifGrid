import React, { useEffect, useState } from 'react';
import { fetchGlobalInsights } from '../api/telemetry';

export default function InsightsDashboard({ onClose }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGlobalInsights().then(data => {
      if (data) {
        setStats(data);
      } else {
        // Fallback to 0s if the server is not running so the UI still looks good
        setStats({ images: 0, ai: 0, polaroids: 0, csv: 0, apertureRange: 'N/A' });
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="ai-close-btn" onClick={onClose}>×</button>
        
        <div className="privacy-hook-banner" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>The ExifGrid Hivemind</h3>
          
          {isLoading ? (
            <p>Connecting to secure telemetry server...</p>
          ) : (
            <>
              <p className="privacy-statement" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                A total of <strong style={{ color: 'var(--accent)' }}>{(stats.images || 0).toLocaleString()}</strong> images have visited this website to have their EXIF data analyzed—but the private details <em>only ever existed on the computers they were sent from.</em>
              </p>
              
              <div className="global-stats-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Framing Critiques Run</span>
                  <strong style={{ fontSize: '1.5rem' }}>{(stats.ai || 0).toLocaleString()}</strong>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Polaroids Generated</span>
                  <strong style={{ fontSize: '1.5rem' }}>{(stats.polaroids || 0).toLocaleString()}</strong>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Global Aperture Range Evaluated</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{stats.apertureRange || 'N/A'}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}