let imageQueue = 0;
let batchTimer = null;

export function trackAction(action, data = {}) {
  // 1. Check for explicit user consent
  const consent = localStorage.getItem('exifgrid_telemetry_consent');
  if (consent !== 'granted') return; // Silently abort if no consent

  // 2. Only process image drops
  if (action === 'image_drop' && data.count) {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: data.count })
    }).catch(err => {
      // Fail silently on the client to avoid disrupting UX
      console.error('Telemetry error:', err);
    });
  }
}

async function sendBatchToServer() {
  if (imageQueue === 0) return;

  const payload = { count: imageQueue };
  imageQueue = 0; // Reset queue after copying

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    await fetch(`${BASE_URL}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) 
    });
  } catch (error) {
    // Fail silently if offline or blocked by ad-blockers
    console.warn("Telemetry blocked or offline.");
  }
}

export async function fetchGlobalInsights() {
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${BASE_URL}/api/telemetry`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (error) {
    console.error("Could not load global insights.", error);
    return { images: 0 }; // Return safe default if it fails
  }
}