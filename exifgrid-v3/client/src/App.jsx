import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import DropZone from './components/DropZone.jsx';
import Gallery from './components/Gallery.jsx';
import Lightbox from './components/Lightbox.jsx';
import { ingestPhotoMeta, createPhotoId } from './utils/exifReader.js';
import { computeStats } from './utils/stats.js';
import { syncPreferences } from './api/settings.js';

const DEFAULT_POLAROID = {
  caption: '',
  font: "'Caveat', cursive",
  exifToggles: ['camera', 'aperture', 'shutter', 'iso'],
};

/**
 * App.jsx — State Controller (replaces vanilla global photos[] + initEventHandlers).
 *
 * Vanilla architecture:
 *   - Mutable global `photos` array in state.js
 *   - DOM updates scattered across gallery.js, lightbox.js, card.js
 *
 * React architecture:
 *   - Single `photos` useState array is the source of truth
 *   - Child components receive data + callbacks (props down, events up)
 *   - Visibility driven by `hasPhotos` boolean instead of body.gallery-active class
 */
export default function App() {
  const [photos, setPhotos] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [polaroidSettings, setPolaroidSettings] = useState(DEFAULT_POLAROID);

  const fileInputRef = useRef(null);
  const syncTimerRef = useRef(null);

  const hasPhotos = photos.length > 0;
  const stats = useMemo(() => computeStats(photos), [photos]);
  const photoIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const activePhoto = photos.find((p) => p.id === activePhotoId) || null;

  // Theme class on <html> — same target as vanilla toggleTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', isLight);
  }, [isLight]);

  // Gallery-active body class — replaces vanilla _showGallery / _hideGallery
  useEffect(() => {
    document.body.classList.toggle('gallery-active', hasPhotos);
  }, [hasPhotos]);

  // Debounced JSON sync to Express (preferences only, no images)
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      syncPreferences({
        theme: isLight ? 'light' : 'dark',
        polaroid: polaroidSettings,
      }).catch(() => {
        /* offline-friendly — local state remains authoritative */
      });
    }, 800);

    return () => clearTimeout(syncTimerRef.current);
  }, [isLight, polaroidSettings]);

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList?.length) return;

    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    const placeholders = incoming.map((file) => {
      const id = createPhotoId();
      const src = URL.createObjectURL(file);
      return { id, file, src, status: 'loading', exif: {}, name: file.name, size: file.size };
    });

    setPhotos((prev) => [...prev, ...placeholders]);

    // Async EXIF pipeline — replaces vanilla readExif() per file
    for (const placeholder of placeholders) {
      try {
        const meta = await ingestPhotoMeta(placeholder.file, placeholder.src);
        setPhotos((prev) =>
          prev.map((p) => (p.id === placeholder.id ? { ...p, ...meta } : p))
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) => (p.id === placeholder.id ? { ...p, status: 'ready' } : p))
        );
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
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.src));
      return [];
    });
    setActivePhotoId(null);
  }, []);

  const handleToggleTheme = useCallback(() => setIsLight((v) => !v), []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Header
        isLight={isLight}
        hasPhotos={hasPhotos}
        onToggleTheme={handleToggleTheme}
        onClearAll={handleClearAll}
        onAddPhotos={handleBrowse}
        fileInputRef={fileInputRef}
        onFilesSelected={handleFiles}
      />

      <StatsBar
        count={stats.count}
        exifCount={stats.exifCount}
        cameraLabel={stats.cameraLabel}
        visible={hasPhotos}
      />

      {!hasPhotos && (
        <DropZone onFilesSelected={handleFiles} onBrowse={handleBrowse} />
      )}

      {hasPhotos && (
        <Gallery
          photos={photos}
          onOpenPhoto={setActivePhotoId}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      <Lightbox
        photo={activePhoto}
        photoIds={photoIds}
        polaroidSettings={polaroidSettings}
        onPolaroidSettingsChange={setPolaroidSettings}
        onClose={() => setActivePhotoId(null)}
        onNavigate={setActivePhotoId}
      />

      <footer>
        <span className="footer-text">
          ExifGrid — all processing is local. Zero bytes leave your device.
        </span>
        <span className="footer-text">v3.0</span>
      </footer>
    </>
  );
}
