let actionQueue = { images: 0, ai: 0, polaroid: 0, csv: 0, apertures: [] };
let batchTimer = null;

// Call this function whenever a user performs an action
export function trackAction(type, data = null) {
  if (type === 'image_drop') {
    actionQueue.images += data.count; 
    if (data.apertures) actionQueue.apertures.push(...data.apertures);
  } else if (type === 'ai_run') {
    actionQueue.ai += 1;
  } else if (type === 'polaroid_gen') {
    // THE FIX: Add the specific number of photos passed in, or default to 1
    actionQueue.polaroid += (data && data.count) ? data.count : 1;
  } else if (type === 'csv_export') {
    actionQueue.csv += 1;
  }

  // Debounce the network request
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(sendBatchToServer, 3000);
}

async function sendBatchToServer() {
  if (actionQueue.images === 0 && actionQueue.ai === 0 && actionQueue.polaroid === 0 && actionQueue.csv === 0) return;

  const payload = { ...actionQueue };
  actionQueue = { images: 0, ai: 0, polaroid: 0, csv: 0, apertures: [] };

  // THE FIX: Safely fallback to localhost:3001 if the env variable is missing
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    await fetch(`${BASE_URL}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) 
    });
  } catch (error) {
    console.warn("Telemetry blocked or offline.");
  }
}

export async function fetchGlobalInsights() {
  // THE FIX: Safely fallback to localhost:3001
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${BASE_URL}/api/telemetry`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (error) {
    console.error("Could not load global insights.", error);
    return null;
  }
}