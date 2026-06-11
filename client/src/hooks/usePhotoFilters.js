// client/src/hooks/usePhotoFilters.js
import { useState, useMemo } from 'react';

export function usePhotoFilters(photos) {
  const [filters, setFilters] = useState({
    camera: 'All',
    minFocal: 'All',
    maxFocal: 'All',
    maxAperture: 'All'
  });

  // Extract unique cameras
  const availableCameras = useMemo(() => {
    const makes = photos.map(p => p.exif?.Make).filter(Boolean).map(make => make.trim());
    return ['All', ...new Set(makes)];
  }, [photos]);

  // Extract and sort unique focal lengths
  const availableFocals = useMemo(() => {
    const focals = photos.map(p => p.exif?.FocalLength).filter(f => f != null).map(Number);
    return [...new Set(focals)].sort((a, b) => a - b);
  }, [photos]);

  // Extract and sort unique apertures
  const availableApertures = useMemo(() => {
    const apertures = photos.map(p => p.exif?.FNumber).filter(a => a != null).map(Number);
    return [...new Set(apertures)].sort((a, b) => a - b);
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (filters.camera === 'All' && filters.minFocal === 'All' && filters.maxFocal === 'All' && filters.maxAperture === 'All') {
      return photos;
    }

    return photos.filter(photo => {
      const exif = photo.exif || {};
      
      if (filters.camera !== 'All' && exif.Make?.trim() !== filters.camera) return false;
      if (filters.minFocal !== 'All' && (!exif.FocalLength || Number(exif.FocalLength) < Number(filters.minFocal))) return false;
      if (filters.maxFocal !== 'All' && (!exif.FocalLength || Number(exif.FocalLength) > Number(filters.maxFocal))) return false;
      if (filters.maxAperture !== 'All' && (!exif.FNumber || Number(exif.FNumber) > Number(filters.maxAperture))) return false;

      return true;
    });
  }, [photos, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ camera: 'All', minFocal: 'All', maxFocal: 'All', maxAperture: 'All' });
  };

  return { 
    filters, 
    updateFilter, 
    clearFilters, 
    filteredPhotos, 
    availableCameras,
    availableFocals,       // NEW
    availableApertures,    // NEW
    isFiltering: filters.camera !== 'All' || filters.minFocal !== 'All' || filters.maxFocal !== 'All' || filters.maxAperture !== 'All'
  };
}