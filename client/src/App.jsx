import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import DropZone from './components/DropZone.jsx';
import Gallery from './components/Gallery.jsx';
import Lightbox from './components/Lightbox.jsx';
import JourneyMap from './components/JourneyMap.jsx';
import { ingestPhotoMeta, createPhotoId } from './utils/exifReader.js';
import { computeStats } from './utils/stats.js';
import { syncPreferences } from './api/settings.js';
import { exportToCSV } from './utils/csvExport.js';

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState(null);
  
  // The new View Mode State ('gallery' or 'map')
  const [viewMode, setViewMode] = useState('gallery');

  const fileInputRef = useRef(null);
  const syncTimerRef = useRef(null);

  const hasPhotos = photos.length > 0;
  const stats = useMemo(() => computeStats(photos), [photos]);
  const photoIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const activePhoto = photos.find((p) => p.id === activePhotoId) || null;

  const handleExportCSV = () => exportToCSV(photos);

  useEffect(() => { document.documentElement.classList.toggle('light-theme', isLight); }, [isLight]);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncPreferences({ theme: isLight ? 'light' : 'dark' }).catch(() => {});
    }, 800);
    return () => clearTimeout(syncTimerRef.current);
  }, [isLight]);

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    const placeholders = incoming.map((file) => ({
      id: createPhotoId(), file, src: URL.createObjectURL(file), status: 'loading', exif: {}, name: file.name, size: file.size
    }));

    setPhotos((prev) => [...prev, ...placeholders]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    for (const placeholder of placeholders) {
      try {
        const meta = await ingestPhotoMeta(placeholder.file, placeholder.src);
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, ...meta } : p)));
      } catch {
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, status: 'ready' } : p)));
      }
    }
  }, []);

  const handleRemovePhoto = useCallback((id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.src) URL.revokeObjectURL(target.src);
      return prev.filter((p) => p.id !== id);
    });
    setActivePhotoId((current) => (current === id ? null : current));
  }, []);

  const handleClearAll = useCallback(() => {
    setPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.src)); return []; });
    setActivePhotoId(null);
    setViewMode('gallery'); // Reset to gallery if cleared
  }, []);

  return (
    <>
      <Header
        isLight={isLight}
        hasPhotos={hasPhotos}
        onToggleTheme={() => setIsLight((v) => !v)}
        onClearAll={handleClearAll}
        onAddPhotos={() => fileInputRef.current?.click()}
        onExportCSV={handleExportCSV}
        fileInputRef={fileInputRef}
        onFilesSelected={handleFiles}
        viewMode={viewMode} //  Pass current mode to Header
        onToggleView={() => setViewMode(prev => prev === 'gallery' ? 'map' : 'gallery')} //  Toggle function
      />
      
      <StatsBar count={stats.count} exifCount={stats.exifCount} cameraLabel={stats.cameraLabel} visible={hasPhotos} />
      
      {!hasPhotos && <DropZone onFilesSelected={handleFiles} onBrowse={() => fileInputRef.current?.click()} />}
      
      {/* 1. Gallery is ALWAYS mounted if there are photos, but visually hidden when map is open. 
             This prevents the heavy lag from re-rendering the entire masonry DOM. */}
      {hasPhotos && (
        <div style={{ display: viewMode === 'gallery' ? 'block' : 'none' }}>
          <Gallery photos={photos} onOpenPhoto={setActivePhotoId} onRemovePhoto={handleRemovePhoto} />
        </div>
      )}
      
      {/* 2. Map is strictly mounted/unmounted. Leaflet needs a fresh start every time to avoid bounds bugs. */}
      {hasPhotos && viewMode === 'map' && (
        <JourneyMap photos={photos} />
      )}
      
      <Lightbox photo={activePhoto} photoIds={photoIds} onClose={() => setActivePhotoId(null)} onNavigate={setActivePhotoId} />
      
      <footer>
        <span className="footer-text">ExifGrid — all processing is local. Zero bytes leave your device.</span>
        <span className="footer-text">v3.0</span>
      </footer>
    </>
  );
}