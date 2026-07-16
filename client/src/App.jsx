import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import DropZone from './components/DropZone.jsx';
import Lightbox from './components/Lightbox.jsx';
import CopyrightToast from './components/CopyrightToast.jsx';
import BatchSettingsModal from './components/BatchSettingsModal.jsx';
import FilterMatrix from './components/FilterMatrix.jsx';
import InsightsDashboard from './components/InsightsDashboard.jsx';
import GridLoader from './components/GridLoader.jsx';
import ConsentModal from './components/ConsentModal.jsx';
import PrivacySettingsModal from './components/PrivacySettingsModal.jsx';
import MainWorkspace from './components/MainWorkspace.jsx';
import JSZip from 'jszip';
import MetadataForm from './components/MetadataForm.jsx';

import { injectCopyrightData } from './utils/exifInjector.js';
import { UIProvider, useUI } from './context/UIContext.jsx';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext.jsx';
import { PhotoProvider, usePhotos } from './context/PhotoContext.jsx';
import { usePhotoFilters } from './hooks/usePhotoFilters.js';
import { useDownload } from './hooks/useDownload.js';

import { createBatchPolaroidZip } from './utils/batchProcessor.js';
import { ingestPhotoMeta, createPhotoId } from './utils/exifReader.js';
import { generateCSVBlob } from './utils/csvExport.js';
import { trackAction } from './api/telemetry.js';

// --- Inner Application Logic ---
function ExifGridMain() {
  const { 
    isLight, setIsLight, viewMode, setViewMode, gridProgress, setGridProgress,
    showBatchModal, setShowBatchModal, showInsights, setShowInsights,
    isZipping, setIsZipping, zipProgress, setZipProgress,
    showMetadataModal, setShowMetadataModal
  } = useUI();

  const [showCopyrightToast, setShowCopyrightToast] = useState(false);

  const { 
    showConsent, showPrivacySettings, isOptedIn, 
    setShowPrivacySettings, handleConsentChoice, handleToggleTelemetry 
  } = useTelemetry();

  const { 
    photos, setPhotos, activePhotoId, setActivePhotoId, 
    hasPhotos, stats, photoIds, activePhoto, handleClearAll 
  } = usePhotos();

  const { downloadFile } = useDownload();
  const fileInputRef = useRef(null);

  const { 
    filters, updateFilter, clearFilters, filteredPhotos, 
    availableCameras, availableFocals, availableApertures, isFiltering 
  } = usePhotoFilters(photos);

  const handleExportCSV = () => {
    const csvData = generateCSVBlob(photos);
    if (csvData) {
      downloadFile(csvData.blob, csvData.filename);
      trackAction('csv_export'); 
    }
  };

  const handleFiles = useCallback(async (fileList) => {
  if (!fileList?.length) return;
  const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
  if (!incoming.length) return;
  
  setGridProgress({ active: true, percent: 5 });
  
  const placeholders = incoming.map((file) => ({
    id: createPhotoId(), file, src: URL.createObjectURL(file), status: 'loading', exif: {}, name: file.name, size: file.size
  }));
  
  setPhotos((prev) => [...prev, ...placeholders]);
  if (fileInputRef.current) fileInputRef.current.value = '';
  
  let processed = 0;
  const protectedUploads = []; // 1. Array to track protected files
  
  for (const placeholder of placeholders) {
    try {
      const meta = await ingestPhotoMeta(placeholder.file, placeholder.src);
      setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, ...meta } : p)));

      // 2. Check for industry-standard Copyright or Artist tags
      if (meta.exif && (meta.exif.Copyright || meta.exif.Artist)) {
        protectedUploads.push({
          name: meta.name,
          artist: meta.exif.Artist || 'Unknown Artist',
          copyright: meta.exif.Copyright || 'Copyrighted'
        });
      }

    } catch {
      setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, status: 'ready' } : p)));
    }
    processed++;
    setGridProgress({ active: true, percent: 5 + (processed / placeholders.length) * 95 });
  }

  // 3. Fire the custom toast if protected files exist
  if (protectedUploads.length > 0) {
    setShowCopyrightToast(true);
  }

  trackAction('image_drop', { count: placeholders.length });
  setTimeout(() => setGridProgress(prev => ({ ...prev, active: false })), 400);
  setTimeout(() => setGridProgress({ active: false, percent: 0 }), 700);
}, [setPhotos, setGridProgress]); 

  const handleRemovePhoto = useCallback((id) => {
    setGridProgress({ active: true, percent: 30 });
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.src) URL.revokeObjectURL(target.src);
      return prev.filter((p) => p.id !== id);
    });
    setActivePhotoId((current) => (current === id ? null : current));
    setTimeout(() => {
      setGridProgress({ active: true, percent: 100 });
      setTimeout(() => setGridProgress(prev => ({ ...prev, active: false })), 300);
      setTimeout(() => setGridProgress({ active: false, percent: 0 }), 600);
    }, 50);
  }, [setPhotos, setActivePhotoId, setGridProgress]);

  const executeBatchDownload = useCallback(async (settings) => {
    setShowBatchModal(false);
    setIsZipping(true);
    setZipProgress(0);
    try {
      const zipBlob = await createBatchPolaroidZip(photos, settings, setZipProgress);
      if (zipBlob) {
        downloadFile(zipBlob, `ExifGrid_Polaroids_${new Date().getTime()}.zip`);
      }
      trackAction('polaroid_gen', { count: photos.length });
    } catch (error) {
      console.error("Batch processing failed", error);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [photos, downloadFile, setShowBatchModal, setIsZipping, setZipProgress]);

  const executeMetadataExport = async (metadataObject) => {
    setShowMetadataModal(false);
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder("ExifGrid_Protected");

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(photo.file);
        });

        // Pass the entire metadata object to the injector
        const injectedBase64 = injectCopyrightData(base64, metadataObject);

        const res = await fetch(injectedBase64);
        const blob = await res.blob();

        folder.file(`Protected_${photo.name}`, blob);
        setZipProgress(Math.round(((i + 1) / photos.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `ExifGrid_Protected_${new Date().getTime()}.zip`);

    } catch (error) {
      console.error("Metadata export failed", error);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <>
      <GridLoader active={gridProgress.active} percent={gridProgress.percent} />
      
      {showConsent && <ConsentModal onChoice={handleConsentChoice} />}
      
      {showPrivacySettings && (
        <PrivacySettingsModal 
          isOptedIn={isOptedIn}
          onToggle={handleToggleTelemetry}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      <Header
        isLight={isLight}
        hasPhotos={hasPhotos}
        onToggleTheme={() => setIsLight((v) => !v)}
        onClearAll={handleClearAll}
        onAddPhotos={() => fileInputRef.current?.click()}
        onExportCSV={handleExportCSV}
        onBatchDownload={() => setShowBatchModal(true)}
        onOpenMetadata={() => setShowMetadataModal(true)} 
        fileInputRef={fileInputRef}
        onFilesSelected={handleFiles}
        viewMode={viewMode}
        onToggleView={() => setViewMode(prev => prev === 'gallery' ? 'map' : 'gallery')}
        onOpenInsights={() => setShowInsights(true)}
      />
      
      <StatsBar count={stats.count} exifCount={stats.exifCount} cameraLabel={stats.cameraLabel} visible={hasPhotos} />
      
      {hasPhotos && (
        <FilterMatrix 
          filters={filters} updateFilter={updateFilter} clearFilters={clearFilters}
          availableCameras={availableCameras} availableFocals={availableFocals}
          availableApertures={availableApertures} isFiltering={isFiltering}
          totalVisible={filteredPhotos.length}
        />
      )}
      
      {!hasPhotos && <DropZone onFilesSelected={handleFiles} onBrowse={() => fileInputRef.current?.click()} />}
      
      {hasPhotos && <MainWorkspace filteredPhotos={filteredPhotos} handleRemovePhoto={handleRemovePhoto} />}
      
      {showInsights && <InsightsDashboard photos={photos} onClose={() => setShowInsights(false)} />}
      
      {showBatchModal && <BatchSettingsModal onCancel={() => setShowBatchModal(false)} onConfirm={executeBatchDownload} />}
      
      {showMetadataModal && (
        <MetadataForm 
          onCancel={() => setShowMetadataModal(false)} 
          onApply={executeMetadataExport} 
        />
      )}

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
      
      <Lightbox photo={activePhoto} photoIds={photoIds} onClose={() => setActivePhotoId(null)} onNavigate={setActivePhotoId} />
      
      {showCopyrightToast && (
        <CopyrightToast onClose={() => setShowCopyrightToast(false)} />
      )}
      
      <footer>
        <span className="footer-text">ExifGrid processes everything locally. Only anonymous image counts are tracked (if opted in).</span>
        <div className="privacy-toggle-wrap" onClick={() => setShowPrivacySettings(true)}>
          <span className="footer-text" style={{ textDecoration: 'underline' }}>Privacy Settings</span>
          <span className={`privacy-indicator ${isOptedIn ? 'active' : 'inactive'}`} title={isOptedIn ? "Telemetry Active" : "Telemetry Disabled"}></span>
        </div>
        <span className="footer-text">v3.0</span>
      </footer>
    </>
  );
}

// --- Outer Provider Wrapper ---
export default function App() {
  return (
    <TelemetryProvider>
      <UIProvider>
        <PhotoProvider>
          <ExifGridMain />
        </PhotoProvider>
      </UIProvider>
    </TelemetryProvider>
  );
}