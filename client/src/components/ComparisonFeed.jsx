import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { formatAperture, formatShutter } from '../utils/formatters.js';

export default function ComparisonFeed({ photos, comparisonIds, onClear, onRemove }) {
  const feedRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1x, 2x, 3x
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    // GSAP entrance animation whenever the feed mounts or a second photo is added
    if (comparisonIds.length > 0 && feedRef.current) {
      gsap.fromTo(feedRef.current,
        { opacity: 0, y: -20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }
      );
    }
  }, [comparisonIds.length]);

  const handleMouseMove = useCallback((e) => {
    if (zoomLevel <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPanOrigin({ x, y });
  }, [zoomLevel]);

  const toggleZoom = useCallback(() => {
    setZoomLevel(prev => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  }, []);

  if (!comparisonIds || comparisonIds.length === 0) return null;

  const photoA = photos.find(p => p.id === comparisonIds[0]);
  const photoB = comparisonIds.length === 2 ? photos.find(p => p.id === comparisonIds[1]) : null;

  if (!photoA) return null;

  // Helper to extract and format stats safely
  const getStats = (photo) => {
    if (!photo || !photo.exif) return { camera: '--', aperture: '--', shutter: '--', iso: '--', focal: '--' };
    const e = photo.exif;
    return {
      camera: e.Make ? `${e.Make} ${e.Model || ''}`.trim().substring(0, 20) : 'Unknown Camera',
      aperture: formatAperture(e.FNumber) || '--',
      shutter: formatShutter(e.ExposureTime) || '--',
      iso: e.ISO || e.ISOSpeedRatings ? `ISO ${e.ISO || e.ISOSpeedRatings}` : '--',
      focal: e.FocalLength ? `${Number(e.FocalLength).toFixed(0)}mm` : '--'
    };
  };

  const statsA = getStats(photoA);
  const statsB = getStats(photoB);

  const sharedImageStyle = {
    transform: zoomLevel > 1 ? `scale(${zoomLevel})` : 'none',
    transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
    transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), transform-origin 0.08s linear',
    cursor: zoomLevel > 1 ? 'crosshair' : 'zoom-in',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'auto',
    userSelect: 'none'
  };

  return (
    <div className="comparison-feed" ref={feedRef}>
      <div className="comparison-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3>EXIF Showdown</h3>
          {photoB && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {zoomLevel > 1 ? `Synchronized ${zoomLevel}x Focus Inspection` : 'Click photo or toggle zoom to sync pan'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {photoB && (
            <div style={{ display: 'inline-flex', gap: '2px', background: 'var(--surface2)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border2)' }}>
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setZoomLevel(lvl)}
                  style={{
                    background: zoomLevel === lvl ? 'var(--accent)' : 'transparent',
                    color: zoomLevel === lvl ? '#000' : 'var(--text-muted)',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lvl}x
                </button>
              ))}
            </div>
          )}
          <button className="clear-compare-btn" onClick={onClear}>Close</button>
        </div>
      </div>
      
      <div className="comparison-layout">
        {/* Left Photo */}
        <div 
          className="compare-slot" 
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsPanning(true)}
          onMouseLeave={() => setIsPanning(false)}
          onClick={toggleZoom}
          title="Click to toggle sync zoom level"
        >
          <img src={photoA.src} alt={photoA.name} style={sharedImageStyle} />
          <div className="slot-label">A</div>
          <button className="remove-slot-btn" onClick={(e) => { e.stopPropagation(); onRemove(photoA.id); }}>✕</button>
        </div>

        {/* Center Stats Column */}
        <div className="compare-stats-board">
          <div className="stat-row title-row">
            <span className="stat-val a">{statsA.camera}</span>
            <span className="stat-label">Camera</span>
            <span className="stat-val b">{photoB ? statsB.camera : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-val a">{statsA.aperture}</span>
            <span className="stat-label">Aperture</span>
            <span className="stat-val b">{photoB ? statsB.aperture : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-val a">{statsA.shutter}</span>
            <span className="stat-label">Shutter</span>
            <span className="stat-val b">{photoB ? statsB.shutter : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-val a">{statsA.iso}</span>
            <span className="stat-label">ISO</span>
            <span className="stat-val b">{photoB ? statsB.iso : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-val a">{statsA.focal}</span>
            <span className="stat-label">Focal</span>
            <span className="stat-val b">{photoB ? statsB.focal : '--'}</span>
          </div>
        </div>

        {/* Right Photo */}
        {photoB ? (
          <div 
            className="compare-slot" 
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsPanning(true)}
            onMouseLeave={() => setIsPanning(false)}
            onClick={toggleZoom}
            title="Click to toggle sync zoom level"
          >
            <img src={photoB.src} alt={photoB.name} style={sharedImageStyle} />
            <div className="slot-label">B</div>
            <button className="remove-slot-btn" onClick={(e) => { e.stopPropagation(); onRemove(photoB.id); }}>✕</button>
          </div>
        ) : (
          <div className="compare-slot empty">
            <div className="pulse-ring"></div>
            <p>Select a second photo to compare EXIF</p>
          </div>
        )}
      </div>
    </div>
  );
}