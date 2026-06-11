import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import DropZone from './components/DropZone.jsx';
import ComparisonFeed from './components/ComparisonFeed.jsx';
import Gallery from './components/Gallery.jsx';
import Lightbox from './components/Lightbox.jsx';
import JourneyMap from './components/JourneyMap.jsx';
import { createBatchPolaroidZip } from './utils/batchProcessor.js';
import BatchSettingsModal from './components/BatchSettingsModal.jsx';
import { usePhotoFilters } from './hooks/usePhotoFilters.js';
import FilterMatrix from './components/FilterMatrix.jsx';
import InsightsDashboard from './components/InsightsDashboard.jsx'; 
import GridLoader from './components/GridLoader.jsx';
import { ingestPhotoMeta, createPhotoId } from './utils/exifReader.js';
import { computeStats } from './utils/stats.js';
import { syncPreferences } from './api/settings.js';
import { exportToCSV } from './utils/csvExport.js';
import { logAnonymousTelemetry } from './api/telemetry.js';

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState(null);
  
  // The new View Mode State ('gallery' or 'map')
  const [viewMode, setViewMode] = useState('gallery');

  const [gridProgress, setGridProgress] = useState({ active: false, percent: 0 });

  const fileInputRef = useRef(null);
  const syncTimerRef = useRef(null);

  const hasPhotos = photos.length > 0;
  const stats = useMemo(() => computeStats(photos), [photos]);
  const photoIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const activePhoto = photos.find((p) => p.id === activePhotoId) || null;

  const handleExportCSV = () => exportToCSV(photos);

  const [comparisonIds, setComparisonIds] = useState([]);

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showBatchModal, setShowBatchModal] = useState(false);
  
  const [showInsights, setShowInsights] = useState(false); // 2. ADDED STATE

  useEffect(() => { document.documentElement.classList.toggle('light-theme', isLight); }, [isLight]);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncPreferences({ theme: isLight ? 'light' : 'dark' }).catch(() => {});
    }, 800);
    return () => clearTimeout(syncTimerRef.current);
  }, [isLight]);

  const handleOpenBatchMenu = useCallback(() => {
    if (photos.length > 0) setShowBatchModal(true);
  }, [photos.length]);

  const { 
    filters, 
    updateFilter, 
    clearFilters, 
    filteredPhotos, 
    availableCameras,
    availableFocals,      
    availableApertures,   
    isFiltering 
  } = usePhotoFilters(photos);

const handleFiles = useCallback(async (fileList) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    // Start the loading bar at 5% instantly to show activity
    setGridProgress({ active: true, percent: 5 });

    const placeholders = incoming.map((file) => ({
      id: createPhotoId(), file, src: URL.createObjectURL(file), status: 'loading', exif: {}, name: file.name, size: file.size
    }));

    setPhotos((prev) => [...prev, ...placeholders]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    let processed = 0;
    for (const placeholder of placeholders) {
      try {
        const meta = await ingestPhotoMeta(placeholder.file, placeholder.src);
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, ...meta } : p)));
        
        // Fire and forget telemetry ping
        logAnonymousTelemetry(meta.exif);
      } catch {
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, status: 'ready' } : p)));
      }

      processed++;
      // Increment the bar based on exactly how many photos have finished
      setGridProgress({ active: true, percent: 5 + (processed / placeholders.length) * 95 });
    }

    // Smoothly hide the bar once 100% is reached
    setTimeout(() => setGridProgress(prev => ({ ...prev, active: false })), 400);
    setTimeout(() => setGridProgress({ active: false, percent: 0 }), 700);
  }, []);

  const handleRemovePhoto = useCallback((id) => {
    // Jump to 30% to indicate a layout shift is starting
    setGridProgress({ active: true, percent: 30 });

    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.src) URL.revokeObjectURL(target.src);
      return prev.filter((p) => p.id !== id);
    });
    setActivePhotoId((current) => (current === id ? null : current));

    // Simulate the masonry re-arrangement snapping into place
    setTimeout(() => {
      setGridProgress({ active: true, percent: 100 });
      setTimeout(() => setGridProgress(prev => ({ ...prev, active: false })), 300);
      setTimeout(() => setGridProgress({ active: false, percent: 0 }), 600);
    }, 50);
  }, []);

  const handleToggleCompare = useCallback((id) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(compId => compId !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id]; 
      }
      return [...prev, id];
    });
  }, []);

  const handleClearCompare = useCallback(() => setComparisonIds([]), []);

  const handleClearAll = useCallback(() => {
    setPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.src)); return []; });
    setActivePhotoId(null);
    setComparisonIds([]); 
    setViewMode('gallery'); 
  }, []);

  const executeBatchDownload = useCallback(async (settings) => {
    setShowBatchModal(false);
    setIsZipping(true);
    setZipProgress(0);

    try {
      await createBatchPolaroidZip(photos, settings, (progress) => {
        setZipProgress(progress);
      });
    } catch (error) {
      console.error("Batch processing failed", error);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [photos]);

  return (
    <>
      {/* 1. MOUNT THE LOADER AT THE VERY TOP */}
      <GridLoader active={gridProgress.active} percent={gridProgress.percent} />
      <Header
        isLight={isLight}
        hasPhotos={hasPhotos}
        onToggleTheme={() => setIsLight((v) => !v)}
        onClearAll={handleClearAll}
        onAddPhotos={() => fileInputRef.current?.click()}
        onExportCSV={handleExportCSV}
        onBatchDownload={handleOpenBatchMenu}
        fileInputRef={fileInputRef}
        onFilesSelected={handleFiles}
        viewMode={viewMode}
        onToggleView={() => setViewMode(prev => prev === 'gallery' ? 'map' : 'gallery')}
        onOpenInsights={() => setShowInsights(true)}
      />
      
      <StatsBar count={stats.count} exifCount={stats.exifCount} cameraLabel={stats.cameraLabel} visible={hasPhotos} />

      {/* Mount the Filter Matrix if photos exist */}
      {hasPhotos && (
        <FilterMatrix 
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          availableCameras={availableCameras}
          availableFocals={availableFocals}         
          availableApertures={availableApertures}   
          isFiltering={isFiltering}
          totalVisible={filteredPhotos.length}
        />
      )}
      
      {!hasPhotos && <DropZone onFilesSelected={handleFiles} onBrowse={() => fileInputRef.current?.click()} />}
      
      {/* Gallery & Comparison Feed */}
      {hasPhotos && (
        <div style={{ display: viewMode === 'gallery' ? 'block' : 'none' }}>
          
          <ComparisonFeed 
            photos={photos} 
            comparisonIds={comparisonIds} 
            onClear={handleClearCompare} 
            onRemove={handleToggleCompare} 
          />

          <Gallery 
            photos={filteredPhotos} 
            onOpenPhoto={setActivePhotoId} 
            onRemovePhoto={handleRemovePhoto} 
            comparisonIds={comparisonIds}
            onToggleCompare={handleToggleCompare}
          />
        </div>
      )}
      
      {/* Map View */}
      {hasPhotos && viewMode === 'map' && (
        <JourneyMap photos={filteredPhotos} />
      )}
      
      {/* 3. ADDED INSIGHTS COMPONENT HERE */}
      {showInsights && (
        <InsightsDashboard onClose={() => setShowInsights(false)} />
      )}

      {/* The Batch Settings Modal */}
      {showBatchModal && (
        <BatchSettingsModal 
          onCancel={() => setShowBatchModal(false)}
          onConfirm={executeBatchDownload}
        />
      )}
      
      {/* The Zipping Loading Overlay */}
      {isZipping && (
        <div className="zip-progress-overlay">
          <div className="zip-progress-box">
            <div className="spinner"></div>
            <h4>Packaging Batch...</h4>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${zipProgress}%` }}></div>
            </div>
            <span className="progress-text">{zipProgress}%</span>
          </div>
        </div>
      )}
      
      {/* Lightbox */}
      <Lightbox photo={activePhoto} photoIds={photoIds} onClose={() => setActivePhotoId(null)} onNavigate={setActivePhotoId} />
      
      <footer>
        <span className="footer-text">ExifGrid — all processing is local. Zero bytes leave your device.</span>
        <span className="footer-text">v3.0</span>
      </footer>
    </>
  );
}