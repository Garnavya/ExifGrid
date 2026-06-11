import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import L from 'leaflet';
import { formatAperture, formatBytes, formatExifDate, formatShutter } from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';
import { useKeyboardNav } from '../hooks/useKeyboardNav.js';
import { stripExifData, downloadScrubbedImage } from '../utils/exifStripper.js'; // <-- NEW IMPORT

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
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const markerHtml = '<div style="background:var(--accent);width:14px;height:14px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 10px var(--accent);"></div>';
    L.marker([lat, lon], { icon: L.divIcon({ html: markerHtml, className: '', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => { map.remove(); mapRef.current = null; };
  }, [lat, lon]);

  return <div id="mini-map" ref={containerRef} />;
}

export default function Lightbox({ photo, photoIds, onClose, onNavigate }) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const sidebarRef = useRef(null);
  const imgWrapRef = useRef(null);

  const [enlarged, setEnlarged] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false); // <-- NEW STATE
  const isOpen = Boolean(photo);

  useEffect(() => {
    setEnlarged(false);
  }, [photo?.id]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) { onClose(); return; }
    
    gsap.set(overlayRef.current, { pointerEvents: 'none' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: onClose });
  }, [onClose]);

  const handleEscapeKey = useCallback(() => {
    if (enlarged) {
      setEnlarged(false);
    } else {
      handleClose();
    }
  }, [enlarged, handleClose]);

  useKeyboardNav({ isOpen, activeId: photo?.id, photoIds, onClose: handleEscapeKey, onNavigate });

  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;
    
    document.body.style.overflow = 'hidden';
    gsap.set(overlayRef.current, { display: 'flex', pointerEvents: 'auto', opacity: 0 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });

      if (imgRef.current) {
        tl.fromTo(imgRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.1');
      }

      if (sidebarRef.current) {
        tl.fromTo(sidebarRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3');
      }
    });

    return () => { 
      document.body.style.overflow = ''; 
      ctx.revert(); 
    };
  }, [isOpen, photo?.id]);

  useEffect(() => {
    if (!photo?.src) return;
    let cancelled = false;

    (async () => {
      const rgb = await extractDominantColor(photo.src);
      if (cancelled || !rgb) return;
      
      const styles = glowStyle(rgb, false);
      if (imgWrapRef.current) imgWrapRef.current.style.background = styles.background;
      if (sidebarRef.current) sidebarRef.current.style.borderLeftColor = styles.borderLeftColor;
    })();

    return () => { cancelled = true; };
  }, [photo?.src]);

  // <-- NEW SCRUBBING FUNCTION
  const handleScrubDownload = async () => {
    if (!photo) return;
    setIsScrubbing(true);
    try {
      // Fetch the object URL back into a Blob to feed into the canvas engine
      const res = await fetch(photo.src);
      const blob = await res.blob();
      const fileLikeObject = new File([blob], photo.name, { type: blob.type });

      const scrubbedBlob = await stripExifData(fileLikeObject);
      downloadScrubbedImage(scrubbedBlob, photo.name);
    } catch (err) {
      console.error('Failed to scrub EXIF data:', err);
      alert('Failed to scrub image. Ensure it is a valid format.');
    } finally {
      setIsScrubbing(false);
    }
  };

  if (!photo) return null;

  const exif = photo.exif || {};
  const lat = exif.latitude;
  const lon = exif.longitude;
  const hasGps = lat !== undefined && lon !== undefined;
  const iso = exif.ISO || exif.ISOSpeedRatings;

  return (
    <div 
      id="lightbox" 
      ref={overlayRef} 
      className="lightbox--open"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--glass-overlay)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'none',
        flexDirection: 'column',
        pointerEvents: 'none'
      }}
    >
      <div className="lb-header">
        <div className="lb-title">{photo.name}</div>
        <button type="button" className="lb-close" onClick={handleClose} aria-label="Close">✕</button>
      </div>
      
      <div className="lb-body">
        <div className="lb-img-wrap" ref={imgWrapRef}>
          <img
            ref={imgRef}
            id="lb-img"
            className={`zoomable-img${enlarged ? ' enlarged' : ''}`}
            src={photo.src}
            alt={photo.name}
            onClick={() => setEnlarged((v) => !v)}
          />
        </div>
        
        <div className="lb-sidebar-column" ref={sidebarRef}>
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
            {(exif.FNumber || exif.ExposureTime || iso || exif.FocalLength) && (
              <MetaSection
                title="Exposure"
                rows={[
                  exif.FNumber && { k: 'Aperture', v: formatAperture(exif.FNumber), accent: true },
                  exif.ExposureTime && { k: 'Shutter', v: formatShutter(exif.ExposureTime), accent: true },
                  iso && { k: 'ISO', v: `ISO ${iso}`, accent: true },
                  exif.FocalLength && { k: 'Focal', v: `${Number(exif.FocalLength).toFixed(0)}mm`, accent: true },
                ].filter(Boolean)}
              />
            )}
            {exif.DateTimeOriginal && (
              <MetaSection
                title="Date & Time"
                rows={[{ k: 'Taken', v: formatExifDate(exif.DateTimeOriginal.toString()) }]}
              />
            )}
            {hasGps && (
              <div className="meta-section">
                <div className="meta-section-title">Location</div>
                <div className="meta-row">
                  <span className="meta-key">Coordinates</span>
                  <span className="meta-value">{lat.toFixed(5)}°, {lon.toFixed(5)}°</span>
                </div>
                <MiniMap lat={lat} lon={lon} />
                <a className="gps-link" href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noreferrer">
                  ↖ Open in Google Maps
                </a>
              </div>
            )}
            
            {/* <-- NEW BUTTON LAYOUT --> */}
            <div className="meta-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleScrubDownload}
                disabled={isScrubbing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isScrubbing ? 'wait' : 'pointer',
                  fontWeight: '600',
                  opacity: isScrubbing ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {isScrubbing ? 'Scrubbing Metadata...' : '⬇ Download Scrubbed Image'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}