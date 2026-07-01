let imageQueue = 0;
let batchTimer = null;

export function trackAction(type, data = null) {
  // 1. Opt-out check (Reads from localStorage, defaults to false)
  const isOptedOut = localStorage.getItem('telemetry_opt_out') === 'true';
  if (isOptedOut) return;

  // 2. Only track image drops
  if (type === 'image_drop' && data && typeof data.count === 'number') {
    imageQueue += data.count;
    
    // Debounce the network request for 3 seconds to batch rapid drag-and-drops
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(sendBatchToServer, 3000);
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