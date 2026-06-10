import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import L from 'leaflet';
import {
  formatAperture,
  formatBytes,
  formatExifDate,
  formatShutter,
  convertDMStoDD,
} from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';
import { generatePolaroidDataURL, downloadPolaroid } from '../utils/polaroid.js';
import { useKeyboardNav } from '../hooks/useKeyboardNav.js';

const FONT_OPTIONS = [
  { value: "'Caveat', cursive", label: 'Personal (Handwritten)' },
  { value: "'DM Serif Display', serif", label: 'Elegant (Serif)' },
  { value: "'DM Sans', sans-serif", label: 'Modern (Sans-Serif)' },
  { value: 'monospace', label: 'Technical (Monospace)' },
];

function MetaSection({ title, rows }) {
  return (
    <div className="meta-section">
      <div className="meta-section-title">{title}</div>
      {rows.map((r) => (
        <div key={r.k} className="meta-row">
          <span className="meta-key">{r.k}</span>
          <span className={r.accent ? 'meta-value meta-accent' : 'meta-value'}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMap({ lat, lon }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const markerHtml =
      '<div style="background:var(--accent);width:14px;height:14px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 10px var(--accent);"></div>';
    const icon = L.divIcon({
      html: markerHtml,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([lat, lon], { icon }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lon]);

  return (
    <div id="mini-map" ref={containerRef} />
  );
}

/**
 * Lightbox — migrated from vanilla openLightbox / closeLightbox / _metaSection.
 *
 * Vanilla: getElementById, innerHTML, miniMap global, GSAP timeline.
 * React:   conditional render, refs for animation targets, useEffect for Leaflet lifecycle.
 */
export default function Lightbox({
  photo,
  photoIds,
  polaroidSettings,
  onPolaroidSettingsChange,
  onClose,
  onNavigate,
}) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const sidebarRef = useRef(null);
  const imgWrapRef = useRef(null);

  const [enlarged, setEnlarged] = useState(false);
  const [imgWrapStyle, setImgWrapStyle] = useState({});
  const [sidebarStyle, setSidebarStyle] = useState({});
  const [polaroidPreview, setPolaroidPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const isOpen = Boolean(photo);

  useKeyboardNav({
    isOpen,
    activeId: photo?.id,
    photoIds,
    onClose,
    onNavigate,
  });

  // GSAP open animation — replaces vanilla tl.to(lb) / fromTo(lbImg)
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    document.body.style.overflow = 'hidden';
    const tl = gsap.timeline();

    tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });

    if (imgRef.current) {
      tl.fromTo(
        imgRef.current,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' },
        '-=0.1'
      );
    }

    if (sidebarRef.current) {
      tl.fromTo(
        sidebarRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        '-=0.3'
      );
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, photo?.id]);

  // Dynamic color glow — replaces vanilla lbImg.onload canvas trick
  useEffect(() => {
    if (!photo?.src) return;
    let cancelled = false;

    (async () => {
      const rgb = await extractDominantColor(photo.src);
      if (cancelled || !rgb) return;
      const styles = glowStyle(rgb, false);
      setImgWrapStyle({ background: styles.background });
      setSidebarStyle({ borderLeftColor: styles.borderLeftColor });
    })();

    return () => {
      cancelled = true;
    };
  }, [photo?.src]);

  // Live Polaroid preview — replaces vanilla updatePreview + generatePolaroidDataURL
  useEffect(() => {
    if (!photo) return;
    let cancelled = false;

    (async () => {
      setPreviewLoading(true);
      const url = await generatePolaroidDataURL(photo, polaroidSettings);
      if (!cancelled) {
        setPolaroidPreview(url || '');
        setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [photo, polaroidSettings]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) {
      onClose();
      return;
    }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: onClose,
    });
  }, [onClose]);

  if (!photo) return null;

  const exif = photo.exif || {};
  const hasGps = exif.GPSLatitude && exif.GPSLongitude;
  const lat = hasGps ? convertDMStoDD(exif.GPSLatitude, exif.GPSLatitudeRef) : 0;
  const lon = hasGps ? convertDMStoDD(exif.GPSLongitude, exif.GPSLongitudeRef) : 0;

  const updatePolaroid = (patch) => {
    onPolaroidSettingsChange({ ...polaroidSettings, ...patch });
  };

  const toggleExif = (value) => {
    const toggles = polaroidSettings.exifToggles.includes(value)
      ? polaroidSettings.exifToggles.filter((t) => t !== value)
      : [...polaroidSettings.exifToggles, value];
    updatePolaroid({ exifToggles: toggles });
  };

  return (
    <div
      id="lightbox"
      ref={overlayRef}
      className="lightbox--open"
      style={{ opacity: 0 }}
    >
      <div className="lb-header">
        <div className="lb-title">{photo.name}</div>
        <button type="button" className="lb-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="lb-body">
        <div className="lb-img-wrap" ref={imgWrapRef} style={imgWrapStyle}>
          <div className="compare-container">
            <div className="compare-item">
              <span className="compare-label">Original</span>
              <img
                ref={imgRef}
                id="lb-img"
                className={`zoomable-img${enlarged ? ' enlarged' : ''}`}
                src={photo.src}
                alt={photo.name}
                onClick={() => setEnlarged((v) => !v)}
              />
            </div>
            <div className="compare-item">
              <span className="compare-label">Polaroid Preview</span>
              <img
                className={`zoomable-img polaroid-preview${enlarged ? ' enlarged' : ''}`}
                src={polaroidPreview}
                alt="Polaroid preview"
                style={{ opacity: previewLoading ? 0.5 : 1 }}
                onClick={() => setEnlarged((v) => !v)}
              />
            </div>
          </div>
        </div>

        <div className="lb-sidebar-column" ref={sidebarRef} style={sidebarStyle}>
          <div className="lb-meta">
            <MetaSection
              title="File"
              rows={[
                { k: 'Name', v: photo.name },
                { k: 'Size', v: formatBytes(photo.size) },
                { k: 'Dimensions', v: `${photo.naturalW} × ${photo.naturalH} px` },
              ]}
            />

            {(exif.Make || exif.Model || exif.LensModel) && (
              <MetaSection
                title="Camera"
                rows={[
                  exif.Make && { k: 'Make', v: exif.Make },
                  exif.Model && { k: 'Model', v: exif.Model },
                  exif.LensModel && { k: 'Lens', v: exif.LensModel },
                ].filter(Boolean)}
              />
            )}

            {(exif.FNumber || exif.ExposureTime || exif.ISOSpeedRatings || exif.FocalLength) && (
              <MetaSection
                title="Exposure"
                rows={[
                  exif.FNumber && { k: 'Aperture', v: formatAperture(exif.FNumber), accent: true },
                  exif.ExposureTime && { k: 'Shutter', v: formatShutter(exif.ExposureTime), accent: true },
                  exif.ISOSpeedRatings && { k: 'ISO', v: `ISO ${exif.ISOSpeedRatings}`, accent: true },
                  exif.FocalLength && { k: 'Focal', v: `${exif.FocalLength.toFixed(0)}mm`, accent: true },
                ].filter(Boolean)}
              />
            )}

            {exif.DateTimeOriginal && (
              <MetaSection
                title="Date & Time"
                rows={[{ k: 'Taken', v: formatExifDate(exif.DateTimeOriginal) }]}
              />
            )}

            {hasGps && (
              <div className="meta-section">
                <div className="meta-section-title">Location</div>
                <div className="meta-row">
                  <span className="meta-key">Coordinates</span>
                  <span className="meta-value">
                    {lat.toFixed(5)}°, {lon.toFixed(5)}°
                  </span>
                </div>
                <MiniMap lat={lat} lon={lon} />
                <a
                  className="gps-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  ↖ Open in Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="polaroid-settings">
            <div className="ps-title">Live Export Settings</div>

            <label className="ps-label" htmlFor="ps-caption">
              Custom Caption (Optional)
            </label>
            <input
              id="ps-caption"
              className="ps-input"
              placeholder="e.g., Happy Birthday!"
              maxLength={40}
              value={polaroidSettings.caption}
              onChange={(e) => updatePolaroid({ caption: e.target.value })}
            />

            <label className="ps-label" htmlFor="ps-font">
              Caption Vibe
            </label>
            <select
              id="ps-font"
              className="ps-select"
              value={polaroidSettings.font}
              onChange={(e) => updatePolaroid({ font: e.target.value })}
            >
              {FONT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <span className="ps-label">Include EXIF Data</span>
            <div className="ps-toggles">
              {['camera', 'aperture', 'shutter', 'iso'].map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={polaroidSettings.exifToggles.includes(key)}
                    onChange={() => toggleExif(key)}
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="polaroid-btn"
            onClick={() => downloadPolaroid(photo, polaroidSettings)}
          >
            Download Polaroid
          </button>
        </div>
      </div>
    </div>
  );
}
