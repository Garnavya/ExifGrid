import React from 'react';
import ComparisonFeed from './ComparisonFeed.jsx';
import Gallery from './Gallery.jsx';
import { usePhotos } from '../context/PhotoContext.jsx';

export default function MainWorkspace({ filteredPhotos, handleRemovePhoto }) {
  const { photos, comparisonIds, handleClearCompare, handleToggleCompare, setActivePhotoId } = usePhotos();

  return (
    <div style={{ display: 'block' }}>
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
  );
}
