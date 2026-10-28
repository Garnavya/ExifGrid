import React, { useState, useRef, useMemo } from 'react';
import { resolveSubfolder, resolveFileName } from '../utils/batchProcessor.js';

export default function BatchSettingsModal({ photos = [], onCancel, onConfirm }) {
  const [exportFormat, setExportFormat] = useState('polaroid'); // 'polaroid' | 'rpg' | 'scrubbed' | 'original'
  const [organizeBy, setOrganizeBy] = useState('date'); // 'none' | 'date' | 'camera' | 'focal' | 'iso' | 'solar'
  const [renameFiles, setRenameFiles] = useState(false);
  const [caption, setCaption] = useState('');
  const [exifToggles, setExifToggles] = useState({
    showCamera: true,
    showLens: true,
    showAperture: true,
    showShutter: true,
    showIso: true
  });

  const inputRef = useRef(null);

  const handleToggleExif = (key) => {
    setExifToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Generate live ASCII tree preview
  const treePreview = useMemo(() => {
    if (!photos || photos.length === 0) {
      return '📦 ExifGrid_Export.zip (No photos selected)';
    }

    const sample = photos.slice(0, 3);
    const subfolderMap = new Map();

    sample.forEach((p, idx) => {
      const folder = resolveSubfolder(p, organizeBy) || 'Root';
      const fName = resolveFileName(p, idx, { exportFormat, renameFiles });
      if (!subfolderMap.has(folder)) subfolderMap.set(folder, []);
      subfolderMap.get(folder).push(fName);
    });

    const lines = ['📦 ExifGrid_Organized_Export.zip'];
    const folders = Array.from(subfolderMap.entries());

    folders.forEach(([folder, files], fIdx) => {
      const isLastFolder = fIdx === folders.length - 1;
      const folderPrefix = isLastFolder ? '└── ' : '├── ';
      const indent = isLastFolder ? '    ' : '│   ';

      if (folder === 'Root' && organizeBy === 'none') {
        files.forEach((file, fileIdx) => {
          const isLastFile = fileIdx === files.length - 1 && sample.length === photos.length;
          lines.push(`${folderPrefix}🖼️ ${file}`);
        });
      } else {
        lines.push(`${folderPrefix}📁 ${folder}/`);
        files.forEach((file, fileIdx) => {
          const isLastFile = fileIdx === files.length - 1;
          const filePrefix = isLastFile ? '└── ' : '├── ';
          lines.push(`${indent}${filePrefix}🖼️ ${file}`);
        });
      }
    });

    if (photos.length > 3) {
      lines.push(`    └── … and ${photos.length - 3} more files`);
    }

    return lines.join('\n');
  }, [photos, exportFormat, organizeBy, renameFiles]);

  const handleConfirm = () => {
    const activeExifKeys = [];
    if (exifToggles.showCamera) activeExifKeys.push('Model');
    if (exifToggles.showLens) activeExifKeys.push('FocalLength');
    if (exifToggles.showAperture) activeExifKeys.push('FNumber');
    if (exifToggles.showShutter) activeExifKeys.push('ExposureTime');
    if (exifToggles.showIso) activeExifKeys.push('ISO', 'ISOSpeedRatings');

    onConfirm({
      exportFormat,
      organizeBy,
      renameFiles,
      caption,
      exifToggles: activeExifKeys,
      ...exifToggles
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content batch-settings" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3>Automated Folder Organization & Export</h3>
          <button type="button" className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <p className="modal-desc" style={{ marginBottom: '16px' }}>
          Automatically sort, rename, and package {photos.length} photos into a structured archive.
        </p>

        {/* 1. Export Format Tabs */}
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Export Artifact Format
        </label>
        <div className="batch-format-tabs" style={{ marginTop: '6px' }}>
          <button
            type="button"
            className={`batch-format-btn ${exportFormat === 'polaroid' ? 'active' : ''}`}
            onClick={() => setExportFormat('polaroid')}
          >
            🖼️ Polaroid
          </button>
          <button
            type="button"
            className={`batch-format-btn ${exportFormat === 'rpg' ? 'active' : ''}`}
            onClick={() => setExportFormat('rpg')}
          >
            ⚔️ RPG Cards
          </button>
          <button
            type="button"
            className={`batch-format-btn ${exportFormat === 'scrubbed' ? 'active' : ''}`}
            onClick={() => setExportFormat('scrubbed')}
          >
            🔒 Scrubbed
          </button>
          <button
            type="button"
            className={`batch-format-btn ${exportFormat === 'original' ? 'active' : ''}`}
            onClick={() => setExportFormat('original')}
          >
            📁 Originals
          </button>
        </div>

        {/* 2. Folder Organization Strategy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Sort into Subfolders By
            </label>
            <select
              className="ps-select"
              value={organizeBy}
              onChange={(e) => setOrganizeBy(e.target.value)}
              style={{ marginTop: '6px' }}
            >
              <option value="none">Flat (No Subfolders)</option>
              <option value="date">📅 Date (YYYY-MM-DD)</option>
              <option value="camera">📷 Camera Make & Model</option>
              <option value="focal">🔭 Focal Length (mm)</option>
              <option value="iso">⚡ ISO Noise Gain Tiers</option>
              <option value="solar">☀️ Solar / Golden Hour Phase</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              File Renaming Rule
            </label>
            <div style={{
              marginTop: '6px',
              padding: '9px 12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }} onClick={() => setRenameFiles(!renameFiles)}>
              <input
                type="checkbox"
                checked={renameFiles}
                onChange={(e) => setRenameFiles(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                Prefix Date & Camera
              </span>
            </div>
          </div>
        </div>

        {/* 3. Live Tree Structure Preview */}
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Archive Hierarchy Preview
        </label>
        <pre className="batch-preview-tree" style={{ marginTop: '6px' }}>
          {treePreview}
        </pre>

        {/* 4. Format-Specific Options */}
        {exportFormat === 'polaroid' && (
          <div style={{ marginBottom: '16px' }}>
            <div className="caption-input-group" style={{ marginBottom: '14px' }}>
              <label>Polaroid Caption (Optional)</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="E.g., Summer Road Trip 2026"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onFocus={handleInputFocus}
              />
            </div>

            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Included EXIF Captions
            </label>
            <div className="exif-toggles-grid" style={{ marginTop: '6px', marginBottom: '8px' }}>
              {Object.entries({
                showCamera: 'Camera Model',
                showLens: 'Focal Length',
                showAperture: 'Aperture (f-stop)',
                showShutter: 'Shutter Speed',
                showIso: 'ISO Speed'
              }).map(([key, label]) => (
                <div key={key} className={`toggle-label ${exifToggles[key] ? 'active' : ''}`} onClick={() => handleToggleExif(key)}>
                  <div className="checkbox-custom"></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportFormat === 'rpg' && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#c7d2fe',
            marginBottom: '18px'
          }}>
            ⚔️ <strong>Batch RPG Minting:</strong> Automatically computes dynamic Agility, Lumens, Purity, and Reach stats, auto-detects character archetypes, and assigns holographic frames for every photo.
          </div>
        )}

        {exportFormat === 'scrubbed' && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#fef08a',
            marginBottom: '18px'
          }}>
            🔒 <strong>Privacy Scrubbing:</strong> Strips all GPS coordinates, serial numbers, camera model strings, and timestamps from every image before packaging.
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚀</span> Package & Organize Archive
          </button>
        </div>

      </div>
    </div>
  );
}
