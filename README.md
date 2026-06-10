# ExifGrid v3

Full-stack monorepo migration of ExifGrid v2 — React + Vite + Express.

# ExifGrid 📷

A fast, privacy-first, client-side EXIF metadata viewer.

## The Problem

I was tired of endlessly clicking the arrow keys in my default photo gallery just to check basic camera metadata (like aperture, shutter speed, and ISO) for a bunch of photos. I wanted a quicker way to see everything at a glance. ExifGrid solves this by letting you drag and drop multiple images to view their EXIF data instantly. Plus, it processes everything locally right in the browser—zero bytes ever leave your device.

## Features (v2.0: The "Misty Monochrome" Update)

- **100% Client-Side:** Uses the HTML5 `FileReader` API for ultimate privacy.
- **Drag and Drop:** Quickly inspect multiple photos at once.
- **Glassmorphic UI:** A dual-theme (Light/Dark) interface featuring an ambient, slow-flowing gradient background and adaptive `backdrop-filter` glass components.
- **Dynamic Color Extraction:** Uses a microscopic 1x1 Canvas rendering trick to extract the dominant color of uploaded photos, generating perfectly matched misty shadows and glows behind the images.
- **GSAP Choreography:** Smooth, bouncy card entrances and orchestrated lightbox reveals powered by Greensock.
- **Interactive GPS Mini-Maps:** Integrated Leaflet.js maps that automatically render and theme themselves if an image contains GPS coordinates.
- **Keyboard Navigation:** Seamlessly cycle through the gallery using Left/Right arrow keys without closing the lightbox.

## Tech Stack

- HTML5 (including the `<canvas>` API and FileReader)
- CSS3 (Custom Properties, Grid, Flexbox, Animations)
- Vanilla JavaScript (single bundled file)
- [EXIF.js](https://github.com/exif-js/exif-js) (Metadata extraction)
- [GSAP](https://gsap.com/) (Animation orchestration)
- [Leaflet.js](https://leafletjs.com/) (Interactive mapping)

## Development Process

This project was built to practice architectural layout, client-side file handling, and memory management, as well as to create a personal Pinterest-inspired gallery of personally clicked images. 

The core UI boilerplate and vanilla JavaScript logic were initially generated using AI assistance. I acted as the architect—defining the privacy-first requirements and refining the UI/UX. 

As the application grew into v2.0, I manually refined the client-side architecture to handle complex DOM lifecycles. Significant engineering went into advanced memory management and rendering optimization, including dynamically handling garbage collection for `URL.createObjectURL()` to prevent memory leaks during heavy batch uploads.

## Setup

Simply clone the repository and open `index.html` in any modern web browser. No build steps, bundlers, or local servers required.


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
