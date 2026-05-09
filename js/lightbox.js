import { downloadPolaroid, generatePolaroidDataURL } from './download.js';
import { photos } from './state.js';
import {
  formatAperture, formatShutter, formatBytes,
  formatEV, formatExifDate,
  getFlashDesc, getMeteringMode, convertDMStoDD,
} from './formatters.js';

// ── Track the currently open photo ──
let currentPhotoId = null;
let miniMap = null; // Tracks the active Leaflet map

// ── Public API ────────────────────────────────────────────────────────────────

export function openLightbox(id) {
  currentPhotoId = id; // Update tracker
  const p = photos.find(photo => photo.id === id);
  if (!p) return;

  const exif = p.exif || {};

  // 1. Populate Text
  document.getElementById('lb-filename').textContent = p.name;
  
  const meta = document.getElementById('lb-meta');
  meta.innerHTML = '';

  // File info
  meta.appendChild(_metaSection('File', [
    { k: 'Name', v: p.name },
    { k: 'Size', v: formatBytes(p.size) },
    { k: 'Dimensions', v: p.naturalW + ' × ' + p.naturalH + ' px' },
  ]));

  // Camera
  const cameraFields = [];
  if (exif.Make) cameraFields.push({ k: 'Make', v: exif.Make });
  if (exif.Model) cameraFields.push({ k: 'Model', v: exif.Model });
  if (exif.LensModel) cameraFields.push({ k: 'Lens', v: exif.LensModel });
  if (cameraFields.length) meta.appendChild(_metaSection('Camera', cameraFields));

  // Exposure
  const expFields = [];
  if (exif.FNumber) expFields.push({ k: 'Aperture', v: formatAperture(exif.FNumber), accent: true });
  if (exif.ExposureTime) expFields.push({ k: 'Shutter', v: formatShutter(exif.ExposureTime), accent: true });
  if (exif.ISOSpeedRatings) expFields.push({ k: 'ISO', v: 'ISO ' + exif.ISOSpeedRatings, accent: true });
  if (exif.FocalLength) expFields.push({ k: 'Focal', v: exif.FocalLength.toFixed(0) + 'mm', accent: true });
  if (expFields.length) meta.appendChild(_metaSection('Exposure', expFields));

  // Date & Time
  const dtFields = [];
  if (exif.DateTimeOriginal) dtFields.push({ k: 'Taken', v: formatExifDate(exif.DateTimeOriginal) });
  if (dtFields.length) meta.appendChild(_metaSection('Date & Time', dtFields));

  // ── NEW: GPS & MINI-MAP ──
  if (exif.GPSLatitude && exif.GPSLongitude) {
    const lat = convertDMStoDD(exif.GPSLatitude, exif.GPSLatitudeRef);
    const lon = convertDMStoDD(exif.GPSLongitude, exif.GPSLongitudeRef);

    const gpsSection = document.createElement('div');
    gpsSection.innerHTML = `
      <div class="meta-section-title">Location</div>
      <div class="meta-row"><span class="meta-key">Coordinates</span><span class="meta-value">${lat.toFixed(5)}°, ${lon.toFixed(5)}°</span></div>
      <div id="mini-map"></div>
      <a class="gps-link" href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank">
        ⌖ Open in Google Maps
      </a>
    `;
    meta.appendChild(gpsSection);

    // Initialize Leaflet Map (Delayed slightly to wait for GSAP layout)
    setTimeout(() => {
      /* global L */ // Tells the linter L comes from the CDN
      miniMap = L.map('mini-map', {
        zoomControl: false, // Clean UI
        attributionControl: false // Minimalist
      }).setView([lat, lon], 12);

      // Load free OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

      // Custom minimal marker to match theme
      const markerHtml = `<div style="background:var(--accent); width:14px; height:14px; border-radius:50%; border:2px solid var(--surface); box-shadow: 0 0 10px var(--accent);"></div>`;
      const customIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
      
      L.marker([lat, lon], { icon: customIcon }).addTo(miniMap);
    }, 150);
  }

  // 2. Setup the Lightbox Elements for Animation
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  
  lb.style.display = 'flex'; // Make it visible to the browser layout engine
  document.body.style.overflow = 'hidden'; // Locks the background gallery
  lbImg.src = p.src; // Load the image

  // 3. Dynamic Color Extraction
  lbImg.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1; canvas.height = 1;
    ctx.drawImage(lbImg, 0, 0, 1, 1);
    
    try {
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      // Apply a soft, dynamic radial glow behind the image
      document.querySelector('.lb-img-wrap').style.background = 
        `radial-gradient(circle at center, rgba(${r},${g},${b},0.15) 0%, transparent 70%)`;
      // Tint the sidebar border
      document.querySelector('.lb-sidebar-column').style.borderLeftColor = `rgba(${r},${g},${b},0.4)`;
    } catch(e) {
      console.warn("Could not extract image color.");
    }
  };

  // 4. Trigger GSAP Orchestration
  if (window.gsap) {
    const tl = gsap.timeline();
    // Fade in the adaptive glass background
    tl.to(lb, { opacity: 1, duration: 0.3, ease: "power2.out" })
      // Bounce the image in
      .fromTo(lbImg, 
        { scale: 0.85, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, 
        "-=0.1"
      )
      // Slide the EXIF data column in from the right
      .fromTo('.lb-sidebar-column', 
        { x: 40, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 
        "-=0.3"
      );
  } else {
    lb.style.opacity = '1';
  }

  // 5. Connect Utilities
  document.removeEventListener('keydown', lbKeydown); // Prevent duplicates
  document.addEventListener('keydown', lbKeydown);
  _runTypewriterHUD();

  // --- LIVE PREVIEW ENGINE & ZOOM ---
  const previewImg = document.getElementById('lb-polaroid-preview');
  
  // Helper to gather settings
  const getSettings = () => {
    const toggles = Array.from(document.querySelectorAll('#ps-exif-toggles input:checked')).map(cb => cb.value);
    return {
      caption: document.getElementById('ps-caption').value,
      font: document.getElementById('ps-font').value,
      exifToggles: toggles
    };
  };

  // Live updater
  const updatePreview = async () => {
    previewImg.style.opacity = '0.5'; // Dim while rendering
    const dataUrl = await generatePolaroidDataURL(id, getSettings());
    previewImg.src = dataUrl;
    previewImg.style.opacity = '1';
  };

  // Initial render
  updatePreview();

  // Listeners for Live Updates
  document.getElementById('ps-caption').addEventListener('input', updatePreview);
  document.getElementById('ps-font').addEventListener('change', updatePreview);
  document.querySelectorAll('#ps-exif-toggles input').forEach(cb => cb.addEventListener('change', updatePreview));

  // The Download Button
  const downloadBtn = document.getElementById('download-card-btn');
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadPolaroid(id, getSettings());
  }

  // Click to Enlarge functionality
  const originalImg = document.getElementById('lb-img');
  const polaroidPreview = document.getElementById('lb-polaroid-preview');

  // Using .onclick directly prevents listener duplication without needing to clone and destroy the DOM elements
  originalImg.onclick = function() { this.classList.toggle('enlarged'); };
  polaroidPreview.onclick = function() { this.classList.toggle('enlarged'); }
}

export function closeLightbox() {
  currentPhotoId = null; // Clear tracker
  document.removeEventListener('keydown', lbKeydown);

  // DESTROY OLD MAP
  if (miniMap) {
    miniMap.remove();
    miniMap = null;
  }

  const lb = document.getElementById('lightbox');
  
  // 6. GSAP Exit Animation
  if (window.gsap) {
    gsap.to(lb, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        lb.style.display = 'none';
        document.body.style.overflow = '';
        document.querySelector('.lb-img-wrap').style.background = 'transparent'; // Reset glow
      }
    });
  } else {
    lb.style.display = 'none';
    document.body.style.overflow = ''; // Unlocks the background gallery
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function lbKeydown(e) {
  if (e.key === 'Escape') {
    closeLightbox();
    return;
  }

  // Ignore arrow keys if the user is typing in an input box
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
    return;
  }
  
  // Keyboard Navigation: Left and Right Arrows
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    // Safety check: Ensure a photo is open and we have more than 1 photo in the gallery
    if (!currentPhotoId || photos.length <= 1) return;

    // Find where we are currently in the array
    const currentIndex = photos.findIndex(p => p.id === currentPhotoId);
    if (currentIndex === -1) return;

    let newIndex;
    
    if (e.key === 'ArrowRight') {
      // Move right, loop back to the start if we hit the end
      newIndex = (currentIndex + 1) % photos.length;
    } else if (e.key === 'ArrowLeft') {
      // Move left, loop to the end if we hit the beginning
      newIndex = (currentIndex - 1 + photos.length) % photos.length;
    }

    // Trigger the lightbox to instantly load the new photo
    openLightbox(photos[newIndex].id);
  }
}

function _metaSection(title, rows) {
  const sec = document.createElement('div');
  let html = `<div class="meta-section-title">${title}</div>`;
  rows.forEach(r => {
    const cls = r.accent ? 'meta-value meta-accent' : 'meta-value';
    html += `<div class="meta-row"><span class="meta-key">${r.k}</span><span class="${cls}">${r.v}</span></div>`;
  });
  sec.innerHTML = html;
  return sec;
}

function _runTypewriterHUD() {
  if (window.innerWidth > 768) return;
  const metaContainer = document.getElementById('lb-meta');
  const values = metaContainer.querySelectorAll('.meta-value');

  values.forEach((el, index) => {
    const originalText = el.textContent;
    el.textContent = '';
    el.classList.add('typewriter-text');

    setTimeout(() => {
      el.classList.add('typing-cursor');
      let i = 0;
      const typing = setInterval(() => {
        if (i < originalText.length) {
          el.textContent += originalText.charAt(i++);
        } else {
          clearInterval(typing);
          el.classList.remove('typing-cursor');
        }
      }, 35);
    }, index * 400);
  });
}