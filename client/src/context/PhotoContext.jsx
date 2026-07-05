import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { computeStats } from '../utils/stats.js';

const PhotoContext = createContext();

export function PhotoProvider({ children }) {
  const [photos, setPhotos] = useState([]);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [comparisonIds, setComparisonIds] = useState([]);

  const hasPhotos = photos.length > 0;
  const stats = useMemo(() => computeStats(photos), [photos]);
  const photoIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const activePhoto = photos.find((p) => p.id === activePhotoId) || null;

  const handleClearAll = useCallback(() => {
    setPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.src)); return []; });
    setActivePhotoId(null);
    setComparisonIds([]);
  }, []);

  const handleClearCompare = useCallback(() => setComparisonIds([]), []);

  const handleToggleCompare = useCallback((id) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) return prev.filter(compId => compId !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  return (
    <PhotoContext.Provider value={{
      photos, setPhotos, activePhotoId, setActivePhotoId, comparisonIds, setComparisonIds,
      hasPhotos, stats, photoIds, activePhoto, handleClearAll, handleClearCompare, handleToggleCompare
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export const usePhotos = () => useContext(PhotoContext);