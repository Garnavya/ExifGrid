/**
 * Header — migrated from vanilla header + initEventHandlers theme/clear/add wiring.
 *
 * Vanilla: document.getElementById + addEventListener in initEventHandlers().
 * React:   receives callbacks via props; no direct DOM queries.
 */
export default function Header({
  isLight,
  hasPhotos,
  onToggleTheme,
  onClearAll,
  onAddPhotos,
  fileInputRef,
  onFilesSelected,
}) {
  return (
    <header>
      <div className="header-actions">
        <button className="btn" type="button" onClick={onToggleTheme}>
          {isLight ? '🌙 Dark' : '☀️ Light'}
        </button>

        {hasPhotos && (
          <button className="btn" type="button" onClick={onClearAll}>
            Clear all
          </button>
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
