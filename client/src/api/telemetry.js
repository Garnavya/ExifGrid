export function trackAction(action, data = {}) {
  const consent = localStorage.getItem('exifgrid_telemetry_consent');
  if (consent !== 'granted') return;

  if (action === 'image_drop' && data.count) {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: data.count })
    }).catch(err => {
      console.error('Telemetry error:', err);
    });
  }
}