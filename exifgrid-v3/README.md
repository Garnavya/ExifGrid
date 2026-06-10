# ExifGrid v3

Full-stack monorepo migration of ExifGrid v2 — React + Vite + Express.

## Structure

```
exifgrid-v3/
├── package.json          # Workspace root
├── client/               # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx       # State controller
│   │   ├── components/   # Header, Gallery, Lightbox, StatsBar, …
│   │   ├── utils/        # EXIF, Polaroid canvas, formatters
│   │   ├── api/          # JSON settings sync
│   │   └── css/          # Modular stylesheets
│   └── vite.config.js
└── server/               # Express JSON API (no image uploads)
    └── server.js
```

## Quick start

```bash
cd exifgrid-v3
npm install
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3001

## Privacy

All image processing and EXIF extraction run in the browser. The Express server only validates and echoes JSON preferences (`theme`, `polaroid` caption/font/toggles).
