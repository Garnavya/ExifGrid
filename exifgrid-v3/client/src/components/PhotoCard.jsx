import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  formatAperture,
  formatShutter,
} from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';

/**
 * PhotoCard — migrated from vanilla buildCard().
 *
 * Vanilla: created DOM nodes, set innerHTML for EXIF grid, GSAP on img.onload.
 * React:   declarative JSX + useRef for GSAP target + useState for glow CSS vars.
 */
export default function PhotoCard({ photo, index, onOpen, onRemove }) {
  const cardRef = useRef(null);
  const [glowVars, setGlowVars] = useState({});

  const exif = photo.exif || {};
  const hasExif = Object.keys(exif).length > 0;

  const fields = [
    { label: 'Aperture', val: formatAperture(exif.FNumber) },
    { label: 'Shutter', val: formatShutter(exif.ExposureTime) },
    { label: 'ISO', val: exif.ISOSpeedRatings ? `ISO ${exif.ISOSpeedRatings}` : null },
    { label: 'Focal', val: exif.FocalLength ? `${exif.FocalLength.toFixed(0)}mm` : null },
  ].filter((f) => f.val);

  // GSAP entrance — replaces vanilla gsap.fromTo(card, ...) on img.onload
  useEffect(() => {
    if (photo.status !== 'ready' || !cardRef.current) return;

    let cancelled = false;

    (async () => {
      const rgb = await extractDominantColor(photo.src);
      if (!cancelled && rgb) setGlowVars(glowStyle(rgb, true));

      if (!cancelled && cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, scale: 0.9, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: 'back.out(1.2)',
            delay: (index % 10) * 0.05,
          }
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [photo.status, photo.src, index]);

  if (photo.status === 'loading') {
    return <div className="card-loading" aria-label="Loading EXIF" />;
  }

  const cameraBadge = exif.Make
    ? `${exif.Make}${exif.Model ? ` ${exif.Model}` : ''}`.trim().substring(0, 24)
    : null;

  return (
    <div
      ref={cardRef}
      className="photo-card"
      style={{ opacity: 0, ...glowVars }}
      onClick={() => onOpen(photo.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(photo.id)}
    >
      <button
        type="button"
        className="remove-btn"
        aria-label="Remove photo"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(photo.id);
        }}
      >
        ✕
      </button>

      <img src={photo.src} alt={photo.name} loading="lazy" />

      {cameraBadge && <div className="camera-badge">{cameraBadge}</div>}

      <div className="photo-overlay">
        <div className="photo-filename">{photo.name}</div>
        {hasExif && fields.length > 0 ? (
          <div className="exif-grid">
            {fields.map((f) => (
              <div key={f.label} className="exif-item">
                <span className="exif-label">{f.label}</span>
                <span className="exif-val">{f.val}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="no-exif-badge">{hasExif ? 'EXIF found' : 'No EXIF'}</span>
        )}
      </div>
    </div>
  );
}
