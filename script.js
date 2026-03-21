//STATE 
const photos = [];
let exifCount = 0;
const camerasSet = new Set();

//DRAG & DROP
function onDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}
function onDragLeave(e) {
  document.getElementById('drop-zone').classList.remove('drag-over');
}
function onDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}

//FILE HANDLING
function handleFiles(files) {
  if (!files || files.length === 0) return;
  showGallery();
  
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    
    // Generate a unique ID for this specific photo (allows for safe removal later)
    const id = Math.random().toString(36).substring(2, 9);
    
    // Create a lightweight pointer instead of a massive Base64 string to save RAM
    const objectURL = URL.createObjectURL(file);
    
    // Store the photo data, including the unique ID and the lightweight pointer
    photos.push({ id, file, src: objectURL, exif: null });
    
    const card = createLoadingCard();
    document.getElementById('gallery').appendChild(card);
    
    // Pass the raw file directly to our EXIF reader, referencing it by its unique ID
    readExif(file, objectURL, id, card);
  });
}

function showGallery() {
  document.getElementById('drop-zone').style.display = 'none';
  const g = document.getElementById('gallery');
  g.style.display = 'block';
  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('clear-btn').style.display = 'block';
}

function createLoadingCard() {
  const div = document.createElement('div');
  div.className = 'card-loading';
  return div;
}

//EXIF READING
function readExif(file, src, id, placeholder) {
  // 1. Pass the raw File directly to EXIF.js for faster processing
  EXIF.getData(file, function() {
    const data = EXIF.getAllTags(this);
    
    // Find the right photo by unique ID instead of array index
    const p = photos.find(photo => photo.id === id);
    if (!p) return; // Safeguard: Stop if the user clicked 'x' before the EXIF data finished loading
    
    p.exif = data;
    p.name = file.name;
    p.size = file.size;

    // 2. We still need image dimensions, so we load the lightweight objectURL briefly
    const tempImg = new Image();
    tempImg.onload = function() {
      p.naturalW = tempImg.naturalWidth;
      p.naturalH = tempImg.naturalHeight;

      // Build the card and replace the loading placeholder
      const card = buildCard(id);
      placeholder.replaceWith(card);
      
      // Update the stats bar (this now dynamically counts the remaining EXIF data)
      updateStats();
    };
    tempImg.src = src; // Uses the lightweight objectURL from memory
  });
}

//BUILD CARD (Gemini helped)
function buildCard(id) {
  // Find the right photo by unique ID
  const p = photos.find(photo => photo.id === id);
  // Get the current array index to keep the staggered loading animation working
  const idx = photos.findIndex(photo => photo.id === id); 
  
  const exif = p.exif || {};
  const hasExif = Object.keys(exif).length > 0;

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.style.animationDelay = (idx * 40) + 'ms'; // Retains the cascading load effect
  card.onclick = () => openLightbox(id);

  // --- NEW: Remove Button ---
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '✕';
  removeBtn.onclick = (e) => {
    e.stopPropagation(); // Stops the lightbox from opening when clicking 'x'
    removePhoto(id, card);
  };
  card.appendChild(removeBtn);

  const img = document.createElement('img');
  img.src = p.src;
  img.alt = p.name;
  img.loading = 'lazy';
  card.appendChild(img);

  // Camera badge (top left)
  if (exif.Make) {
    const badge = document.createElement('div');
    badge.className = 'camera-badge';
    badge.textContent = (exif.Make + (exif.Model ? ' ' + exif.Model : '')).trim().substring(0, 24);
    card.appendChild(badge);
  }

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';

  const fname = document.createElement('div');
  fname.className = 'photo-filename';
  fname.textContent = p.name;
  overlay.appendChild(fname);

  if (hasExif) {
    const grid = document.createElement('div');
    grid.className = 'exif-grid';

    const fields = [
      { label: 'Aperture', val: formatAperture(exif.FNumber) },
      { label: 'Shutter',  val: formatShutter(exif.ExposureTime) },
      { label: 'ISO',      val: exif.ISOSpeedRatings ? 'ISO ' + exif.ISOSpeedRatings : null },
      { label: 'Focal',    val: exif.FocalLength ? exif.FocalLength.toFixed(0) + 'mm' : null },
    ].filter(f => f.val);

    fields.forEach(f => {
      const item = document.createElement('div');
      item.className = 'exif-item';
      item.innerHTML = `<span class="exif-label">${f.label}</span><span class="exif-val">${f.val}</span>`;
      grid.appendChild(item);
    });

    if (fields.length > 0) overlay.appendChild(grid);
    else {
      const nb = document.createElement('span');
      nb.className = 'no-exif-badge';
      nb.textContent = 'EXIF found';
      overlay.appendChild(nb);
    }
  } else {
    const nb = document.createElement('span');
    nb.className = 'no-exif-badge';
    nb.textContent = 'No EXIF';
    overlay.appendChild(nb);
  }

  card.appendChild(overlay);
  return card;
}

//LIGHTBOX
function openLightbox(id) {

const sidebar = document.getElementById('lb-sidebar');
if (sidebar) sidebar.classList.remove('drawer-open');

  // Find the right photo using the unique ID
  const p = photos.find(photo => photo.id === id);
  if (!p) return; // Safety check: stops the function if the photo was already deleted
  
  const exif = p.exif || {};

  document.getElementById('lb-filename').textContent = p.name;
  const lbImg = document.getElementById('lb-img');
  lbImg.src = '';
  setTimeout(() => { lbImg.src = p.src; }, 10);

  const meta = document.getElementById('lb-meta');
  meta.innerHTML = '';

  // File info
  meta.appendChild(metaSection('File', [
    { k: 'Name',       v: p.name },
    { k: 'Size',       v: formatBytes(p.size) },
    { k: 'Dimensions', v: p.naturalW + ' × ' + p.naturalH + ' px' },
  ]));

  // Camera
  const cameraFields = [];
  if (exif.Make)         cameraFields.push({ k: 'Make',  v: exif.Make });
  if (exif.Model)        cameraFields.push({ k: 'Model', v: exif.Model });
  if (exif.LensModel)    cameraFields.push({ k: 'Lens',  v: exif.LensModel });
  if (cameraFields.length) meta.appendChild(metaSection('Camera', cameraFields));

  // Exposure
  const expFields = [];
  if (exif.FNumber)          expFields.push({ k: 'Aperture', v: formatAperture(exif.FNumber), accent: true });
  if (exif.ExposureTime)     expFields.push({ k: 'Shutter',  v: formatShutter(exif.ExposureTime), accent: true });
  if (exif.ISOSpeedRatings)  expFields.push({ k: 'ISO',      v: 'ISO ' + exif.ISOSpeedRatings, accent: true });
  if (exif.FocalLength)      expFields.push({ k: 'Focal',    v: exif.FocalLength.toFixed(0) + 'mm', accent: true });
  if (exif.FocalLengthIn35mmFilm) expFields.push({ k: '35mm eq.', v: exif.FocalLengthIn35mmFilm + 'mm' });
  if (exif.ExposureBiasValue !== undefined) expFields.push({ k: 'Exp. bias', v: formatEV(exif.ExposureBiasValue) });
  if (exif.Flash !== undefined)    expFields.push({ k: 'Flash', v: getFlashDesc(exif.Flash) });
  if (exif.WhiteBalance !== undefined) expFields.push({ k: 'White balance', v: exif.WhiteBalance === 0 ? 'Auto' : 'Manual' });
  if (exif.MeteringMode !== undefined) expFields.push({ k: 'Metering', v: getMeteringMode(exif.MeteringMode) });
  if (expFields.length) meta.appendChild(metaSection('Exposure', expFields));

  // Date/time
  const dtFields = [];
  if (exif.DateTimeOriginal) dtFields.push({ k: 'Taken', v: formatExifDate(exif.DateTimeOriginal) });
  if (exif.DateTimeDigitized) dtFields.push({ k: 'Digitized', v: formatExifDate(exif.DateTimeDigitized) });
  if (dtFields.length) meta.appendChild(metaSection('Date & Time', dtFields));

  // GPS
  if (exif.GPSLatitude && exif.GPSLongitude) {
    const lat = convertDMStoDD(exif.GPSLatitude, exif.GPSLatitudeRef);
    const lon = convertDMStoDD(exif.GPSLongitude, exif.GPSLongitudeRef);
    const gpsSection = document.createElement('div');
    gpsSection.innerHTML = `
      <div class="meta-section-title">GPS Location</div>
      <div class="meta-row"><span class="meta-key">Latitude</span><span class="meta-value">${lat.toFixed(6)}°</span></div>
      <div class="meta-row"><span class="meta-key">Longitude</span><span class="meta-value">${lon.toFixed(6)}°</span></div>
      <a class="gps-link" href="https://maps.google.com/?q=${lat},${lon}" target="_blank">
        ⌖ View on Maps
      </a>
    `;
    meta.appendChild(gpsSection);
  }

  if (Object.keys(exif).length === 0) {
    const noExif = document.createElement('div');
    noExif.style.cssText = 'text-align:center;padding:32px 0;';
    noExif.innerHTML = `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);letter-spacing:.1em;">NO EXIF DATA</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:8px;line-height:1.5">This image has no embedded<br>camera metadata.</div>`;
    meta.appendChild(noExif);
  }

  document.getElementById('lightbox').classList.add('active');
  document.addEventListener('keydown', lbKeydown);
  
  // TRIGGER THE TYPEWRITER HUD ON MOBILE
  runTypewriterHUD(); 
}

function metaSection(title, rows) {
  const sec = document.createElement('div');
  let html = `<div class="meta-section-title">${title}</div>`;
  rows.forEach(r => {
    const cls = r.accent ? 'meta-value meta-accent' : 'meta-value';
    html += `<div class="meta-row"><span class="meta-key">${r.k}</span><span class="${cls}">${r.v}</span></div>`;
  });
  sec.innerHTML = html;
  return sec;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.removeEventListener('keydown', lbKeydown);
}

function lbKeydown(e) {
  if (e.key === 'Escape') closeLightbox();
}

//STATS
function updateStats() {
  document.getElementById('stat-count').textContent = photos.length;
  document.getElementById('stat-exif').textContent = exifCount;
  if (camerasSet.size > 0) {
    document.getElementById('stat-camera-wrap').style.display = 'flex';
    const cams = Array.from(camerasSet).slice(0, 3).join(', ');
    document.getElementById('stat-cameras').textContent = cams + (camerasSet.size > 3 ? ` +${camerasSet.size-3}` : '');
  }
}

//CLEAR
function clearAll() {
  // Loop through and destroy all memory links
  photos.forEach(photo => URL.revokeObjectURL(photo.src)); 
  photos.length = 0; // Empty the array
  document.getElementById('gallery').innerHTML = '';
  updateStats();
}

//FORMATTERS
function formatAperture(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  return 'f/' + n.toFixed(1);
}

function formatShutter(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  if (n >= 1) return n.toFixed(1) + 's';
  return '1/' + Math.round(1/n) + 's';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(2) + ' MB';
}

function formatEV(v) {
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  return (n >= 0 ? '+' : '') + n.toFixed(1) + ' EV';
}

function formatExifDate(str) {
  if (!str) return '—';
  // EXIF date format: "YYYY:MM:DD HH:MM:SS"
  const parts = str.split(' ');
  if (parts.length < 2) return str;
  const dateParts = parts[0].split(':');
  if (dateParts.length < 3) return str;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = parseInt(dateParts[1], 10);
  return `${dateParts[2]} ${months[m-1] || m} ${dateParts[0]}, ${parts[1]}`;
}

function getFlashDesc(v) {
  const fired = (v & 1) === 1;
  return fired ? 'Fired' : 'Did not fire';
}

function getMeteringMode(v) {
  const modes = { 0:'Unknown',1:'Average',2:'Center-weighted',3:'Spot',4:'Multi-spot',5:'Pattern',6:'Partial' };
  return modes[v] || 'Unknown';
}

function convertDMStoDD(dms, ref) {
  if (!dms || dms.length < 3) return 0;
  const d = dms[0].numerator / dms[0].denominator;
  const m = dms[1].numerator / dms[1].denominator;
  const s = dms[2].numerator / dms[2].denominator;
  let dd = d + m/60 + s/3600;
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
}

// ─── REMOVE PHOTO LOGIC ───────────────────────────────────────────────────────
function removePhoto(id, cardElement) {
  const index = photos.findIndex(p => p.id === id);
  if (index !== -1) {
    URL.revokeObjectURL(photos[index].src); // Destroy memory ONLY when deleting
    photos.splice(index, 1);
  }
  cardElement.remove();
  updateStats();
}

function updateStats() {
  // Recalculate accurately based on the remaining photos
  exifCount = photos.filter(p => p.exif && Object.keys(p.exif).length > 0).length;
  camerasSet.clear();
  
  photos.forEach(p => {
     if (p.exif && p.exif.Make) {
         camerasSet.add((p.exif.Make + ' ' + (p.exif.Model || '')).trim());
     }
  });

  document.getElementById('stat-count').textContent = photos.length;
  document.getElementById('stat-exif').textContent = exifCount;
  
  if (camerasSet.size > 0) {
    document.getElementById('stat-camera-wrap').style.display = 'flex';
    const cams = Array.from(camerasSet).slice(0, 3).join(', ');
    document.getElementById('stat-cameras').textContent = cams + (camerasSet.size > 3 ? ` +${camerasSet.size-3}` : '');
  } else {
    document.getElementById('stat-camera-wrap').style.display = 'none';
  }

  /// Safe UI Reset when gallery is empty
  if (photos.length === 0) {
     document.getElementById('gallery').innerHTML = ''; 
     // Add any other visual resets here, like showing the drop-zone again
  }
}

// ─── CINEMATIC MOBILE TYPEWRITER EFFECT ──────────────────────────────────────
function runTypewriterHUD() {
  // Only trigger this cool effect on mobile screens (under 768px wide)
  if (window.innerWidth > 768) return;

  const metaContainer = document.getElementById('lb-meta');
  // Grab all the data values (f/5.0, ISO 1600, etc.)
  const values = metaContainer.querySelectorAll('.meta-value');
  
  values.forEach((el, index) => {
    const originalText = el.textContent;
    el.textContent = ''; // Erase the text instantly
    el.classList.add('typewriter-text'); // Apply the terminal CSS
    
    // Stagger the animations so row 2 waits for row 1 to finish
    setTimeout(() => {
      el.classList.add('typing-cursor'); // Turn on the blinking block
      let i = 0;
      
      const typing = setInterval(() => {
        if (i < originalText.length) {
          el.textContent += originalText.charAt(i); // Add one letter
          i++;
        } else {
          clearInterval(typing); // Stop typing
          el.classList.remove('typing-cursor'); // Remove cursor and move to next row
        }
      }, 35); // Speed of the typing (35ms per letter)
      
    }, index * 400); // 400ms delay before the next line starts printing
  });
}