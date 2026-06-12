import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { formatAperture, formatShutter } from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';

export default function PhotoCard({ photo, index, onOpen, onRemove, isComparing, onToggleCompare }) {
  const cardRef = useRef(null);

  const exif = photo.exif || {};
  const hasExif = Object.keys(exif).length > 0;
  const iso = exif.ISO || exif.ISOSpeedRatings;

  const fields = [
    { label: 'Aperture', val: formatAperture(exif.FNumber) },
    { label: 'Shutter', val: formatShutter(exif.ExposureTime) },
    { label: 'ISO', val: iso ? `ISO ${iso}` : null },
    { label: 'Focal', val: exif.FocalLength ? `${Number(exif.FocalLength).toFixed(0)}mm` : null },
  ].filter((f) => f.val);

  useEffect(() => {
    if (photo.status !== 'ready' || !cardRef.current) return;
    let cancelled = false;

    (async () => {
      const rgb = await extractDominantColor(photo.src);
      
      // Directly mutate DOM variables instead of using React state
      if (!cancelled && rgb && cardRef.current) {
        const styles = glowStyle(rgb, true);
        cardRef.current.style.setProperty('--card-glow', styles['--card-glow']);
        cardRef.current.style.setProperty('--card-glow-shadow', styles['--card-glow-shadow']);
      }

      if (!cancelled && cardRef.current) {
        gsap.fromTo(cardRef.current,
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.2)', delay: (index % 10) * 0.05 }
        );
      }
    })();

    return () => { cancelled = true; };
  }, [photo.status, photo.src, index]);

  if (photo.status === 'loading') {
    return <div className="card-loading" aria-label="Loading EXIF" />;
  }

  const cameraBadge = exif.Make ? `${exif.Make}${exif.Model ? ` ${exif.Model}` : ''}`.trim().substring(0, 24) : null;

  return (
    <div
      ref={cardRef}
      className="photo-card"
      style={{ opacity: 0 }}
      onClick={() => onOpen(photo.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(photo.id)}
    >
      {/* Compare Button */}
      <button 
        type="button" 
        className={`compare-btn ${isComparing ? 'active' : ''}`} 
        onClick={(e) => { e.stopPropagation(); onToggleCompare(photo.id); }}
        title="Compare photo"
      >
        ◫
      </button>

      {/* Existing Remove Button */}
      <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}>✕</button>
      
      <img src={photo?.src} alt={photo?.name || 'Photo'} />
      
      {/* THE RESTORED CODE: Camera Badge (Top Left) */}
      {cameraBadge && <div className="camera-badge">{cameraBadge}</div>}

      {/* THE RESTORED CODE: EXIF Overlay (Bottom) */}
      <div className="photo-overlay">
        <div className="photo-filename">{photo.name}</div>
        {hasExif ? (
          <div className="exif-grid">
            {fields.map(f => (
              <div key={f.label} className="exif-item">
                <span className="exif-label">{f.label}</span>
                <span className="exif-val">{f.val}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="no-exif-badge">No EXIF</span>
        )}
      </div>
    </div>
  );
}