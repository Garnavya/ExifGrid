# ExifGrid 📷

A fast, privacy-first, client-side EXIF metadata viewer.

## The Problem
I needed a quick way to check the camera metadata (aperture, shutter speed, ISO, etc.) of my photos without having to just click on arrow keys of my Gallery. ExifGrid solves this by processing everything locally in the browser. Zero bytes leave your device.

## Features
* **100% Client-Side:** Uses the HTML5 `FileReader` API.
* **Drag and Drop:** Quickly inspect multiple photos at once. (Since the processing is done locally I advise to not put up thousands of images at once on the browser. It will depend on the specifications of the device too for the processing.)
* **Responsive Grid:** Clean, dark-mode UI for viewing photo galleries. (Inspired from Pinterest.)
* **Detailed Lightbox:** Displays camera make, lens, exposure settings, and GPS data (if available).

## Tech Stack
* HTML5
* CSS3 (Custom Properties, Grid, Flexbox)
* Vanilla JavaScript
* [EXIF.js](https://github.com/exif-js/exif-js)

## Development Process
This project was built to practice architectural layout and client-side file handling as well as to create a peronal pinterest inspired gallery of personally clicked images. The core UI boilerplate and vanilla JavaScript logic were generated using AI assistance. I acted as the architect—defining the privacy-first requirements, handling prompt engineering, splitting the codebase into a maintainable structure, and refining the final UI/UX.

## Setup
Simply clone the repository and open `index.html` in any modern web browser. No build steps or local servers required.