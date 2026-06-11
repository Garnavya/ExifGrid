import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { formatAperture, formatShutter } from '../utils/formatters.js';

export default function ComparisonFeed({ photos, comparisonIds, onClear, onRemove }) {
  const feedRef = useRef(null);

  useEffect(() => {
    // GSAP entrance animation whenever the feed mounts or a second photo is added
    if (comparisonIds.length > 0 && feedRef.current) {
      gsap.fromTo(feedRef.current,
        { opacity: 0, y: -20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }
      );
    }
  }, [comparisonIds.length]);

  if (!comparisonIds || comparisonIds.length === 0) return null;

  const photoA = photos.find(p => p.id === comparisonIds[0]);
  const photoB = comparisonIds.length === 2 ? photos.find(p => p.id === comparisonIds[1]) : null;

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

  return (
    <div className="comparison-feed" ref={feedRef}>
      <div className="comparison-header">
        <h3>EXIF Showdown</h3>
        <button className="clear-compare-btn" onClick={onClear}>Close</button>
      </div>
      
      <div className="comparison-layout">
        {/* Left Photo */}
        <div className="compare-slot">
          <img src={photoA.src} alt={photoA.name} />
          <div className="slot-label">A</div>
          <button className="remove-slot-btn" onClick={() => onRemove(photoA.id)}>✕</button>
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
          <div className="compare-slot">
            <img src={photoB.src} alt={photoB.name} />
            <div className="slot-label">B</div>
            <button className="remove-slot-btn" onClick={() => onRemove(photoB.id)}>✕</button>
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