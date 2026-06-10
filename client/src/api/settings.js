/**
 * JSON preference sync — proxies to Express /api/settings/sync.
 * Only theme + polaroid text settings travel over the wire (no images).
 */
export async function syncPreferences(preferences) {
  const res = await fetch('/api/settings/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Settings sync failed');
  }

  return res.json();
}
