import React, { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [isLight, setIsLight] = useState(false);
  const [viewMode, setViewMode] = useState('gallery');
  const [gridProgress, setGridProgress] = useState({ active: false, percent: 0 });
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', isLight);
  }, [isLight]);

  return (
    <UIContext.Provider value={{
      isLight, setIsLight, viewMode, setViewMode,
      gridProgress, setGridProgress, showBatchModal, setShowBatchModal,
      showInsights, setShowInsights, isZipping, setIsZipping,
      zipProgress, setZipProgress,
      showMetadataModal, setShowMetadataModal
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);