import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import L from 'leaflet';
import ImageFilters from './ImageFilters.jsx';
import { formatAperture, formatBytes, formatExifDate, formatShutter } from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';
import { useKeyboardNav } from '../hooks/useKeyboardNav.js';
import { stripExifData } from '../utils/exifStripper.js';
import { downloadPolaroid, generatePolaroidDataURL } from '../utils/polaroid.js'; 
import AIAnalysisModal from './AIAnalysisModal';

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
    
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 750); 

    return () => { clearTimeout(timer); map.remove(); mapRef.current = null; };
  }, [lat, lon]);

  return <div id="mini-map" ref={containerRef} style={{ minHeight: '160px' }} />;
}

export default function Lightbox({ photo, photoIds, onClose, onNavigate }) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const sidebarRef = useRef(null);
  const imgWrapRef = useRef(null);

  const [enlarged, setEnlarged] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [polaroidCaption, setPolaroidCaption] = useState('');
  const [polaroidToggles, setPolaroidToggles] = useState([]);
  const [polaroidFont, setPolaroidFont] = useState('sans-serif');
  const [exifBold, setExifBold] = useState(true);
  const [exifItalic, setExifItalic] = useState(false);
  const [exifTextScale, setExifTextScale] = useState(1.0);
  const [polaroidPreview, setPolaroidPreview] = useState(null);
  const [isGeneratingPolaroid, setIsGeneratingPolaroid] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // New state for handling multiple image filters
  const [activeFilter, setActiveFilter] = useState('none');

  const isOpen = Boolean(photo);

  // Reset the filter and other states if the user changes photos
  useEffect(() => {
    setEnlarged(false);
    setPolaroidCaption('');
    setPolaroidPreview(null);
    setExifTextScale(1.0); 
    setShowAIModal(false);
    setActiveFilter('none'); // Reset to original image on change
    
    if (photo?.exif) {
      const standardTags = ['Model', 'FNumber', 'ExposureTime', 'ISOSpeedRatings', 'ISO'];
      const validDefaults = standardTags.filter(tag => photo.exif[tag] !== undefined);
      setPolaroidToggles(validDefaults);
    } else {
      setPolaroidToggles([]);
    }
  }, [photo]);

  const availableExifOptions = useMemo(() => {
    if (!photo?.exif) return [];
    const keys = Object.keys(photo.exif).filter(k => {
      const val = photo.exif[k];
      return (typeof val === 'string' || typeof val === 'number') && val !== '';
    });
    
    const cleanKeys = keys.filter(k => !['thumbnail', 'MakerNote', 'UserComment', 'latitude', 'longitude'].includes(k));
    
    if (photo.exif.latitude !== undefined && photo.exif.longitude !== undefined) {
      cleanKeys.push('GPS');
    }
    return [...new Set(cleanKeys)].sort();
  }, [photo]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) { onClose(); return; }
    gsap.set(overlayRef.current, { pointerEvents: 'none' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: onClose });
  }, [onClose]);

  const handleEscapeKey = useCallback(() => {
    if (showAIModal) {
      setShowAIModal(false); 
    } else if (enlarged) {
      setEnlarged(false);
    } else {
      handleClose();
    }
  }, [enlarged, handleClose, showAIModal]);

  useKeyboardNav({ isOpen, activeId: photo?.id, photoIds, onClose: handleEscapeKey, onNavigate });

  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;
    document.body.style.overflow = 'hidden';
    gsap.set(overlayRef.current, { display: 'flex', pointerEvents: 'auto', opacity: 0 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      if (imgRef.current) tl.fromTo(imgRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.1');
      if (sidebarRef.current) tl.fromTo(sidebarRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3');
    });

    return () => { document.body.style.overflow = ''; ctx.revert(); };
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

  useEffect(() => {
    if (!photo?.src) return;
    let cancelled = false;
    
    const timer = setTimeout(async () => {
      try {
        const dataUrl = await generatePolaroidDataURL(photo, {
          caption: polaroidCaption,
          exifToggles: polaroidToggles,
          font: polaroidFont,
          exifBold,
          exifItalic,
          exifTextScale
        });
        if (!cancelled) setPolaroidPreview(dataUrl);
      } catch (err) {
        console.error("Preview generation failed", err);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [photo, polaroidCaption, polaroidToggles, polaroidFont, exifBold, exifItalic, exifTextScale]);

  const handleScrubDownload = async () => {
    if (!photo) return;
    setIsScrubbing(true);
    try {
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

  const handlePolaroidDownload = async () => {
    if (!photo) return;
    setIsGeneratingPolaroid(true);
    try {
      await downloadPolaroid(photo, {
        caption: polaroidCaption,
        exifToggles: polaroidToggles,
        font: polaroidFont,
        exifBold,
        exifItalic,
        exifTextScale
      });
    } catch (err) {
      console.error('Failed to generate polaroid:', err);
      alert('Failed to generate polaroid frame.');
    } finally {
      setIsGeneratingPolaroid(false);
    }
  };

  const togglePolaroidExif = (field) => {
    setPolaroidToggles(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  if (!photo) return null;

  const exif = photo.exif || {};
  const lat = exif.latitude;
  const lon = exif.longitude;
  const hasGps = lat !== undefined && lon !== undefined;
  const iso = exif.ISO || exif.ISOSpeedRatings;

  // Determine the dynamic class based on the selected filter
  const filterClass = activeFilter !== 'none' ? `filter-${activeFilter}` : '';

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        
        <div id="lightbox" ref={overlayRef} className="lightbox--open">
          
          <div className="lb-header">
            <div className="lb-title">{photo.name}</div>
            <button type="button" className="lb-close" onClick={handleClose}>✕</button>
          </div>
      
          <div className="lb-body">
            
            {/* LEFT SIDE: Image Preview Area */}
            <div className="lb-img-wrap" ref={imgWrapRef}>
              <div className="compare-container" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', gap: '24px', alignItems: 'center', justifyContent: 'center' }}>
                
                <div className="compare-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minWidth: 0 }}>
                  <img
                    ref={imgRef}
                    id="lb-img"
                    className={`zoomable-img ${enlarged ? 'enlarged' : ''} ${filterClass}`}
                    src={photo.src}
                    alt={photo.name}
                    onClick={() => setEnlarged((v) => !v)}
                  />
                </div>

                <div className="compare-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minWidth: 0 }}>
                  {polaroidPreview ? (
                    <img 
                      src={polaroidPreview} 
                      alt="Polaroid Live Preview" 
                      className="zoomable-img" 
                      style={{ cursor: 'default', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                      Rendering Preview...
                    </div>
                  )}
                </div>

              </div>
            </div>
            
            {/* RIGHT SIDE: Sidebar / Meta Settings */}
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
                
                {photo.exif?.Artist && (
                  <div className="meta-row">
                    <span className="meta-key" style={{ color: 'var(--red)', fontWeight: 'bold' }}>Creator</span>
                    <span className="meta-value" style={{ backgroundColor: 'var(--red)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {photo.exif.Artist}
                    </span>
                  </div>
                )}

                {photo.exif?.Copyright && (
                  <div className="meta-row" style={{ position: 'relative' }}>
                    <span className="meta-key" style={{ color: 'var(--red)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Copyright
                      <span title="CMI (Copyright Management Information) is protected under 17 U.S.C. § 1202 of the DMCA. Unauthorized removal is a federal offense." style={{
                        display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
                        width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--red)',
                        fontSize: '9px', cursor: 'help'
                      }}>i</span>
                    </span>
                    <span className="meta-value" style={{ backgroundColor: 'var(--red)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {photo.exif.Copyright}
                    </span>
                  </div>
                )}

                {photo.exif?.ImageDescription && (
                  <div className="meta-row">
                    <span className="meta-key">Title</span>
                    <span className="meta-value">{photo.exif.ImageDescription}</span>
                  </div>
                )}
                
                {exif.Make && (
                  <MetaSection title="Camera" rows={[{ k: 'Make', v: exif.Make }, { k: 'Model', v: exif.Model }].filter(Boolean)} />
                )}
                
                {(exif.FNumber || exif.ExposureTime || iso) && (
                  <MetaSection
                    title="Exposure"
                    rows={[
                      exif.FNumber && { k: 'Aperture', v: formatAperture(exif.FNumber), accent: true },
                      exif.ExposureTime && { k: 'Shutter', v: formatShutter(exif.ExposureTime), accent: true },
                      iso && { k: 'ISO', v: `ISO ${iso}`, accent: true },
                    ].filter(Boolean)}
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
                
                {/* NEW: Filter & Tools Section */}
                <div className="meta-section">
                  <div className="meta-section-title">Diagnostic & Creative Filters</div>
                  <select 
                    className="ps-select"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  >
                    <optgroup label="Standard">
                      <option value="none">Original (No Filter)</option>
                      <option value="invert">Color Inversion</option>
                      <option value="bw">High Contrast B&W</option>
                      <option value="sepia">Vintage Sepia</option>
                    </optgroup>
                    <optgroup label="Diagnostic">
                      <option value="dust">Sensor Dust Aid</option>
                      <option value="thermal">Thermal Vision</option>
                    </optgroup>
                    <optgroup label="Creative">
                      <option value="cyberpunk">Cyberpunk Duotone</option>
                      <option value="glitch">Chromatic Aberration (Glitch)</option>
                      <option value="posterize">Posterize (Comic Book)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="meta-actions">
                  <button
                    type="button"
                    className="polaroid-btn"
                    onClick={handleScrubDownload}
                    disabled={isScrubbing}
                    style={{
                      borderRadius: '6px',
                      backgroundColor: '#1a1a1a',
                      color: '#ffb86c',
                      borderColor: '#333',
                      marginBottom: '16px',
                      opacity: isScrubbing ? 0.7 : 1,
                      cursor: isScrubbing ? 'wait' : 'pointer'
                    }}
                  >
                    {isScrubbing ? 'Scrubbing...' : '⬇ Scrubbed Image'}
                  </button>

                  <div className="polaroid-settings" style={{ borderRadius: '8px' }}>
                    <div className="ps-title">Polaroid Generator</div>
                    
                    <div className="ps-label">Custom Caption</div>
                    <input 
                      type="text" 
                      className="ps-input" 
                      placeholder="Add a caption..."
                      value={polaroidCaption}
                      onChange={(e) => setPolaroidCaption(e.target.value)}
                    />

                    <div className="ps-label">Font Style</div>
                    <select 
                      className="ps-select"
                      value={polaroidFont}
                      onChange={(e) => setPolaroidFont(e.target.value)}
                    >
                      <option value="sans-serif">System Sans-Serif</option>
                      <option value="'Caveat', cursive">Caveat (Handwriting)</option>
                      <option value="'Courier New', monospace">Courier New (Typewriter)</option>
                      <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                      <option value="'Impact', sans-serif">Impact (Bold)</option>
                      <option value="'Inter', sans-serif">Inter (Modern)</option>
                    </select>

                    <div className="ps-label" style={{ marginTop: '12px' }}>EXIF Text Formatting</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={exifBold} onChange={(e) => setExifBold(e.target.checked)} />
                        Bold
                      </label>
                      <label style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={exifItalic} onChange={(e) => setExifItalic(e.target.checked)} />
                        Italic
                      </label>
                    </div>

                    <div className="ps-label" style={{ marginTop: '12px' }}>EXIF Text Size: {Math.round(exifTextScale * 100)}%</div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.05" 
                      value={exifTextScale}
                      onChange={(e) => setExifTextScale(parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', marginTop: '4px' }}
                    />

                    <div className="ps-label" style={{ marginTop: '12px' }}>Include EXIF Data (Scroll for more)</div>
                    <div className="ps-toggles" style={{ 
                      maxHeight: '140px', 
                      overflowY: 'auto', 
                      padding: '8px', 
                      background: 'var(--surface2)', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border2)' 
                    }}>
                      {availableExifOptions.map(field => (
                        <label key={field} style={{ flex: '1 1 45%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <input 
                            type="checkbox" 
                            checked={polaroidToggles.includes(field)}
                            onChange={() => togglePolaroidExif(field)}
                          />
                          {field}
                        </label>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      className="polaroid-btn"
                      onClick={handlePolaroidDownload}
                      disabled={isGeneratingPolaroid}
                      style={{ marginTop: '16px' }}
                    >
                      {isGeneratingPolaroid ? 'Generating...' : '🖼️ Download Polaroid'}
                    </button>
                    
                    <button 
                      type="button" 
                      className="polaroid-btn"
                      onClick={() => setShowAIModal(true)}
                      style={{ 
                        marginTop: '16px',
                        backgroundColor: 'rgba(0, 255, 204, 0.05)', 
                        color: '#00ffcc', 
                        borderColor: 'rgba(0, 255, 204, 0.3)',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 0 15px rgba(0, 255, 204, 0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'rgba(0, 255, 204, 0.15)';
                        e.target.style.borderColor = '#00ffcc';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'rgba(0, 255, 204, 0.05)';
                        e.target.style.borderColor = 'rgba(0, 255, 204, 0.3)';
                      }}
                    >
                      ✨ AI Posture & Light Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>

      {showAIModal && (
        <AIAnalysisModal 
          imageSrc={photo.src}
          onClose={() => setShowAIModal(false)} 
        />
      )}
      
      {/* Hidden SVG Filters Array */}
      <ImageFilters />
    </div>
  );
}