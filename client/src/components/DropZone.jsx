import React, { useState } from 'react';

// Helper to read all entries from a directory reader (handles W3C pagination)
async function readAllEntriesFromReader(dirReader) {
  const entries = [];
  const readBatch = () => {
    return new Promise((resolve) => {
      dirReader.readEntries((batch) => resolve(batch || []), () => resolve([]));
    });
  };

  let batch;
  do {
    batch = await readBatch();
    if (batch.length > 0) entries.push(...batch);
  } while (batch.length > 0);

  return entries;
}

// Recursive helper to traverse directories and extract files
async function getFilesFromEntry(entry) {
  if (!entry) return [];
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file) => resolve(file ? [file] : []),
        () => resolve([])
      );
    });
  } else if (entry.isDirectory) {
    try {
      const dirReader = entry.createReader();
      const entries = await readAllEntriesFromReader(dirReader);
      const promises = entries.map(getFilesFromEntry);
      const filesArrays = await Promise.all(promises);
      return filesArrays.flat();
    } catch {
      return [];
    }
  }
  return [];
}

export default function DropZone({ onFilesSelected, onBrowse }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Modern API: Supports folder traversal
    if (e.dataTransfer.items) {
      const promises = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            promises.push(getFilesFromEntry(entry));
          }
        }
      }
      
      const fileArrays = await Promise.all(promises);
      const allFiles = fileArrays.flat();
      
      if (allFiles.length > 0) {
        onFilesSelected(allFiles);
      }
    } 
    // Fallback for older browsers
    else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div id="drop-zone-wrapper">
      <div 
        id="drop-zone"
        onClick={onBrowse}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragOver ? 'drag-over' : ''}
      >
        <div className="drop-inner">
          <div className="drop-icon">📁</div>
          <h3 className="drop-title">Drop photos or folders here</h3>
          <p className="drop-sub">or click to browse your files</p>
          <span className="drop-accent">Supports JPG, PNG, WEBP & RAW (Sony, Canon, Nikon, DNG)</span>
          <div className="drop-hints">
            <span className="hint-pill">Max 50MB</span>
            <span className="hint-pill">Exif Preserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}