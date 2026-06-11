// 1. The Temporary Storage Array & Timer
let telemetryBatch = [];
let batchTimer = null;

export async function logAnonymousTelemetry(exif) {
  if (!exif || Object.keys(exif).length === 0) return;

  const make = exif.Make ? exif.Make.trim() : '';
  const model = exif.Model ? exif.Model.trim() : '';
  const cameraString = `${make} ${model}`.trim().substring(0, 30);
  
  const focalLength = exif.FocalLength ? `${Number(exif.FocalLength).toFixed(0)}mm` : null;

  if (!cameraString && !focalLength) return;

  // 2. Add the hardware string to our temporary queue
  telemetryBatch.push({
    camera: cameraString || 'Unknown Camera',
    focalLength: focalLength || 'Unknown Lens'
  });

  // 3. Reset the countdown timer
  if (batchTimer) clearTimeout(batchTimer);

  // 4. Wait 2 seconds. If no new photos are dropped, send the whole batch!
  batchTimer = setTimeout(() => {
    sendBatchToServer();
  }, 2000);
}

// 5. The function that actually talks to the Express Server
async function sendBatchToServer() {
  if (telemetryBatch.length === 0) return;

  // Copy the current queue and instantly empty it so it's ready for the next drop
  const payload = [...telemetryBatch];
  telemetryBatch = [];

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: payload }) // Send the whole array at once
    });
  } catch (error) {
    console.warn("Telemetry batch failed, continuing offline.");
  }
}

export async function fetchGlobalInsights() {
  try {
    const res = await fetch('/api/telemetry');
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error("Could not load global insights.", error);
    return null;
  }
}