// client/src/components/FilterMatrix.jsx
import React from 'react';

export default function FilterMatrix({ 
  filters, 
  updateFilter, 
  clearFilters, 
  availableCameras,
  availableFocals,
  availableApertures,
  isFiltering, 
  totalVisible 
}) {
  return (
    <div className="filter-matrix-wrapper">
      <div className="filter-controls-bar">
        
        {/* Camera Selector */}
        <div className="filter-group">
          <label>Make</label>
          <select value={filters.camera} onChange={(e) => updateFilter('camera', e.target.value)}>
            {availableCameras.map(cam => <option key={cam} value={cam}>{cam}</option>)}
          </select>
        </div>

        {/* Dynamic Focal Length Dropdowns */}
        <div className="filter-group">
          <label>Focal (mm)</label>
          <select value={filters.minFocal} onChange={(e) => updateFilter('minFocal', e.target.value)}>
            <option value="All">Min</option>
            {availableFocals.map(f => <option key={`min-${f}`} value={f}>{f}</option>)}
          </select>
          <span className="separator">-</span>
          <select value={filters.maxFocal} onChange={(e) => updateFilter('maxFocal', e.target.value)}>
            <option value="All">Max</option>
            {availableFocals.map(f => <option key={`max-${f}`} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Dynamic Aperture Dropdown */}
        <div className="filter-group">
          <label>Max f/</label>
          <select value={filters.maxAperture} onChange={(e) => updateFilter('maxAperture', e.target.value)}>
            <option value="All">All</option>
            {availableApertures.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Action / Readout */}
        <div className="filter-actions">
          <span className="results-badge">{totalVisible} Photo{totalVisible !== 1 ? 's' : ''}</span>
          {isFiltering && (
            <button className="clear-filters-btn" onClick={clearFilters}>✕ Clear</button>
          )}
        </div>

      </div>
    </div>
  );
}