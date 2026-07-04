// client/src/hooks/usePhotoManager.js
import { useState, useCallback } from 'react';
import { ingestPhotoMeta, createPhotoId } from '../utils/exifReader.js';
import { trackAction } from '../api/telemetry.js';

export function usePhotoManager() {
  const [photos, setPhotos] = useState([]);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [gridProgress, setGridProgress] = useState({ active: false, percent: 0 });

  const handleFiles = useCallback(async (fileList, fileInputRef = null) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    
    setGridProgress({ active: true, percent: 5 });
    
    const placeholders = incoming.map((file) => ({
      id: createPhotoId(), 
      file, 
      src: URL.createObjectURL(file), 
      status: 'loading', 
      exif: {}, 
      name: file.name, 
      size: file.size
    }));
    
    setPhotos((prev) => [...prev, ...placeholders]);
    
    // Clear the input so the same file can be selected again if needed
    if (fileInputRef?.current) fileInputRef.current.value = '';
    
    let processed = 0;
    const batchApertures = []; 
    
    for (const placeholder of placeholders) {
      try {
        const meta = await ingestPhotoMeta(placeholder.file, placeholder.src);
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, ...meta } : p)));
        
        if (meta.exif && meta.exif.FNumber) {
           batchApertures.push(Number(meta.exif.FNumber));
        }
      } catch {
        setPhotos((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, status: 'ready' } : p)));
      }
      processed++;
      setGridProgress({ active: true, percent: 5 + (processed / placeholders.length) * 95 });
    }
    
    trackAction('image_drop', { count: placeholders.length, apertures: batchApertures });
    
    setTimeout(() => setGridProgress(prev => ({ ...prev, active: false })), 400);
    setTimeout(() => setGridProgress({ active: false, percent: 0 }), 700);
  }, []);

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
  }, []);

  const clearAllPhotos = useCallback(() => {
    setPhotos((prev) => { 
      prev.forEach((p) => URL.revokeObjectURL(p.src)); 
      return []; 
    });
    setActivePhotoId(null);
  }, []);

  return {
    photos,
    activePhotoId,
    gridProgress,
    setActivePhotoId,
    handleFiles,
    handleRemovePhoto,
    clearAllPhotos
  };
}