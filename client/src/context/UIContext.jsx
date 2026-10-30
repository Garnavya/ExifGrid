import React, { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export const THEMES = {
  MASTER: 'master',
  LEICA: 'leica',
  COPENHAGEN: 'copenhagen',
  FUJIFILM: 'fujifilm',
  TOKYO: 'tokyo'
};

export const THEME_CONFIG = [
  {
    id: THEMES.MASTER,
    name: 'Master Atelier',
    icon: '✨',
    tag: 'Flagship Unified Studio',
    desc: 'The complete synthesis of all 4: Leica carbon chassis & red dot, Copenhagen serif elegance, Fuji amber safelight glow, and Tokyo frosted glass telemetry.',
    accent: '#e11d27',
    swatch: '#090a0e'
  },
  {
    id: THEMES.LEICA,
    name: 'Leica Monochrom',
    icon: '🔴',
    tag: 'Precision Darkroom',
    desc: 'Matte carbon obsidian, Leica signal red, surgical precision & mono tabular readouts.',
    accent: '#e11d27',
    swatch: '#090a0d'
  },
  {
    id: THEMES.COPENHAGEN,
    name: 'Copenhagen Gallery',
    icon: '🏛️',
    tag: 'Nordic Art Museum',
    desc: 'Generous negative space, editorial serif typography, warm sandstone & porcelain ivory.',
    accent: '#c9aa71',
    swatch: '#141517'
  },
  {
    id: THEMES.FUJIFILM,
    name: 'Fuji Safelight',
    icon: '🎞️',
    tag: 'Analogue Chemistry',
    desc: 'Warm tungsten darkroom safelight, burnt umber, Kodak gold & vintage contact sheet stamps.',
    accent: '#ffaa33',
    swatch: '#13100e'
  },
  {
    id: THEMES.TOKYO,
    name: 'Tokyo Studio',
    icon: '⚡',
    tag: 'Pro Workstation',
    desc: 'Capture One Pro × Linear dark glass, electric cyan rim lighting & high-density micro badges.',
    accent: '#00f0ff',
    swatch: '#090b10'
  }
];

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('exifgrid_theme') || THEMES.MASTER;
  });

  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('exifgrid_light') === 'true';
  });

  const [viewMode, setViewMode] = useState('gallery');
  const [showJourneyMap, setShowJourneyMap] = useState(false);
  const [gridProgress, setGridProgress] = useState({ 
    active: false, 
    percent: 0, 
    current: 0, 
    total: 0, 
    currentName: '' 
  });
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  // Sync active theme to root DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('exifgrid_theme', theme);
  }, [theme]);

  // Sync light / dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', isLight);
    localStorage.setItem('exifgrid_light', String(isLight));
  }, [isLight]);

  return (
    <UIContext.Provider value={{
      theme, setTheme, THEMES, THEME_CONFIG,
      isLight, setIsLight, viewMode, setViewMode,
      showJourneyMap, setShowJourneyMap,
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
