import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import L from 'leaflet';
import ImageFilters from './ImageFilters.jsx';
import { formatAperture, formatBytes, formatExifDate, formatShutter } from '../utils/formatters.js';
import { extractDominantColor, glowStyle } from '../utils/colorExtract.js';
import { useKeyboardNav } from '../hooks/useKeyboardNav.js';
import { useDownload } from '../hooks/useDownload.js';
import { stripExifData } from '../utils/exifStripper.js';
import { downloadPolaroid, generatePolaroidDataURL } from '../utils/polaroid.js'; 
import { WATERMARK_STYLES, generateWatermarkDataURL, downloadWatermarkedPhoto } from '../utils/watermark.js';
import { processDustDiagnostic, DUST_MODES, SENSITIVITY_LEVELS } from '../utils/dustSpotter.js';
import { processFalseColorDiagnostic, FALSE_COLOR_MODES, IRE_LEGEND, ZONE_LEGEND } from '../utils/falseColor.js';
import { createMapTileLayer, MAP_STYLES } from '../utils/mapConfig.js';
import AIAnalysisModal from './AIAnalysisModal';
import ChromaticDonut from './ChromaticDonut.jsx';
import SunTracker from './SunTracker.jsx';

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
    createMapTileLayer(MAP_STYLES.GOOGLE_STREETS).addTo(map);
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
  const { downloadFile } = useDownload();
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

  // Export Mode: 'polaroid' | 'stamp' | 'museum' | 'film'
  const [exportMode, setExportMode] = useState('polaroid');
  // Lightbox View Mode: 'photo' (full enlarged) | 'export' (full artifact) | 'split' (side-by-side)
  const [lightboxView, setLightboxView] = useState('photo');

  // Visual EXIF Watermark & Brand Stamp state
  const [watermarkPreview, setWatermarkPreview] = useState(null);
  const [watermarkStyle, setWatermarkStyle] = useState(WATERMARK_STYLES.LEICA_WHITE);
  const [watermarkArtist, setWatermarkArtist] = useState('');
  const [watermarkCamera, setWatermarkCamera] = useState('');
  const [isGeneratingWatermark, setIsGeneratingWatermark] = useState(false);

  // Optical & Exposure Diagnostic Tool States (R3 & R4)
  const [diagnosticMode, setDiagnosticMode] = useState('off'); // 'off' | 'dust' | 'false_color'

  // Sensor & Lens Dust Spotter State (R3)
  const [dustDataUrl, setDustDataUrl] = useState(null);
  const [dustMode, setDustMode] = useState(DUST_MODES.INVERTED);
  const [dustSensitivity, setDustSensitivity] = useState(SENSITIVITY_LEVELS.HIGH);
  const [dustStats, setDustStats] = useState({ spotCount: 0, cleanlinessRating: '' });
  const [isProcessingDust, setIsProcessingDust] = useState(false);

  // Cinematic False-Color Exposure & Zone System State (R4)
  const [falseColorDataUrl, setFalseColorDataUrl] = useState(null);
  const [falseColorMode, setFalseColorMode] = useState(FALSE_COLOR_MODES.CINEMA_IRE);
  const [falseColorStats, setFalseColorStats] = useState(null);
  const [isProcessingFalseColor, setIsProcessingFalseColor] = useState(false);
  
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
    setWatermarkPreview(null);
    setWatermarkArtist(photo?.exif?.Artist || '');
    setWatermarkCamera(photo?.exif?.Model || photo?.exif?.Make || '');
    setDiagnosticMode('off');
    setDustDataUrl(null);
    setFalseColorDataUrl(null);
    setLightboxView('photo'); // Always open in full enlarged photo view
    
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
      const nameParts = photo.name.split('.');
      const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
      const baseName = nameParts.join('.');
      downloadFile(scrubbedBlob, `${baseName}_scrubbed.${ext}`);
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

  useEffect(() => {
    if (!photo?.src || exportMode !== 'stamp') return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const dataUrl = await generateWatermarkDataURL(photo, {
          style: watermarkStyle,
          artist: watermarkArtist,
          cameraModel: watermarkCamera
        });
        if (!cancelled) setWatermarkPreview(dataUrl);
      } catch (err) {
        console.error("Watermark preview generation failed", err);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [photo, exportMode, watermarkStyle, watermarkArtist, watermarkCamera]);

  const handleWatermarkDownload = async () => {
    if (!photo) return;
    setIsGeneratingWatermark(true);
    try {
      await downloadWatermarkedPhoto(photo, {
        style: watermarkStyle,
        artist: watermarkArtist,
        cameraModel: watermarkCamera
      });
    } catch (err) {
      console.error('Failed to generate watermarked photo:', err);
      alert('Failed to generate visual brand stamp.');
    } finally {
      setIsGeneratingWatermark(false);
    }
  };

  // Sensor Dust Spotting Analysis (R3)
  useEffect(() => {
    if (!photo?.src || diagnosticMode !== 'dust') return;
    let cancelled = false;
    setIsProcessingDust(true);

    const timer = setTimeout(async () => {
      try {
        const res = await processDustDiagnostic(photo.src, {
          mode: dustMode,
          sensitivity: dustSensitivity
        });
        if (!cancelled) {
          setDustDataUrl(res.dataUrl);
          setDustStats({ spotCount: res.spotCount, cleanlinessRating: res.cleanlinessRating });
        }
      } catch (err) {
        console.error('Dust spotting analysis failed:', err);
      } finally {
        if (!cancelled) setIsProcessingDust(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [photo, diagnosticMode, dustMode, dustSensitivity]);

  // Cinematic False-Color & Zone System Exposure Analysis (R4)
  useEffect(() => {
    if (!photo?.src || diagnosticMode !== 'false_color') return;
    let cancelled = false;
    setIsProcessingFalseColor(true);

    const timer = setTimeout(async () => {
      try {
        const res = await processFalseColorDiagnostic(photo.src, {
          mode: falseColorMode
        });
        if (!cancelled) {
          setFalseColorDataUrl(res.dataUrl);
          setFalseColorStats(res.stats);
        }
      } catch (err) {
        console.error('False-color exposure analysis failed:', err);
      } finally {
        if (!cancelled) setIsProcessingFalseColor(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [photo, diagnosticMode, falseColorMode]);

  const handleDownloadDiagnostic = () => {
    const activeUrl = diagnosticMode === 'dust' ? dustDataUrl : falseColorDataUrl;
    if (!activeUrl) return;
    const baseName = (photo.name || 'image').replace(/\.[^/.]+$/, '');
    const tag = diagnosticMode === 'dust' ? 'Dust_Inspection' : 'FalseColor_IRE';
    const link = document.createElement('a');
    link.download = `${tag}_${baseName}.jpg`;
    link.href = activeUrl;
    link.click();
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

            {/* View Switcher Controls */}
            <div style={{
              display: 'flex',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => setLightboxView('photo')}
                style={{
                  padding: '4px 10px',
                  background: lightboxView === 'photo' ? 'var(--surface)' : 'transparent',
                  border: lightboxView === 'photo' ? '1px solid var(--border)' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: lightboxView === 'photo' ? 'bold' : 'normal',
                  color: lightboxView === 'photo' ? 'var(--accent)' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                🔍 Enlarged Photo
              </button>
              <button
                type="button"
                onClick={() => setLightboxView('export')}
                style={{
                  padding: '4px 10px',
                  background: lightboxView === 'export' ? 'var(--surface)' : 'transparent',
                  border: lightboxView === 'export' ? '1px solid var(--border)' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: lightboxView === 'export' ? 'bold' : 'normal',
                  color: lightboxView === 'export' ? 'var(--accent)' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                🖼️ Export Preview
              </button>
              <button
                type="button"
                onClick={() => setLightboxView('split')}
                style={{
                  padding: '4px 10px',
                  background: lightboxView === 'split' ? 'var(--surface)' : 'transparent',
                  border: lightboxView === 'split' ? '1px solid var(--border)' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: lightboxView === 'split' ? 'bold' : 'normal',
                  color: lightboxView === 'split' ? 'var(--accent)' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                ◫ Split View
              </button>
            </div>

            {/* Optical & Exposure Diagnostic Tool Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid var(--border2)',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => setDiagnosticMode('off')}
                title="Standard photographic view"
                style={{
                  padding: '4px 8px',
                  background: diagnosticMode === 'off' ? 'var(--surface)' : 'transparent',
                  border: diagnosticMode === 'off' ? '1px solid var(--border)' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: diagnosticMode === 'off' ? 'bold' : 'normal',
                  color: diagnosticMode === 'off' ? 'var(--text)' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                👁️ Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiagnosticMode('dust');
                  if (lightboxView !== 'photo') setLightboxView('photo');
                }}
                title="Sensor & Lens Dust Spotting Aid (Laplacian Filter)"
                style={{
                  padding: '4px 8px',
                  background: diagnosticMode === 'dust' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  border: diagnosticMode === 'dust' ? '1px solid #ef4444' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: diagnosticMode === 'dust' ? 'bold' : 'normal',
                  color: diagnosticMode === 'dust' ? '#ef4444' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                🔍 Dust Spotter
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiagnosticMode('false_color');
                  if (lightboxView !== 'photo') setLightboxView('photo');
                }}
                title="Cinematic False-Color & Ansel Adams Zone System Exposure Heatmap"
                style={{
                  padding: '4px 8px',
                  background: diagnosticMode === 'false_color' ? 'rgba(0, 220, 0, 0.25)' : 'transparent',
                  border: diagnosticMode === 'false_color' ? '1px solid #00dc00' : 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: diagnosticMode === 'false_color' ? 'bold' : 'normal',
                  color: diagnosticMode === 'false_color' ? '#00dc00' : 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                🎨 False-Color IRE
              </button>
            </div>

            <button type="button" className="lb-close" onClick={handleClose}>✕</button>
          </div>
      
          <div className="lb-body">
            
            {/* LEFT SIDE: Image Preview Area */}
            <div className="lb-img-wrap" ref={imgWrapRef}>
              {lightboxView === 'photo' && (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  {diagnosticMode === 'dust' ? (
                    dustDataUrl ? (
                      <img
                        src={dustDataUrl}
                        alt="Dust Diagnostic"
                        className="zoomable-img"
                        style={{ maxHeight: '82vh', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {isProcessingDust ? '🔬 Running Laplacian High-Frequency Equalization...' : 'Initializing Dust Diagnostic...'}
                      </div>
                    )
                  ) : diagnosticMode === 'false_color' ? (
                    falseColorDataUrl ? (
                      <img
                        src={falseColorDataUrl}
                        alt="False Color Exposure"
                        className="zoomable-img"
                        style={{ maxHeight: '82vh', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {isProcessingFalseColor ? '🎨 Computing Cinema IRE & Zone System Heatmap...' : 'Initializing Exposure Heatmap...'}
                      </div>
                    )
                  ) : (
                    <img
                      ref={imgRef}
                      id="lb-img"
                      className={`zoomable-img ${filterClass}`}
                      src={photo.src}
                      alt={photo.name}
                      onClick={() => setEnlarged(true)}
                      style={{ maxHeight: '82vh', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {/* Floating Diagnostic HUD when Dust Spotter is active */}
                  {diagnosticMode === 'dust' && (
                    <div className="diagnostic-hud">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                        🔍 DUST AID
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className={`diagnostic-chip ${dustMode === DUST_MODES.INVERTED ? 'active' : ''}`}
                          onClick={() => setDustMode(DUST_MODES.INVERTED)}
                        >
                          Inverted (B&W)
                        </button>
                        <button
                          type="button"
                          className={`diagnostic-chip ${dustMode === DUST_MODES.FLUORESCENT ? 'active' : ''}`}
                          onClick={() => setDustMode(DUST_MODES.FLUORESCENT)}
                        >
                          Neon Pink
                        </button>
                        <button
                          type="button"
                          className={`diagnostic-chip ${dustMode === DUST_MODES.DARKFIELD ? 'active' : ''}`}
                          onClick={() => setDustMode(DUST_MODES.DARKFIELD)}
                        >
                          Darkfield
                        </button>
                      </div>

                      <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>SENSITIVITY:</span>
                        {[SENSITIVITY_LEVELS.LOW, SENSITIVITY_LEVELS.MEDIUM, SENSITIVITY_LEVELS.HIGH, SENSITIVITY_LEVELS.EXTREME].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            className={`diagnostic-chip ${dustSensitivity === lvl ? 'active' : ''}`}
                            onClick={() => setDustSensitivity(lvl)}
                            style={{ padding: '2px 7px', fontSize: '10px' }}
                          >
                            {lvl.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

                      <button
                        type="button"
                        onClick={handleDownloadDiagnostic}
                        style={{
                          background: 'rgba(239, 68, 68, 0.25)',
                          border: '1px solid #ef4444',
                          color: '#fff',
                          borderRadius: '16px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        💾 Save Report
                      </button>
                    </div>
                  )}

                  {/* Floating Diagnostic HUD when False-Color IRE is active */}
                  {diagnosticMode === 'false_color' && (
                    <div className="diagnostic-hud">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#00dc00', fontWeight: 'bold' }}>
                        🎨 EXPOSURE
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className={`diagnostic-chip ${falseColorMode === FALSE_COLOR_MODES.CINEMA_IRE ? 'active' : ''}`}
                          onClick={() => setFalseColorMode(FALSE_COLOR_MODES.CINEMA_IRE)}
                        >
                          Cinema IRE
                        </button>
                        <button
                          type="button"
                          className={`diagnostic-chip ${falseColorMode === FALSE_COLOR_MODES.ZONE_SYSTEM ? 'active' : ''}`}
                          onClick={() => setFalseColorMode(FALSE_COLOR_MODES.ZONE_SYSTEM)}
                        >
                          Ansel Adams 10-Zone
                        </button>
                      </div>

                      <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

                      {falseColorStats && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#ff4444' }}>Clip: {falseColorStats.blownPercent}%</span>
                          <span style={{ color: '#00dc00' }}>18% Gray: {falseColorStats.midGrayPercent}%</span>
                          <span style={{ color: '#ff69b4' }}>Skin: {falseColorStats.skinTonePercent}%</span>
                          <span style={{ color: '#c084fc' }}>Crush: {falseColorStats.crushedPercent}%</span>
                        </div>
                      )}

                      <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

                      <button
                        type="button"
                        onClick={handleDownloadDiagnostic}
                        style={{
                          background: 'rgba(0, 220, 0, 0.25)',
                          border: '1px solid #00dc00',
                          color: '#fff',
                          borderRadius: '16px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        💾 Save Map
                      </button>
                    </div>
                  )}
                </div>
              )}

              {lightboxView === 'export' && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  {exportMode === 'polaroid' && (
                    polaroidPreview ? (
                      <img
                        src={polaroidPreview}
                        alt="Polaroid Preview"
                        className="zoomable-img"
                        style={{ cursor: 'default', filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.6))', maxHeight: '82vh' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                        Rendering Polaroid Preview...
                      </div>
                    )
                  )}

                  {exportMode === 'stamp' && (
                    watermarkPreview ? (
                      <img
                        src={watermarkPreview}
                        alt="Brand Stamp Preview"
                        className="zoomable-img"
                        style={{ cursor: 'default', filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.6))', maxHeight: '82vh' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                        Applying Brand Stamp Preview...
                      </div>
                    )
                  )}
                </div>
              )}

              {lightboxView === 'split' && (
                <div className="compare-container" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', gap: '24px', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="compare-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minWidth: 0 }}>
                    <img
                      ref={imgRef}
                      id="lb-img"
                      className={`zoomable-img ${filterClass}`}
                      src={photo.src}
                      alt={photo.name}
                      onClick={() => setEnlarged(true)}
                    />
                  </div>

                  <div className="compare-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minWidth: 0 }}>
                    {exportMode === 'polaroid' && (
                      polaroidPreview ? (
                        <img src={polaroidPreview} alt="Polaroid Live Preview" className="zoomable-img" style={{ cursor: 'default', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }} />
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>Rendering Polaroid...</div>
                      )
                    )}

                    {exportMode === 'stamp' && (
                      watermarkPreview ? (
                        <img src={watermarkPreview} alt="Brand Stamp Live Preview" className="zoomable-img" style={{ cursor: 'default', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }} />
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>Applying Stamp...</div>
                      )
                    )}
                  </div>
                </div>
              )}
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

                {/* Golden Hour & Sun Elevation Tracker */}
                <SunTracker dateString={photo.exif?.DateTimeOriginal} lat={lat} lon={lon} />
                
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

                {/* Chromatic Color Composition & Radial Donut */}
                <ChromaticDonut photoSrc={photo.src} photoName={photo.name} />

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
                    
                    {/* Mode Switcher Tabs */}
                    <div className="generator-tab-bar">
                      <button 
                        type="button" 
                        className={`gen-tab-btn ${exportMode === 'polaroid' ? 'active' : ''}`}
                        onClick={() => {
                          setExportMode('polaroid');
                          if (lightboxView === 'photo') setLightboxView('export');
                        }}
                      >
                        🖼️ Polaroid
                      </button>
                      <button 
                        type="button" 
                        className={`gen-tab-btn ${exportMode === 'stamp' ? 'active' : ''}`}
                        onClick={() => {
                          setExportMode('stamp');
                          if (lightboxView === 'photo') setLightboxView('export');
                        }}
                      >
                        🏷️ Brand Stamp
                      </button>
                    </div>

                    {exportMode === 'polaroid' ? (
                      <>
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
                      </>
                    ) : exportMode === 'stamp' ? (
                      <>
                        <div className="ps-title" style={{ color: '#f43f5e' }}>Visual EXIF Brand Stamp</div>
                        
                        <div className="ps-label">Stamp Aesthetic Style</div>
                        <select
                          className="ps-select"
                          value={watermarkStyle}
                          onChange={(e) => setWatermarkStyle(e.target.value)}
                        >
                          <option value={WATERMARK_STYLES.LEICA_WHITE}>Leica-Style Minimalist White Letterbox</option>
                          <option value={WATERMARK_STYLES.OBSIDIAN_BLACK}>Matte Obsidian Black Letterbox</option>
                          <option value={WATERMARK_STYLES.FLOATING_GLASS}>Floating Frosted Glass Inset Badge</option>
                          <option value={WATERMARK_STYLES.HASSELBLAD_BORDER}>Hasselblad Modern Border</option>
                        </select>

                        <div className="ps-label">Camera Brand Label</div>
                        <input
                          type="text"
                          className="ps-input"
                          placeholder="E.g., SONY ILCE-7RM5"
                          value={watermarkCamera}
                          onChange={(e) => setWatermarkCamera(e.target.value)}
                        />

                        <div className="ps-label">Photographer / Creator Credit</div>
                        <input
                          type="text"
                          className="ps-input"
                          placeholder="Your Name / Studio..."
                          value={watermarkArtist}
                          onChange={(e) => setWatermarkArtist(e.target.value)}
                        />

                        <div style={{
                          marginTop: '10px',
                          padding: '8px 10px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border2)',
                          borderRadius: '6px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>Exposure Cluster:</span>
                          <span style={{ color: 'var(--text)' }}>
                            {[
                              photo.exif?.FocalLength && `${Math.round(photo.exif.FocalLength)}mm`,
                              photo.exif?.FNumber && formatAperture(photo.exif.FNumber),
                              photo.exif?.ExposureTime && formatShutter(photo.exif.ExposureTime),
                              photo.exif?.ISO && `ISO ${photo.exif.ISO}`
                            ].filter(Boolean).join(' | ') || 'Default Optics'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="polaroid-btn"
                          onClick={handleWatermarkDownload}
                          disabled={isGeneratingWatermark}
                          style={{
                            marginTop: '16px',
                            background: 'linear-gradient(135deg, #1f1d2b, #2d2b3f)',
                            color: '#f43f5e',
                            borderColor: '#e11d48'
                          }}
                        >
                          {isGeneratingWatermark ? 'Applying Stamp...' : '🏷️ Download Stamped Photo'}
                        </button>
                      </>
                    ) : null}
                    
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

      {/* Fullscreen Immersion Theater Zoom */}
      {enlarged && (
        <div 
          className="lb-fullscreen-overlay"
          onClick={() => setEnlarged(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '24px'
          }}
        >
          <img
            src={photo.src}
            alt={photo.name}
            className={filterClass}
            onClick={(e) => {
              e.stopPropagation();
              setEnlarged(false);
            }}
            style={{
              maxWidth: '96vw',
              maxHeight: '94vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
              borderRadius: '6px',
              cursor: 'zoom-out',
              userSelect: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'rgba(18, 18, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '6px 16px',
            borderRadius: '20px',
            letterSpacing: '0.04em',
            pointerEvents: 'none'
          }}>
            Click anywhere or press Esc to close zoom
          </div>
        </div>
      )}

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