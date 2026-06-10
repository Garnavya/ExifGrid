/**
 * DropZone — migrated from vanilla onDragOver / onDrop / drop-zone click.
 *
 * Vanilla: toggled .drag-over class via getElementById.
 * React:   isDragOver boolean state drives the className.
 */
export default function DropZone({ onFilesSelected, onBrowse }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    onFilesSelected(e.dataTransfer.files);
  };

  return (
    <div
      id="drop-zone"
      onClick={onBrowse}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onBrowse()}
    >
      <div className="drop-inner">
        <div className="drop-icon">📷</div>
        <div>
          <div className="drop-title">Reveal the Lens.</div>
          <div className="drop-sub">
            Drag & drop high-res photography to instantly extract hidden metadata.
            <br />
            <span className="drop-accent">
              100% Local Processing · Zero Uploads
            </span>
          </div>
        </div>
        <div className="drop-hints">
          <span className="hint-pill">JPEG · TIFF</span>
          <span className="hint-pill">No upload</span>
          <span className="hint-pill">Multiple files</span>
          <span className="hint-pill">Click or drag</span>
        </div>
      </div>
    </div>
  );
}
