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
  Array.from(files).forEach((file, i) => {
    if (!file.type.startsWith('image/')) return;
    const idx = photos.length;
    
    // Create a lightweight pointer instead of a massive Base64 string
    const objectURL = URL.createObjectURL(file);
    
    photos.push({ file, src: objectURL, exif: null });
    const card = createLoadingCard();
    document.getElementById('gallery').appendChild(card);
    
    // Pass the raw file directly to our EXIF reader
    readExif(file, objectURL, idx, card);
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
function readExif(file, src, idx, placeholder) {
  // 1. Pass the raw File directly to EXIF.js
  EXIF.getData(file, function() {
    const data = EXIF.getAllTags(this);
    photos[idx].exif = data;
    photos[idx].name = file.name;
    photos[idx].size = file.size;

    // 2. We still need image dimensions, so we load the lightweight objectURL briefly
    const tempImg = new Image();
    tempImg.onload = function() {
      photos[idx].naturalW = tempImg.naturalWidth;
      photos[idx].naturalH = tempImg.naturalHeight;

      if (data && Object.keys(data).length > 0) {
        exifCount++;
        const make = data.Make || '';
        const model = data.Model || '';
        if (make) camerasSet.add((make + ' ' + model).trim());
      }

      const card = buildCard(idx);
      placeholder.replaceWith(card);
      updateStats();
    };
    tempImg.src = src; // Uses the lightweight objectURL
  });
}

//BUILD CARD (Gemini helped)
function buildCard(idx) {
  const p = photos[idx];
  const exif = p.exif || {};
  const hasExif = Object.keys(exif).length > 0;

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.style.animationDelay = (idx * 40) + 'ms';
  card.onclick = () => openLightbox(idx);

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
function openLightbox(idx) {
  const p = photos[idx];
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

  // GPS (Added the gps link for fun)
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
  // Tell the browser to free up the memory for every image we loaded
  photos.forEach(p => {
    if (p.src) URL.revokeObjectURL(p.src);
  });

  photos.length = 0;
  exifCount = 0;
  camerasSet.clear();
  document.getElementById('gallery').innerHTML = '';
  document.getElementById('gallery').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('drop-zone').style.display = 'flex';
  document.getElementById('clear-btn').style.display = 'none';
  document.getElementById('file-input').value = '';
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