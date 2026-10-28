const API_BASE = import.meta.env.VITE_API_URL || '';

export function trackAction(action, data = {}) {
  const consent = localStorage.getItem('exifgrid_telemetry_consent');
  if (consent !== 'granted') return;

  if (action === 'image_drop' && data.count) {
    fetch(`${API_BASE}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: data.count })
    }).catch(err => {
      console.error('Telemetry error:', err);
    });
  }
}

export async function fetchGlobalInsights() {
  try {
    const response = await fetch(`${API_BASE}/api/telemetry`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch global insights:', error);
    // Return a safe fallback so the dashboard doesn't crash
    return { images: 0 }; 
  }
}