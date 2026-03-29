# ExifGrid 📷

A fast, privacy-first, client-side EXIF metadata viewer.

## The Problem

I was tired of endlessly clicking the arrow keys in my default photo gallery just to check basic camera metadata (like aperture, shutter speed, and ISO) for a bunch of photos. I wanted a quicker way to see everything at a glance. ExifGrid solves this by letting you drag and drop multiple images to view their EXIF data instantly. Plus, it processes everything locally right in the browser—zero bytes ever leave your device.

## Features

- **100% Client-Side:** Uses the HTML5 `FileReader` API.
- **Drag and Drop:** Quickly inspect multiple photos at once. (Since the processing is done locally I advise to not put up thousands of images at once on the browser. It will depend on the specifications of the device too for the processing.)
- **Responsive Grid:** Clean, dark-mode UI for viewing photo galleries. (Inspired from Pinterest.)
- **Detailed Lightbox:** Displays camera make, lens, exposure settings, and GPS data (if available).
- **Polaroid Stat Export:** Generate and download thick-framed Polaroid-style image cards with your camera stats cleanly stamped at the bottom. Rendered completely offline using the browser's native Canvas API.

## Tech Stack

- HTML5 (including the `<canvas>` API)
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES6 Modules)
- [EXIF.js](https://github.com/exif-js/exif-js)

## Development Process

This project was built to practice architectural layout and client-side file handling as well as to create a personal pinterest inspired gallery of personally clicked images. The core UI boilerplate and vanilla JavaScript logic were generated using AI assistance. I acted as the architect—defining the privacy-first requirements, splitting the codebase into a maintainable structure, and refining the final UI/UX.

As the application grew, I manually refactored the monolithic codebase into a strict ES6 modular architecture to handle complex DOM lifecycles. Significant engineering also went into advanced memory management—dynamically handling garbage collection for `URL.createObjectURL()` to prevent memory leaks and blob errors during heavy batch uploads and high-resolution Canvas exports.

## Setup

Simply clone the repository and open `index.html` in any modern web browser. No build steps or local servers required.