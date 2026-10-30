# ExifGrid v3 — Comprehensive Features & Technical Architecture Reference

**System:** ExifGrid v3  
**Architecture:** Privacy-First, Local-Compute Client Architecture (React + Vite + Web Workers + WebAssembly) with Optional Express Telemetry  
**Audience:** Engineers, Technical Architects, and Advanced Users  

---

## Table of Contents

1. [High-Level Architectural Blueprint](#1-high-level-architectural-blueprint)
2. [Feature Inventory & Technical Breakdown](#2-feature-inventory--technical-breakdown)
   * [Feature 01: 4K-Ready Responsive Masonry Gallery](#feature-01-4k-ready-responsive-masonry-gallery)
   * [Feature 02: Multi-Format EXIF / IPTC / TIFF Extraction Engine](#feature-02-multi-format-exif--iptc--tiff-extraction-engine)
   * [Feature 03: True RAW Camera Ingestion (Embedded Preview Extraction)](#feature-03-true-raw-camera-ingestion-embedded-preview-extraction)
   * [Feature 04: Synchronized Pan & Zoom Dual Comparison Suite ("EXIF Showdown")](#feature-04-synchronized-pan--zoom-dual-comparison-suite-exif-showdown)
   * [Feature 05: Multi-Attribute Filter Matrix & Dynamic Faceted Search](#feature-05-multi-attribute-filter-matrix--dynamic-faceted-search)
   * [Feature 06: Vintage Polaroid Generator & Batch Archive Packaging](#feature-06-vintage-polaroid-generator--batch-archive-packaging)
   * [Feature 07: Hardware-Accelerated SVG Diagnostic & Creative Filters](#feature-07-hardware-accelerated-svg-diagnostic--creative-filters)
   * [Feature 08: Privacy-Safe "Scrubbed" Image Export](#feature-08-privacy-safe-scrubbed-image-export)
   * [Feature 09: Professional IPTC / CMI Copyright Injector](#feature-09-professional-iptc--cmi-copyright-injector)
   * [Feature 10: Asset Protection & DMCA CMI Compliance Alert System](#feature-10-asset-protection--dmca-cmi-compliance-alert-system)
   * [Feature 11: Interactive Geolocation Journey Map & Route Tracer](#feature-11-interactive-geolocation-journey-map--route-tracer)
   * [Feature 12: Analytical Shooting Telemetry & "Gear DNA" Dashboard](#feature-12-analytical-shooting-telemetry--gear-dna-dashboard)
   * [Feature 13: Structured CSV Batch Metadata Exporter](#feature-13-structured-csv-batch-metadata-exporter)
   * [Feature 14: Dual-Head Local Neural Network Inference (Pose & Aesthetics via ONNX)](#feature-14-dual-head-local-neural-network-inference-pose--aesthetics-via-onnx)
   * [Feature 15: Progressive Web App (PWA) Offline Engine & Tile Caching](#feature-15-progressive-web-app-pwa-offline-engine--tile-caching)
   * [Feature 16: Fault-Tolerant React Error Boundary](#feature-16-fault-tolerant-react-error-boundary)
   * [Feature 17: Hardened Telemetry Backend & Rate Limiter](#feature-17-hardened-telemetry-backend--rate-limiter)
   * [Feature 18: Fine-Art & Historical Photography Collector Card Suite](#feature-18-fine-art--historical-photography-collector-card-suite)
3. [Technology Cross-Reference Matrix](#3-technology-cross-reference-matrix)

---

## 1. High-Level Architectural Blueprint

ExifGrid follows a **Local-First, Zero-Knowledge Computing Paradigm**. Photographers drop gigabytes of imagery onto the browser canvas; not a single byte of pixel data or EXIF header information ever leaves their local device.

```
                          ┌───────────────────────────────────────┐
                          │         User Local Environment        │
                          │  (Images, RAW Files, Folders, GPS)    │
                          └──────────────────┬────────────────────┘
                                             │ Drag-and-Drop / File Picker
                                             ▼
                          ┌───────────────────────────────────────┐
                          │     DropZone.jsx (W3C Cursor Loop)    │
                          └──────────────────┬────────────────────┘
                                             │ File Objects
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │                   App.jsx                     │
                      │  (Batch Orchestrator & Progress Coordinates)  │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
                              ▼                               ▼
               ┌──────────────────────────────┐ ┌──────────────────────────────┐
               │ exifWorker.js (Web Worker 1) │ │ onnxWorker.js (Web Worker 2) │
               │  - exifr Metadata Parsing    │ │  - MobileNetV2 Dual-Head     │
               │  - Embedded Preview Extract  │ │  - WebAssembly Runtime       │
               └──────────────┬───────────────┘ └──────────────┬───────────────┘
                              │                               │
                              ▼                               ▼
                      ┌───────────────────────────────────────────────┐
                      │              PhotoContext.jsx                 │
                      │  - Global State Centralization                │
                      │  - 1000ms Debounced IndexedDB Persistence     │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
            ┌─────────────────┴─────────────┐   ┌─────────────┴─────────────────┐
            │         Visual Layer          │   │         Export Engine         │
            │ - Masonry Grid (CSS Columns)  │   │ - Canvas Polaroid Stamping    │
            │ - Lightbox & Leaflet Map      │   │ - JSZip Batch Archiving       │
            │ - SVG Convolution Dust Spot   │   │ - Piexifjs Byte-Level Inject  │
            │ - Synchronized Dual Pan/Zoom  │   │ - CSV Metadata Streaming      │
            └───────────────────────────────┘   └───────────────────────────────┘
```

---

## 2. Feature Inventory & Technical Breakdown

---

### Feature 01: 4K-Ready Responsive Masonry Gallery

* **Purpose & Workflow:**  
  Presents large image libraries in a Pinterest-style layout that adapts from 2 columns on mobile to 8 columns on 4K/ultrawide displays without UI stutter.
* **Component & File Footprint:**  
  [`client/src/components/Gallery.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Gallery.jsx), [`client/src/components/PhotoCard.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/PhotoCard.jsx), [`client/src/css/gallery.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/gallery.css), [`client/src/css/pinterest.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/pinterest.css).
* **Underlying Technologies & Web Standards:**  
  * **CSS Multi-Column Layout (`column-count`, `column-gap`):** Avoids heavy JavaScript flexbox/grid layout computations on viewport resize.
  * **Hardware Acceleration (`transform: translateZ(0)`):** Promotes cards to separate GPU compositor layers for smooth 60 FPS scrolling.
  * **GSAP (`gsap.fromTo`):** Staggered entrance animations with cubic-bezier easing (`back.out(1.2)`).
* **Mathematical & Algorithmic Principles:**  
  * Dynamic aspect ratio containment: Card heights are computed natively by browser image decoding ratios to prevent layout shifts (CLS = 0).
  * Decoupled index animation triggers: Lifecycle triggers run purely off `photo.id` and `photo.status`, preventing full-gallery re-render storms on deletion.

---

### Feature 02: Multi-Format EXIF / IPTC / TIFF Extraction Engine

* **Purpose & Workflow:**  
  Parses binary image headers off the main thread to extract exposure settings (Aperture, Shutter Speed, ISO, Focal Length), camera equipment (Make, Model, Lens), timestamps, and GPS coordinates.
* **Component & File Footprint:**  
  [`client/src/utils/exifReader.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifReader.js), [`client/src/utils/exifWorker.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifWorker.js), [`client/src/utils/formatters.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/formatters.js).
* **Libraries & Browser APIs Used:**  
  * **`exifr`:** High-speed binary parser that only reads required TIFF/JPEG segment chunks (`APP1`, `Exif`, `GPS`, `IPTC`) rather than reading whole files into memory.
  * **Web Workers API (`Worker`):** Offloads byte-level slicing and parsing off the UI thread.
  * **Promises with Timeout Guardians:** An 8-second safety timeout prevents worker hangs on corrupted files.
* **Formatting Math:**  
  * Rational number reduction for apertures: $f = \frac{\text{numerator}}{\text{denominator}} \to \text{"f/1.4"}$.
  * Reciprocal calculation for shutter speed: if $t < 1$, computes $\frac{1}{\text{round}(1/t)}\text{s}$ (e.g. $0.004 \to \text{"1/250s"}$).

---

### Feature 03: True RAW Camera Ingestion (Embedded Preview Extraction)

* **Purpose & Workflow:**  
  Enables photographers to drop professional uncompressed camera RAW files (Sony `.ARW`, Canon `.CR2`/`.CR3`, Nikon `.NEF`, Adobe `.DNG`, Fujifilm `.RAF`) and view instant, color-calibrated previews without waiting for slow demosaicing engines.
* **Component & File Footprint:**  
  [`client/src/utils/rawParser.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/rawParser.js), [`client/src/utils/exifWorker.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifWorker.js), [`client/src/utils/exifReader.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifReader.js), [`client/src/App.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/App.jsx).
* **Underlying Technologies & Browser APIs:**  
  * **Magic Byte Binary Detection:** Validates the first 8 bytes for endianness markers (`0x4949` = Little Endian II, `0x4D4D` = Big Endian MM, `0x0010` = Canon CR2).
  * **`exifr.thumbnail(file)`:** Extracts the factory-calibrated full-size JPEG preview embedded in the RAW binary structure by camera firmware.
  * **Zero-Copy ArrayBuffer Transfer:** Moves the extracted preview byte buffer back to the main thread via Transferable Objects (`postMessage(..., [buffer])`).
  * **`URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }))`:** Replaces the un-renderable RAW file reference with a browser-native JPEG blob URL.

---

### Feature 04: Synchronized Pan & Zoom Dual Comparison Suite ("EXIF Showdown")

* **Purpose & Workflow:**  
  Allows photographers to select any two images and inspect critical eye focus, sharpness, and micro-contrast side by side.
* **Component & File Footprint:**  
  [`client/src/components/ComparisonFeed.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/ComparisonFeed.jsx), [`client/src/css/gallery.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/gallery.css).
* **Underlying Technologies & Math:**  
  * **Synchronized Normalized Origin Tracking:** Calculates relative cursor position $(x, y)$ inside bounding rect:
    $$x\% = \frac{e.\text{clientX} - \text{rect.left}}{\text{rect.width}} \times 100$$
    $$y\% = \frac{e.\text{clientY} - \text{rect.top}}{\text{rect.height}} \times 100$$
  * **Dual Matrix Scaling:** Applies identical `transform: scale(zoom)` and `transform-origin: x% y%` simultaneously to both Photo A and Photo B.
  * **Preset Focus Multipliers:** `1x` (Overview), `2x` (100% Sensor Crop), and `3x` (Eye Focus Inspection).
  * **Defensive Cleanup:** Auto-syncs with global removal handlers to prevent null dereferences.

---

### Feature 05: Multi-Attribute Filter Matrix & Dynamic Faceted Search

* **Purpose & Workflow:**  
  Instant, non-destructive filtering of photos across multiple EXIF parameters (Camera Make, Focal Length ranges, and Maximum Aperture).
* **Component & File Footprint:**  
  [`client/src/components/FilterMatrix.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/FilterMatrix.jsx), [`client/src/hooks/usePhotoFilters.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/hooks/usePhotoFilters.js), [`client/src/css/filters.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/filters.css).
* **Underlying Technologies:**  
  * **React `useMemo` Memoization:** Computes unique camera makes, sorted numerical focal lengths, and aperture stops using JavaScript `Set` deduplication.
  * **Compound Predicate Filtering:** Multi-conditional Boolean filtering executed on state changes without touching or reloading image binaries.

---

### Feature 06: Vintage Polaroid Generator & Batch Archive Packaging

* **Purpose & Workflow:**  
  Converts photos into Polaroid prints complete with authentic photo paper textures, drop shadows, customizable typography, and embedded EXIF metadata labels. Supports batch export as a zipped archive.
* **Component & File Footprint:**  
  [`client/src/utils/polaroid.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/polaroid.js), [`client/src/utils/batchProcessor.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/batchProcessor.js), [`client/src/components/BatchSettingsModal.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/BatchSettingsModal.jsx).
* **Libraries & APIs:**  
  * **HTML5 Canvas 2D Context (`CanvasRenderingContext2D`):** Renders proportional borders, inner photo bevel recess, shadow blur (`shadowOffsetY`), and text alignment.
  * **Iterative Font Scaling Algorithm:** Uses `ctx.measureText(exifStr).width` in a while-loop to automatically step down typography font size until long EXIF strings fit within the print margins.
  * **`JSZip`:** Compresses canvas image blobs asynchronously with real-time percentage progress callbacks.
  * **Browser Anchor Trigger:** Dispatches synthetic downloads with document body lifecycle attachment for Firefox and Safari compatibility.

---

### Feature 07: Hardware-Accelerated SVG Diagnostic & Creative Filters

* **Purpose & Workflow:**  
  Zero-latency GPU image diagnostics inside the Lightbox, including a Lightroom-style **Sensor Dust Spotting Aid** and creative color grades (Cyberpunk, Thermal, Glitch, Posterize).
* **Component & File Footprint:**  
  [`client/src/components/ImageFilters.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/ImageFilters.jsx), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx).
* **Mathematical Operations & SVG Primitives:**  
  1. **Sensor Dust Aid (Laplacian Edge Detection):**
     * Desaturates to monochrome via `<feColorMatrix type="matrix">`.
     * Applies a $3 \times 3$ Discrete Laplacian High-Pass Convolution Matrix via `<feConvolveMatrix>`:
       $$\begin{bmatrix} -1 & -1 & -1 \\ -1 & 8 & -1 \\ -1 & -1 & -1 \end{bmatrix}$$
     * Amplifies high-frequency edge deviations with `<feComponentTransfer>` (`slope="4"`), making subtle sensor dust donuts jump out against skies.
  2. **Cyberpunk Duotone:** Maps luminance tables (`<feFuncR>`, `<feFuncG>`, `<feFuncB>`) to neon pink and deep purple endpoints.
  3. **Chromatic Aberration (Glitch):** Isolates R, G, and B color channels, shifts red by $+6\text{px}$ and blue by $-6\text{px}$ via `<feOffset>`, and recombines them via arithmetic `<feComposite>`.

---

### Feature 08: Privacy-Safe "Scrubbed" Image Export

* **Purpose & Workflow:**  
  One-click export that strips all EXIF metadata, camera serial numbers, and sensitive GPS home coordinates before photos are shared to social platforms.
* **Component & File Footprint:**  
  [`client/src/utils/exifStripper.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifStripper.js), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx), [`client/src/hooks/useDownload.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/hooks/useDownload.js).
* **Underlying Technologies:**  
  * **HTML5 Canvas Pixel Re-encoding:** Draws raw pixel data onto a clean canvas context (`drawImage`), discarding all binary header metadata segments.
  * **`canvas.toBlob(..., 'image/jpeg', 0.90)`:** Re-encodes pure pixel data into a new binary stream with clean headers.
  * **Object URL Memory Management:** Revokes intermediate object URLs immediately after blob creation.

---

### Feature 09: Professional IPTC / CMI Copyright Injector

* **Purpose & Workflow:**  
  Injects standardized Copyright Management Information (CMI) and IPTC fields (Photographer Name, Copyright Notice, Image Title, Contact Info, Usage Terms, Job Identifier) directly into the binary EXIF markers of image batches.
* **Component & File Footprint:**  
  [`client/src/utils/exifInjector.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/exifInjector.js), [`client/src/components/MetadataForm.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/MetadataForm.jsx), [`client/src/App.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/App.jsx).
* **Libraries & Web Standards:**  
  * **`piexifjs`:** Binary manipulation library that parses and dumps standard EXIF IFD structures (`0th`, `Exif`, `GPS`, `1st`).
  * **Tag Mapping Standard:**
    * `piexif.ImageIFD.Artist` $\to$ Creator Name.
    * `piexif.ImageIFD.Copyright` $\to$ Copyright Notice.
    * `piexif.ImageIFD.ImageDescription` $\to$ Image Title.
    * `piexif.ImageIFD.DocumentName` $\to$ Job/Project ID.
    * `piexif.ImageIFD.Software` $\to$ Contact Information & Extended License Usage Terms.
  * **`FileReader.readAsDataURL` with Error Guardians:** Converts images to binary Base64 streams for byte injection and repacks into a batch zip.

---

### Feature 10: Asset Protection & DMCA CMI Compliance Alert System

* **Purpose & Workflow:**  
  Scans uploaded batches for existing embedded copyright markers. When protected images are detected, flags them with visual badges and presents an educational legal notice regarding 17 U.S.C. § 1202 of the DMCA.
* **Component & File Footprint:**  
  [`client/src/components/CopyrightToast.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/CopyrightToast.jsx), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx), [`client/src/App.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/App.jsx).
* **Detection Logic:**  
  Inspects parsed tags for non-empty `meta.exif.Copyright` or `meta.exif.Artist`. Triggers UI warning badges and toast notifications detailing statutory risks under the Digital Millennium Copyright Act.

---

### Feature 11: Interactive Geolocation Journey Map & Route Tracer

* **Purpose & Workflow:**  
  Filters all geotagged photos in the batch, sorts them chronologically by capture timestamp, plots them on an interactive world map, and animates the travel path taken between locations.
* **Component & File Footprint:**  
  [`client/src/components/JourneyMap.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/JourneyMap.jsx), [`client/src/css/map.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/map.css).
* **Libraries & Coordinate Standards:**  
  * **Leaflet.js (`L.map`, `L.tileLayer`, `L.polyline`, `L.marker`):** Interactive map renderer.
  * **CartoDB Dark Basemaps:** Themed dark-mode map tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
  * **WGS 84 Decimal Degrees:** Normalizes latitude/longitude from EXIF tags (`latitude`, `longitude`, `gpsLat`, `gpsLng`).
  * **Chronological Route Spline:** Orders coordinates chronologically with a custom timestamp parser handling `YYYY:MM:DD HH:MM:SS` and connects them with an animated vector polyline.
  * **`L.latLngBounds.fitBounds()`:** Automatically frames and zooms the map viewport to fit all captured locations with smooth duration easing.

---

### Feature 12: Analytical Shooting Telemetry & "Gear DNA" Dashboard

* **Purpose & Workflow:**  
  Aggregates shooting habits across the batch to generate visual metrics (Average ISO, Average Focal Length, total frames logged, and distribution histograms).
* **Component & File Footprint:**  
  [`client/src/components/InsightsDashboard.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/InsightsDashboard.jsx), [`client/src/components/GaugeDial.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/GaugeDial.jsx), [`client/src/utils/telemetryChartConfig.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/telemetryChartConfig.js), [`client/src/hooks/useCountUp.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/hooks/useCountUp.js).
* **Technologies & Visual Math:**  
  * **Chart.js & `react-chartjs-2`:** Renders responsive bar histograms for ISO and Focal Length distributions.
  * **Dynamic SVG Gauge Dials:** Custom SVG arc sweep calculated with trigonometric circle geometry:
    $$\text{Angle} = -120^\circ + \left(\frac{\text{Value}}{\text{Max}}\right) \times 240^\circ$$
    $$\text{strokeDasharray} = \left(\frac{\text{Value}}{\text{Max}} \times 283\right)\ 283$$
  * **Easing Math:** `useCountUp` hook driven by `requestAnimationFrame` using an ease-out cubic curve:
    $$f(t) = 1 - (1 - t)^3$$

---

### Feature 13: Structured CSV Batch Metadata Exporter

* **Purpose & Workflow:**  
  Exports all extracted metadata across every image in the batch into a CSV spreadsheet compatible with Excel, Google Sheets, and database importers.
* **Component & File Footprint:**  
  [`client/src/utils/csvExport.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/csvExport.js), [`client/src/hooks/useDownload.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/hooks/useDownload.js).
* **Security & Formatting Standards:**  
  * **CSV Formula Injection Mitigation:** Sanitizes values starting with dangerous spreadsheet formula characters (`=`, `+`, `-`, `@`) by prefixing an apostrophe (`"'..."`) to prevent remote code execution in spreadsheet software.
  * **RFC 4180 Compliance:** Properly escapes double quotes (`""`) and wraps all fields in quotes.
  * **UTF-8 Blob Streaming:** Emits `Blob` with `type: 'text/csv;charset=utf-8;'`.

---

### Feature 14: Dual-Head Local Neural Network Inference (Pose & Aesthetics via ONNX)

* **Purpose & Workflow:**  
  Analyzes images locally for human posture keypoints and aesthetic lighting scores without cloud inference.
* **Component & File Footprint:**  
  [`client/src/utils/onnxWorker.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/onnxWorker.js), [`client/src/components/AIAnalysisModal.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/AIAnalysisModal.jsx), [`client/src/utils/adviceEngine.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/adviceEngine.js).
* **Neural Network Architecture & WebAssembly Stack:**  
  * **Backbone:** PyTorch `MobileNetV2` exported to ONNX format with 1280-dimensional feature extraction.
  * **Dual MLP Heads:** Head 1 outputs 17 COCO body joints (34 X/Y coordinates); Head 2 outputs a 10-point aesthetic quality histogram.
  * **`onnxruntime-web` (Pinned v1.26.0):** Compiles neural network execution into WebAssembly (`executionProviders: ['wasm']`).
  * **Tensor Preprocessing:**
    * Resizes to $384 \times 384$ pixels on a dedicated `OffscreenCanvas`.
    * ImageNet Normalization applied to Float32Array:
      $$x_{\text{norm}} = \frac{(x / 255.0) - \mu_c}{\sigma_c} \quad (\mu = [0.485, 0.456, 0.406], \sigma = [0.229, 0.224, 0.225])$$
  * **Advice Engine Biometric Gate:** Heuristic checks ensure shoulders and hips follow human skeletal geometry before posture advice is generated, preventing hallucination on non-human subjects.

---

### Feature 15: Progressive Web App (PWA) Offline Engine & Tile Caching

* **Purpose & Workflow:**  
  Allows ExifGrid to be installed as a native standalone desktop/mobile application that functions completely without an internet connection.
* **Component & File Footprint:**  
  [`client/vite.config.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/vite.config.js), [`client/index.html`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/index.html).
* **Technologies:**  
  * **`vite-plugin-pwa` & Google Workbox:** Manages service worker lifecycle (`registerType: 'autoUpdate'`).
  * **Web App Manifest:** Standalone display mode, background `#1a1a1a`, and maskable PWA icons.
  * **Multi-Domain Runtime Caching:** Uses `CacheFirst` strategies with 30-day expiration for both OpenStreetMap and CartoDB basemap tiles.

---

### Feature 16: Fault-Tolerant React Error Boundary

* **Purpose & Workflow:**  
  Catches unhandled runtime JavaScript errors anywhere in the component hierarchy, logs diagnostic context, and displays a recovery screen rather than letting React crash to a blank white screen.
* **Component & File Footprint:**  
  [`client/src/components/ErrorBoundary.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/ErrorBoundary.jsx), [`client/src/main.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/main.jsx).
* **Technologies:**  
  * **React Component Lifecycle:** `static getDerivedStateFromError` and `componentDidCatch`.
  * **Storage Purge Recovery:** Includes a "Reset Session" workflow that cleanly clears corrupt IndexedDB stores (`indexedDB.deleteDatabase('ExifGridDB')`) and restarts the application.

---

### Feature 17: Hardened Telemetry Backend & Rate Limiter

* **Purpose & Workflow:**  
  An optional, lightweight Express server that records an aggregate, anonymous processed-image count across users without logging IP addresses, file names, or metadata.
* **Component & File Footprint:**  
  [`server/server.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/server/server.js), [`server/controllers/telemetryController.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/server/controllers/telemetryController.js), [`server/config/db.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/server/config/db.js).
* **Hardening Technologies:**  
  * **Sliding-Window Rate Limiter:** In-memory tracking caps requests to 60 per 15 minutes per IP address.
  * **OWASP Security Headers:** Configures `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `X-XSS-Protection`.
  * **Atomic Mongo Increment:** Updates `{ doc_id: 'exifgrid_master' }` using `{ $inc: { total_images: images } }`.
  * **Graceful Database Offline Handling:** Operates in mock/offline mode when `MONGODB_URI` is unconfigured, ensuring the client never fails on network blips.

---

### Feature 18: Fine-Art & Historical Photography Collector Card Suite

* **Purpose & Workflow:**  
  Elevates technical camera metadata into museum-grade collectible photographic cards. Completely discards gaudy arcade/neon aesthetics in favor of 4 authentic darkroom, analog film, and optical science concepts:
  1. **Archival Darkroom (`darkroom`):** Fine-art museum rag mat board with blind-embossed bevels, archival proof index, and darkroom curator notes.
  2. **35mm Mounted Film Slide (`film_slide`):** Authentic ivory cardboard slide mount with film stock stamps (*Kodachrome 64*, *Tri-X Pan 400*, *Fujichrome Velvia*), frame counter stamps (`▶ 24A`), red Chinagraph grease-pencil crop framing brackets, and photojournalism press tiers.
  3. **Optical Benchmark (`optical_benchmark`):** Precision matte obsidian rangefinder chassis with laser-engraved serial badges, edge vernier scale rulers, and DIN/Swiss typography.
  4. **Heritage Field Guide (`heritage_guide`):** 19th-century naturalist expedition folio with aged gold-foil photo mounting corners, expedition seals, and astronomical capture timestamps.
  Provides interactive live theme swapping, real-time subject framing/repositioning controls (preserving faces and heads over awkward torso crops), and Ultra-HD 3× Print Master exports (2400×3420 px, 300 DPI, lossless 24-bit/32-bit PNG exceeding 5MB–16MB+).
* **Component & File Footprint:**  
  [`client/src/utils/rpgCard.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/rpgCard.js), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx), [`client/src/css/polaroid.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/polaroid.css).
* **Algorithmic & Mathematical Basis:**  
  * **Agility ($AGI$):** Shutter speed kinetics freeze scale ($1/8000\text{s} \to 99$, $1/4000\text{s} \to 95$, $\dots$, $\ge 1\text{s} \to 18$).
  * **Power / Lumens ($PWR$):** Inverse optical aperture intake ($f/1.2 \to 100$, $f/1.4 \to 96$, $\dots$, $f/16 \to 24$).
  * **Sensor Purity ($PUR$):** Quantum fidelity vs. ISO sensor gain ($ISO\ 100 \to 99$, $\dots$, $ISO\ 6400+ \to 25$).
  * **Optical Reach ($RCH$):** Telephoto focal distance metric ($400\text{mm}+ \to 99$, $\dots$, $14\text{mm} \to 32$).
  * **Weighted Gear Level:** $L = \text{clamp}\left(15, 99, \text{round}\left(\frac{1.1 AGI + 1.1 PWR + 0.9 PUR + 0.9 RCH}{4}\right)\right)$.
  * **Interactive Focal Point Repositioning:**  
    Given artwork window $[x_{\text{art}}, y_{\text{art}}, w_{\text{art}}, h_{\text{art}}]$ and user-configured pan offsets $(\hat{x}, \hat{y}) \in [0, 1]$ and zoom factor $z \ge 1$:
    $$s = z \cdot \max\left(\frac{w_{\text{art}}}{w_{\text{img}}}, \frac{h_{\text{art}}}{h_{\text{img}}}\right), \quad w_{\text{draw}} = s \cdot w_{\text{img}}, \quad h_{\text{draw}} = s \cdot h_{\text{img}}$$
    $$x_{\text{draw}} = x_{\text{art}} - \hat{x} \cdot (w_{\text{draw}} - w_{\text{art}}), \quad y_{\text{draw}} = y_{\text{art}} - \hat{y} \cdot (h_{\text{draw}} - h_{\text{art}})$$
    When $\hat{y} = 0$, the upper edge of the photo aligns flush with the upper border of the window, guaranteeing zero facial truncation in portraiture.
* **Canvas Rendering Architecture:**  
  * **Ultra-HD Vector Compositing:** Renders at $3\times$ scale multiplier ($2400 \times 3420\text{ px}$ buffer), producing razor-sharp fine paper grain, vector vernier scales, and crisp serif typography.
  * **Lossless Archival Pipeline:** Exports directly as uncompressed 24-bit/32-bit PNG or 100% quality JPEG, preserving native sensor dynamic range and file sizes exceeding 5MB–16MB+.

---

### Feature 19: Radial RGB Chromatic Donut & Color Harmony Suite

* **Purpose & Workflow:**  
  An interactive color grading and color theory analysis suite integrated into the Lightbox sidebar. Decodes and downsamples the image off-thread to sample 10,000 pixels, constructing a 36-bin ($10^\circ$) angular hue histogram, calculating overall RGB channel saturation split percentages (Red, Green, Blue), determining warm-vs-cool spectrum balance, isolating top 5 dominant palette swatches with one-click HEX clipboard copying, and classifying classical color harmony (*Monochromatic*, *Analogous*, *Complementary*, *Split-Complementary*, *Triadic*, or *Polychromatic*).
* **Component & File Footprint:**  
  [`client/src/utils/chromaticAnalysis.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/chromaticAnalysis.js), [`client/src/components/ChromaticDonut.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/ChromaticDonut.jsx), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx).
* **Algorithmic & Mathematical Basis:**  
  * **Color Space Transformation:** Fast RGB $\to$ HSL mapping for all sample pixels:
    $L = \frac{\max(R,G,B) + \min(R,G,B)}{2}$, with saturation and hue calculated per hexagonal sector.
  * **Angular Histogram Quantization:** Discretizes hues into 36 angular bins ($10^\circ$ each), weighting each count by pixel saturation $S$ while filtering extreme blacks ($L < 0.08$) and whites ($L > 0.94$).
  * **Shortest Angular Distance:** $\Delta\theta = \min(|\theta_1 - \theta_2|, 360^\circ - |\theta_1 - \theta_2|)$.
  * **Classical Harmony Classification:** Evaluates angular divergence $\Delta\theta$ between dominant hue peaks:
    * $\Delta\theta \le 35^\circ \implies$ **Analogous Harmony**
    * $155^\circ \le \Delta\theta \le 180^\circ \implies$ **Complementary Contrast**
    * $120^\circ \le \Delta\theta \le 165^\circ \implies$ **Split-Complementary**
    * $\Delta\theta_1, \Delta\theta_2 \approx 120^\circ \implies$ **Triadic Harmony**
    * Average saturation $< 0.15 \implies$ **Monochromatic / Tonal**
  * **Retina Canvas Donut Renderer:** Renders base $360^\circ$ chromatic track with dynamic glowing radial pulses scaling with image hue concentration and a central dominant color orb.

---

### Feature 20: Golden Hour & Sun Elevation Path Tracker

* **Purpose & Workflow:**  
  Computes exact celestial solar metrics from image capture timestamps and GPS coordinates. Evaluates solar altitude (elevation above/below the horizon in degrees), compass azimuth heading (0°–360°), and classifies natural lighting phases (*High Overhead Sun*, *Direct Daylight*, *Late Afternoon*, *Golden Hour ✨*, *Blue Hour 🌌*, *Nautical Twilight*, *Astronomical Twilight*, *True Night Astro Window*). Renders an SVG sky dome with horizon baseline, a glowing sun marker, photographic lighting guidance, and an expandable daily golden hour timetable (Sunrise, Morning Golden Hour, Solar Noon, Evening Golden Hour, Sunset, Blue Hour).
* **Component & File Footprint:**  
  [`client/src/utils/sunCalc.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/sunCalc.js), [`client/src/components/SunTracker.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/SunTracker.jsx), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx).
* **Astronomical Algorithmic Basis:**  
  * **Julian Day & Ephemeris:** Converts timestamp to Julian Day $d = JD - 2451545.0$.
  * **Solar Anomaly & Ecliptic Longitude:** Evaluates mean solar anomaly $M$ and equation of center $C$ to derive true ecliptic longitude $\Lambda$.
  * **Coordinate Transformation:** Calculates solar declination $\delta$ and right ascension $\alpha_{RA}$, Greenwich Mean Sidereal Time (GMST), and local hour angle $H = \theta_0 + \lambda - \alpha_{RA}$.
  * **Spherical Trigonometry:**
    $$\sin(\alpha) = \sin(\phi)\sin(\delta) + \cos(\phi)\cos(\delta)\cos(H)$$
    $$\cos(A) = \frac{\sin(\delta) - \sin(\phi)\sin(\alpha)}{\cos(\phi)\cos(\alpha)}$$
  * **Photometric Classification:**
    * $\alpha > 45^\circ \implies$ **Zenith Overhead**
    * $6^\circ < \alpha \le 45^\circ \implies$ **Daylight**
    * $0^\circ < \alpha \le 6^\circ \implies$ **Golden Hour ✨**
    * $-4^\circ \le \alpha \le 0^\circ \implies$ **Civil Twilight / Blue Hour 🌌**
    * $-12^\circ \le \alpha < -4^\circ \implies$ **Nautical Twilight**
    * $\alpha < -18^\circ \implies$ **True Night (Astrophotography Window)**

---

### Feature 21: Automated Folder Organization & Batch Export Suite

* **Purpose & Workflow:**  
  Solves flat SD card clutter by automatically organizing photo batches into hierarchical subfolder structures based on camera EXIF tags. Supports sorting by Capture Date (`YYYY-MM-DD/`), Camera Model (`Sony_A7RV/`, `Canon_EOS_R5/`), Focal Length (`35mm/`, `85mm/`), ISO Noise Gain Tiers (`ISO_100-400_LowNoise/`, `ISO_6400+_HighGain/`), or Solar Phase (`Golden_Hour/`, `Daylight/`). Enables format transformation (Polaroids, Collectible RPG Stat Cards, Privacy-Scrubbed assets, or Pristine Originals), optional metadata slug renaming (`[Date]_[Camera]_[Filename]`), and provides a live ASCII directory tree preview inside `BatchSettingsModal.jsx` before asynchronous ZIP compression and packaging.
* **Component & File Footprint:**  
  [`client/src/utils/batchProcessor.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/batchProcessor.js), [`client/src/components/BatchSettingsModal.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/BatchSettingsModal.jsx), [`client/src/App.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/App.jsx), [`client/src/css/modal.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/modal.css).
* **Algorithmic & Archival Basis:**  
  * **Dynamic Subfolder Resolution:** Path mapping based on sanitized EXIF strings:
    $\text{path} = \text{sanitize}(\text{folderKey}(photo, strategy)) + '/' + \text{formatPrefix} + \text{metaSlug} + \text{baseName}$.
  * **Asynchronous Multi-Format Pipeline:** Queues in-memory Blobs into `JSZip` folder nodes while reporting real-time percent progress (0–50% generation, 50–100% compression deflate).
  * **Interactive ASCII Directory Synthesizer:** Computes sample 3-tier branch tree (`├──`, `└──`, `│`) to preview exact archive layout before execution.

---

### Feature 22: Visual EXIF Watermarking & Brand Stamp Suite

* **Purpose & Workflow:**  
  Generates social-media-ready branded letterbox stamps and metadata badges inspired by Leica, Hasselblad, and Xiaomi flagship cameras while preserving native photo aspect ratios. Renders vector typographic banners with brand emblems (Leica classic red dot, Hasselblad orange square), bold camera models, artist signatures, and clean exposure clusters (`focal | aperture | shutter | ISO`). Integrated into `Lightbox.jsx` with real-time reactive preview and multiple aesthetic presets (*Leica Minimalist White*, *Matte Obsidian Black Letterbox*, *Floating Frosted Glass Inset Badge*, and *Hasselblad Modern Border*).
* **Component & File Footprint:**  
  [`client/src/utils/watermark.js`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/utils/watermark.js), [`client/src/components/Lightbox.jsx`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/components/Lightbox.jsx), [`client/src/css/polaroid.css`](file:///c:/Users/garna/Desktop/Projects/Personal%20Shenanigans/ExifGrid-1/client/src/css/polaroid.css).
* **Canvas 2D Vector Architecture:**  
  * **Dynamic Letterbox Sizing:** Computes proportional letterbox bar ($H_{bar} \approx 11\% \times W_{img}$) preserving high resolution up to 2560px.
  * **Alignment & Kerning:** Precision horizontal alignment separating brand identity/artist on the left from technical camera parameters on the right.
  * **Floating Glass Composite:** Inset pill rendering using alpha composite (`rgba(15, 15, 20, 0.75)`), drop shadow blur, and hairline stroke border without expanding outer canvas dimensions.

---

## 3. Technology Cross-Reference Matrix

| Feature | Primary Component / Util | Libraries / Frameworks | Web APIs / Standards | Algorithmic / Math Basis |
|---|---|---|---|---|
| **Masonry Gallery** | `Gallery.jsx`, `PhotoCard.jsx` | React 18, GSAP | CSS Multi-Column, CSS Transforms | GPU Compositing, CLS = 0 |
| **EXIF Parsing** | `exifReader.js`, `exifWorker.js` | `exifr` | Web Workers, Transferables | TIFF Segment Offsets, Rational Decimals |
| **RAW Previews** | `rawParser.js`, `exifWorker.js` | `exifr` | Blob, Object URL, ArrayBuffer | Magic Bytes (`0x4949`, `0x4D4D`), Thumbnail Extraction |
| **Dual Compare** | `ComparisonFeed.jsx` | React 18, GSAP | CSS Matrix, Pointer Events | Normalized Cursor Ratio Panning, Sync Zoom |
| **Filter Matrix** | `FilterMatrix.jsx` | React 18 | ES6 `Set`, Array Methods | Compound Boolean Set Deduplication |
| **Polaroid Gen** | `polaroid.js`, `batchProcessor.js`| `jszip` | Canvas 2D, Blob | Iterative Text Scaling, Zip Deflate Compression |
| **RPG Stat Cards**| `rpgCard.js`, `Lightbox.jsx` | Canvas 2D, React 18 | HTML5 Canvas, Blob, DataURL | Weighted Stat Matrix, Tier Classifier, Word-Wrap Canvas |
| **Brand Watermark**| `watermark.js`, `Lightbox.jsx` | Canvas 2D, React 18 | HTML5 Canvas, Blob, DataURL | Vector Kerning, Proportional Letterbox, Glass Overlay |
| **Chromatic Donut**| `chromaticAnalysis.js`, `ChromaticDonut.jsx` | Canvas 2D, React 18 | `createImageBitmap`, ImageData | 36-Bin Angular Hue Histogram, Shortest Angular Distance |
| **Sun Path Tracker**| `sunCalc.js`, `SunTracker.jsx` | SVG, React 18 | Native Math, Spherical Trig | Jean Meeus Solar Ephemeris, Elevation/Azimuth Vector |
| **Auto Folders** | `batchProcessor.js`, `BatchSettingsModal.jsx` | `jszip`, React 18 | Blob, ArrayBuffer | EXIF Rule-Based Directory Mapping, Deflate Stream |
| **SVG Filters** | `ImageFilters.jsx` | Native SVG | `<feConvolveMatrix>`, `<feColorMatrix>` | $3\times3$ Discrete Laplacian Edge Matrix |
| **EXIF Scrubber** | `exifStripper.js` | Native Canvas | Canvas `toBlob()`, Object URL | Binary Pixel Re-encoding (Dropping Segment APP1) |
| **CMI Injector** | `exifInjector.js` | `piexifjs` | FileReader, Base64 | TIFF Tag IFD Segment Encoding (Artist, Copyright) |
| **Journey Map** | `JourneyMap.jsx` | `leaflet` | WGS 84 Coordinates, Vector Polylines | Chronological Timestamp Sort, Bounding Box Fit |
| **Analytics** | `InsightsDashboard.jsx` | `chart.js`, `react-chartjs-2` | SVG Arc Geometry, rAF | Trigonometric Arc Sweep, Ease-Out Cubic Decay |
| **CSV Exporter** | `csvExport.js` | Native JS | Blob, UTF-8 Encoding | RFC 4180 CSV, Formula Injection Shielding |
| **Local AI Engine**| `onnxWorker.js`, `adviceEngine.js`| `onnxruntime-web` | WebAssembly, OffscreenCanvas | ImageNet Normalization, MobileNetV2 Dual-Head |
| **Offline PWA** | `vite.config.js` | `vite-plugin-pwa`, Workbox | ServiceWorker, Web App Manifest | CacheFirst Runtime Strategy (OSM & CartoDB) |
| **Error Recovery**| `ErrorBoundary.jsx` | React 18 | IndexedDB Database Deletion | Error Lifecycle Interception |
| **Telemetry** | `server.js`, `telemetryController.js`| Express 4, Mongoose 9 | HTTP/1.1, REST | Sliding-Window IP Rate Limiter, Atomic `$inc` |
