import React from 'react';
import ComparisonFeed from './ComparisonFeed.jsx';
import Gallery from './Gallery.jsx';
import JourneyMap from './JourneyMap.jsx';
import { useUI } from '../context/UIContext.jsx';
import { usePhotos } from '../context/PhotoContext.jsx';

export default function MainWorkspace({ filteredPhotos, handleRemovePhoto }) {
  const { viewMode } = useUI();
  const { photos, comparisonIds, handleClearCompare, handleToggleCompare, setActivePhotoId } = usePhotos();

  if (viewMode === 'map') {
    return <JourneyMap photos={filteredPhotos} />;
  }

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