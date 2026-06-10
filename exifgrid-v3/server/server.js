/**
 * ExifGrid v3 — Stateless Express API layer.
 *
 * This server handles JSON preference proxying ONLY.
 * No image binaries, multipart uploads, or file storage are accepted.
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' })); // Small JSON payloads only

/**
 * GET /api/settings/sync
 * Returns an empty preferences object for fresh clients.
 * Stateless: no database — each client owns its session state in React.
 */
app.get('/api/settings/sync', (_req, res) => {
  res.json({
    ok: true,
    preferences: null,
    message: 'Stateless endpoint — POST your preferences to validate and echo.',
  });
});

/**
 * POST /api/settings/sync
 * Validates and echoes JSON preferences (theme, polaroid caption, font, EXIF toggles).
 * Images are never accepted on this route.
 */
app.post('/api/settings/sync', (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: 'Body must be a JSON object.' });
  }

  // Reject any attempt to send binary / base64 image payloads.
  const forbiddenKeys = ['image', 'file', 'blob', 'dataUrl', 'base64', 'src'];
  for (const key of forbiddenKeys) {
    if (key in body) {
      return res.status(400).json({
        ok: false,
        error: `Key "${key}" is not allowed — this API proxies JSON preferences only.`,
      });
    }
  }

  const preferences = {
    theme: body.theme === 'light' || body.theme === 'dark' ? body.theme : 'dark',
    polaroid: {
      caption: typeof body.polaroid?.caption === 'string' ? body.polaroid.caption.slice(0, 40) : '',
      font: typeof body.polaroid?.font === 'string' ? body.polaroid.font : "'Caveat', cursive",
      exifToggles: Array.isArray(body.polaroid?.exifToggles)
        ? body.polaroid.exifToggles.filter((t) =>
            ['camera', 'aperture', 'shutter', 'iso'].includes(t)
          )
        : ['camera', 'aperture', 'shutter', 'iso'],
    },
    syncedAt: new Date().toISOString(),
  };

  res.json({ ok: true, preferences });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'exifgrid-server', version: '3.0.0' });
});

app.listen(PORT, () => {
  console.log(`ExifGrid API listening on http://localhost:${PORT}`);
});
