export default function Header({
  isLight,
  hasPhotos,
  onToggleTheme,
  onClearAll,
  onAddPhotos,
  onExportCSV,
  fileInputRef,
  onFilesSelected,
}) {
  return (
    <header>
      <div className="header-actions">
        <button className="btn" type="button" onClick={onToggleTheme}>
          {isLight ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* <-- Render Export and Clear buttons only if there are photos --> */}
        {hasPhotos && (
          <>
            <button className="btn" type="button" onClick={onExportCSV}>
              ⬇ Export CSV
            </button>
            
            <button className="btn" type="button" onClick={onClearAll}>
              Clear all
            </button>
          </>
        )}

        <button className="btn btn-accent" type="button" onClick={onAddPhotos}>
          Add photos
        </button>

        <input
          ref={fileInputRef}
          type="file"
          id="file-input"
          accept="image/*"
          multiple
          onChange={(e) => {
            onFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </header>
  );
}