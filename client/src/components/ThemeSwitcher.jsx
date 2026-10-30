// client/src/components/ThemeSwitcher.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useUI, THEME_CONFIG } from '../context/UIContext.jsx';
import '../css/theme-switcher.css';

export default function ThemeSwitcher() {
  const { theme, setTheme, isLight, setIsLight } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentTheme = THEME_CONFIG.find(t => t.id === theme) || THEME_CONFIG[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-switcher-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`theme-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Select Photography Studio Theme Direction"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="theme-trigger-icon">{currentTheme.icon}</span>
        <span className="theme-trigger-name">{currentTheme.name}</span>
        <span className="theme-trigger-arrow">▾</span>
      </button>

      {/* Floating Theme Chooser Dropdown */}
      {isOpen && (
        <div className="theme-dropdown" role="menu">
          <div className="theme-dropdown-header">
            <span className="theme-dropdown-title">Studio Theme Direction</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)' }}>
              Flagship + 4 Vibes
            </span>
          </div>

          <div className="theme-options-list">
            {THEME_CONFIG.map((t) => {
              const isActive = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-option-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(t.id)}
                  role="menuitem"
                >
                  <span className="theme-card-icon">{t.icon}</span>
                  <div className="theme-card-content">
                    <div className="theme-card-title-row">
                      <span className="theme-card-name">{t.name}</span>
                      {isActive && <span className="theme-card-active-check">✓</span>}
                    </div>
                    <span className="theme-card-tag">{t.tag}</span>
                    <p className="theme-card-desc">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Light / Dark Mode Toggle */}
          <div className="theme-dropdown-footer">
            <span className="theme-mode-label">Lighting Mode:</span>
            <div className="theme-mode-pills">
              <button
                type="button"
                className={`theme-mode-pill ${!isLight ? 'active' : ''}`}
                onClick={() => setIsLight(false)}
              >
                🌑 Dark
              </button>
              <button
                type="button"
                className={`theme-mode-pill ${isLight ? 'active' : ''}`}
                onClick={() => setIsLight(true)}
              >
                ☀️ Light
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
