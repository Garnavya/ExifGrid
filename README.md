# ExifGrid v3 📷

Full-stack monorepo migration of ExifGrid  — React + Vite + Express which is still "A fast, privacy-first, client-side EXIF metadata viewer."

## The Problem

I was tired of endlessly clicking the arrow keys in my default photo gallery just to check basic camera metadata (like aperture, shutter speed, and ISO) for a bunch of photos. I wanted a quicker way to see everything at a glance. ExifGrid solves this by letting you drag and drop multiple images to view their EXIF data instantly. Plus, it processes everything locally right in the browser—zero bytes ever leave your device.

---

## 🚀 Features (v3.1: The "Cinematic Architecture" Update)

This version represents a massive leap from v2, transforming the application into a highly stable, premium full-stack React environment.

### Major Features & Functionality
* **Advanced Photo Comparison Mode:** A dedicated side-by-side comparison feed. Select two photos from the grid to directly compare their visual fidelity and EXIF statistics (Aperture, Shutter, ISO, Focal Length) in a split-screen Lightbox view.
* **Custom Polaroid Generator:** A built-in canvas engine that allows you to export any photo as a vintage Polaroid. Features fully customizable captions, typography (handwriting, typewriter, editorial fonts), text scaling, and togglable EXIF data inclusion.
* **Privacy-Safe "Scrubbed" Export:** A one-click download feature that strips all hidden EXIF and GPS metadata from a photo, ensuring it is 100% safe to share on social media.
* **Global Telemetry Dashboard:** Integrated an Express/MongoDB backend to aggregate anonymous hardware insights. View global leaderboards for the most popular Camera Models and Focal Lengths processed by the community.

### UI & Layout Engineering
* **4K-Ready Masonry Grid:** Replaced fragile flexbox layouts with a pure-CSS, Pinterest-style masonry grid. The layout scales flawlessly from a 2-column mobile view to an 8-column ultra-wide 4K monitor setup, utilizing hardware acceleration (`transform: translateZ(0)`) for buttery smooth scrolling.
* **Decoupled "Glassmorphism" Theming:** Separated structural CSS from the visual "paint job." Introduced a modular `theme.css` system featuring premium, cinematic color grades (e.g., "Tungsten & Brass" for dark mode and luxury editorial aesthetics for light mode) that can be swapped globally.
* **WhatsApp-Style Keyboard UX:** Engineered a custom `onFocus` handler using React `useRef` and `scrollIntoView`. When mobile users tap a text input, the UI smoothly slides up, ensuring the OS virtual keyboard never covers the text field.
* **Dynamic Smart Filters:** The filter matrix automatically maps to the active glassmorphism theme's CSS variables, ensuring pixel-perfect contrast across all light/dark mode variants.

### Architecture & Stability
* **Bulletproof React State:** Purged brittle Vanilla JS DOM manipulations in favor of strict React `useState` tracking.
* **Precision DropZone:** Engineered a new "dead space wrapper" for drag-and-drop hit detection, ensuring the UI only activates when a file crosses the exact pixel boundary of the dashed upload box.
* **Hook-Order Optimization:** Surgically restructured core components (`Lightbox.jsx`, `ComparisonFeed.jsx`) to enforce strict React Hook ordering. Implemented rigorous optional chaining (`photo?.src`) to completely eliminate crash loops when unmounting active images.

---

## Tech Stack

* **Frontend:** React, Vite, HTML5 (Canvas & FileReader APIs)
* **Backend:** Express.js, MongoDB Atlas (for anonymous telemetry)
* **Styling:** CSS3 (Custom Properties, CSS Columns for Masonry, Backdrop-Filter)
* **Animation:** [GSAP](https://gsap.com/) (Greensock)
* **Mapping:** [Leaflet.js](https://leafletjs.com/)
* **Metadata:** [EXIF.js](https://github.com/exif-js/exif-js)

## Development Process

This project was built to practice architectural layout, client-side file handling, and memory management, as well as to create a personal Pinterest-inspired gallery of personally clicked images. 

The core UI boilerplate and vanilla JavaScript logic were initially generated using AI assistance. I acted as the architect—defining the privacy-first requirements and refining the UI/UX. 

As the application grew into v3.0, I manually refined the client-side architecture to handle complex React lifecycles. Significant engineering went into advanced memory management, resolving React hook dependency arrays, and rendering optimization (including dynamically handling garbage collection for `URL.createObjectURL()` to prevent memory leaks during heavy batch uploads).

## Setup

```bash
# Clone the repository
git clone <https://github.com/Garnavya/ExifGrid>
cd ExifGrid

# Install dependencies for both client and server
npm install
cd client && npm install
cd ../server && npm install