/**
 * StatsBar — migrated from vanilla updateStats() DOM text updates.
 *
 * Vanilla: wrote directly into #stat-count, #stat-exif, #stat-cameras.
 * React:   pure render from props computed by App via computeStats().
 */
export default function StatsBar({ count, exifCount, cameraLabel, visible }) {
  if (!visible) return null;

  return (
    <div id="stats-bar" className="stats-bar--visible">
      <div className="stat-item">
        <span className="stat-dot" />
        <span className="stat-val">{count}</span>
        <span>&nbsp;photos</span>
      </div>
      <div className="stat-item">
        <span className="stat-val">{exifCount}</span>
        <span>&nbsp;with EXIF</span>
      </div>
      {cameraLabel && (
        <div className="stat-item">
          <span>cameras: </span>
          <span className="stat-val">{cameraLabel}</span>
        </div>
      )}
    </div>
  );
}
