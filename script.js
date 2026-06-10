/* ExifGrid consolidated JavaScript. All local JS modules are bundled here. */

/* ===== js\exif.min.js ===== */
(function(){function e(e){return!!e.exifdata}function t(e,t){t=t||e.match(/^data\:([^\;]+)\;base64,/im)[1]||"",e=e.replace(/^data\:([^\;]+)\;base64,/gim,"");for(var n=atob(e),r=n.length,i=new ArrayBuffer(r),o=new Uint8Array(i),a=0;a<r;a++)o[a]=n.charCodeAt(a);return i}function r(e,t){var n=new XMLHttpRequest;n.open("GET",e,!0),n.responseType="blob",n.onload=function(e){200!=this.status&&0!==this.status||t(this.response)},n.send()}function i(e,n){function i(t){var r=o(t);e.exifdata=r||{};var i=a(t);if(e.iptcdata=i||{},F.isXmpEnabled){var s=m(t);e.xmpdata=s||{}}n&&n.call(e)}if(e.src)if(/^data\:/i.test(e.src))i(t(e.src));else if(/^blob\:/i.test(e.src))(l=new FileReader).onload=function(e){i(e.target.result)},r(e.src,function(e){l.readAsArrayBuffer(e)});else{var s=new XMLHttpRequest;s.onload=function(){if(200!=this.status&&0!==this.status)throw"Could not load image";i(s.response),s=null},s.open("GET",e.src,!0),s.responseType="arraybuffer",s.send(null)}else if(self.FileReader&&(e instanceof self.Blob||e instanceof self.File)){var l=new FileReader;l.onload=function(e){S&&console.log("Got file of length "+e.target.result.byteLength),i(e.target.result)},l.readAsArrayBuffer(e)}}function o(e){var t=new DataView(e);if(S&&console.log("Got file of length "+e.byteLength),255!=t.getUint8(0)||216!=t.getUint8(1))return S&&console.log("Not a valid JPEG"),!1;for(var n,r=2,i=e.byteLength;r<i;){if(255!=t.getUint8(r))return S&&console.log("Not a valid marker at offset "+r+", found: "+t.getUint8(r)),!1;if(n=t.getUint8(r+1),S&&console.log(n),225==n)return S&&console.log("Found 0xFFE1 marker"),g(t,r+4,t.getUint16(r+2));r+=2+t.getUint16(r+2)}}function a(e){var t=new DataView(e);if(S&&console.log("Got file of length "+e.byteLength),255!=t.getUint8(0)||216!=t.getUint8(1))return S&&console.log("Not a valid JPEG"),!1;for(var n=2,r=e.byteLength;n<r;){if(function(e,t){return 56===e.getUint8(t)&&66===e.getUint8(t+1)&&73===e.getUint8(t+2)&&77===e.getUint8(t+3)&&4===e.getUint8(t+4)&&4===e.getUint8(t+5)}(t,n)){var i=t.getUint8(n+7);return i%2!=0&&(i+=1),0===i&&(i=4),s(e,n+8+i,t.getUint16(n+6+i))}n++}}function s(e,t,n){for(var r,i,o,a,s=new DataView(e),l={},u=t;u<t+n;)28===s.getUint8(u)&&2===s.getUint8(u+1)&&(a=s.getUint8(u+2))in v&&((o=s.getInt16(u+3))+5,i=v[a],r=f(s,u+5,o),l.hasOwnProperty(i)?l[i]instanceof Array?l[i].push(r):l[i]=[l[i],r]:l[i]=r),u++;return l}function l(e,t,n,r,i){var o,a,s,l=e.getUint16(n,!i),c={};for(s=0;s<l;s++)o=n+12*s+2,!(a=r[e.getUint16(o,!i)])&&S&&console.log("Unknown tag: "+e.getUint16(o,!i)),c[a]=u(e,o,t,n,i);return c}function u(e,t,n,r,i){var o,a,s,l,u,c,d=e.getUint16(t+2,!i),g=e.getUint32(t+4,!i),m=e.getUint32(t+8,!i)+n;switch(d){case 1:case 7:if(1==g)return e.getUint8(t+8,!i);for(o=g>4?m:t+8,a=[],l=0;l<g;l++)a[l]=e.getUint8(o+l);return a;case 2:return o=g>4?m:t+8,f(e,o,g-1);case 3:if(1==g)return e.getUint16(t+8,!i);for(o=g>2?m:t+8,a=[],l=0;l<g;l++)a[l]=e.getUint16(o+2*l,!i);return a;case 4:if(1==g)return e.getUint32(t+8,!i);for(a=[],l=0;l<g;l++)a[l]=e.getUint32(m+4*l,!i);return a;case 5:if(1==g)return u=e.getUint32(m,!i),c=e.getUint32(m+4,!i),s=new Number(u/c),s.numerator=u,s.denominator=c,s;for(a=[],l=0;l<g;l++)u=e.getUint32(m+8*l,!i),c=e.getUint32(m+4+8*l,!i),a[l]=new Number(u/c),a[l].numerator=u,a[l].denominator=c;return a;case 9:if(1==g)return e.getInt32(t+8,!i);for(a=[],l=0;l<g;l++)a[l]=e.getInt32(m+4*l,!i);return a;case 10:if(1==g)return e.getInt32(m,!i)/e.getInt32(m+4,!i);for(a=[],l=0;l<g;l++)a[l]=e.getInt32(m+8*l,!i)/e.getInt32(m+4+8*l,!i);return a}}function c(e,t,n){var r=e.getUint16(t,!n);return e.getUint32(t+2+12*r,!n)}function d(e,t,n,r){var i=c(e,t+n,r);if(!i)return{};if(i>e.byteLength)return{};var o=l(e,t,t+i,C,r);if(o.Compression)switch(o.Compression){case 6:if(o.JpegIFOffset&&o.JpegIFByteCount){var a=t+o.JpegIFOffset,s=o.JpegIFByteCount;o.blob=new Blob([new Uint8Array(e.buffer,a,s)],{type:"image/jpeg"})}break;case 1:console.log("Thumbnail image format is TIFF, which is not implemented.");break;default:console.log("Unknown thumbnail image format '%s'",o.Compression)}else 2==o.PhotometricInterpretation&&console.log("Thumbnail image format is RGB, which is not implemented.");return o}function f(e,t,r){var i="";for(n=t;n<t+r;n++)i+=String.fromCharCode(e.getUint8(n));return i}function g(e,t){if("Exif"!=f(e,t,4))return S&&console.log("Not valid EXIF data! "+f(e,t,4)),!1;var n,r,i,o,a,s=t+6;if(18761==e.getUint16(s))n=!1;else{if(19789!=e.getUint16(s))return S&&console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)"),!1;n=!0}if(42!=e.getUint16(s+2,!n))return S&&console.log("Not valid TIFF data! (no 0x002A)"),!1;var u=e.getUint32(s+4,!n);if(u<8)return S&&console.log("Not valid TIFF data! (First offset less than 8)",e.getUint32(s+4,!n)),!1;if((r=l(e,s,s+u,b,n)).ExifIFDPointer){o=l(e,s,s+r.ExifIFDPointer,y,n);for(i in o){switch(i){case"LightSource":case"Flash":case"MeteringMode":case"ExposureProgram":case"SensingMethod":case"SceneCaptureType":case"SceneType":case"CustomRendered":case"WhiteBalance":case"GainControl":case"Contrast":case"Saturation":case"Sharpness":case"SubjectDistanceRange":case"FileSource":o[i]=I[i][o[i]];break;case"ExifVersion":case"FlashpixVersion":o[i]=String.fromCharCode(o[i][0],o[i][1],o[i][2],o[i][3]);break;case"ComponentsConfiguration":o[i]=I.Components[o[i][0]]+I.Components[o[i][1]]+I.Components[o[i][2]]+I.Components[o[i][3]]}r[i]=o[i]}}if(r.GPSInfoIFDPointer){a=l(e,s,s+r.GPSInfoIFDPointer,x,n);for(i in a){switch(i){case"GPSVersionID":a[i]=a[i][0]+"."+a[i][1]+"."+a[i][2]+"."+a[i][3]}r[i]=a[i]}}return r.thumbnail=d(e,s,u,n),r}function m(e){if("DOMParser"in self){var t=new DataView(e);if(S&&console.log("Got file of length "+e.byteLength),255!=t.getUint8(0)||216!=t.getUint8(1))return S&&console.log("Not a valid JPEG"),!1;for(var n=2,r=e.byteLength,i=new DOMParser;n<r-4;){if("http"==f(t,n,4)){var o=f(t,n-1,t.getUint16(n-2)-1),a=o.indexOf("xmpmeta>")+8,s=(o=o.substring(o.indexOf("<x:xmpmeta"),a)).indexOf("x:xmpmeta")+10;return o=o.slice(0,s)+'xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tiff="http://ns.adobe.com/tiff/1.0/" xmlns:plus="http://schemas.android.com/apk/lib/com.google.android.gms.plus" xmlns:ext="http://www.gettyimages.com/xsltExtension/1.0" xmlns:exif="http://ns.adobe.com/exif/1.0/" xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" xmlns:xapGImg="http://ns.adobe.com/xap/1.0/g/img/" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '+o.slice(s),h(i.parseFromString(o,"text/xml"))}n++}}}function p(e){var t={};if(1==e.nodeType){if(e.attributes.length>0){t["@attributes"]={};for(var n=0;n<e.attributes.length;n++){var r=e.attributes.item(n);t["@attributes"][r.nodeName]=r.nodeValue}}}else if(3==e.nodeType)return e.nodeValue;if(e.hasChildNodes())for(var i=0;i<e.childNodes.length;i++){var o=e.childNodes.item(i),a=o.nodeName;if(null==t[a])t[a]=p(o);else{if(null==t[a].push){var s=t[a];t[a]=[],t[a].push(s)}t[a].push(p(o))}}return t}function h(e){try{var t={};if(e.children.length>0)for(var n=0;n<e.children.length;n++){var r=e.children.item(n),i=r.attributes;for(var o in i){var a=i[o],s=a.nodeName,l=a.nodeValue;void 0!==s&&(t[s]=l)}var u=r.nodeName;if(void 0===t[u])t[u]=p(r);else{if(void 0===t[u].push){var c=t[u];t[u]=[],t[u].push(c)}t[u].push(p(r))}}else t=e.textContent;return t}catch(e){console.log(e.message)}}var S=!1,P=this,F=function(e){return e instanceof F?e:this instanceof F?void(this.EXIFwrapped=e):new F(e)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=F),exports.EXIF=F):P.EXIF=F;var y=F.Tags={36864:"ExifVersion",40960:"FlashpixVersion",40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37500:"MakerNote",37510:"UserComment",40964:"RelatedSoundFile",36867:"DateTimeOriginal",36868:"DateTimeDigitized",37520:"SubsecTime",37521:"SubsecTimeOriginal",37522:"SubsecTimeDigitized",33434:"ExposureTime",33437:"FNumber",34850:"ExposureProgram",34852:"SpectralSensitivity",34855:"ISOSpeedRatings",34856:"OECF",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureBias",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37396:"SubjectArea",37386:"FocalLength",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41492:"SubjectLocation",41493:"ExposureIndex",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRation",41989:"FocalLengthIn35mmFilm",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",40965:"InteroperabilityIFDPointer",42016:"ImageUniqueID"},b=F.TiffTags={256:"ImageWidth",257:"ImageHeight",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer",40965:"InteroperabilityIFDPointer",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",274:"Orientation",277:"SamplesPerPixel",284:"PlanarConfiguration",530:"YCbCrSubSampling",531:"YCbCrPositioning",282:"XResolution",283:"YResolution",296:"ResolutionUnit",273:"StripOffsets",278:"RowsPerStrip",279:"StripByteCounts",513:"JPEGInterchangeFormat",514:"JPEGInterchangeFormatLength",301:"TransferFunction",318:"WhitePoint",319:"PrimaryChromaticities",529:"YCbCrCoefficients",532:"ReferenceBlackWhite",306:"DateTime",270:"ImageDescription",271:"Make",272:"Model",305:"Software",315:"Artist",33432:"Copyright"},x=F.GPSTags={0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential"},C=F.IFD1Tags={256:"ImageWidth",257:"ImageHeight",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",273:"StripOffsets",274:"Orientation",277:"SamplesPerPixel",278:"RowsPerStrip",279:"StripByteCounts",282:"XResolution",283:"YResolution",284:"PlanarConfiguration",296:"ResolutionUnit",513:"JpegIFOffset",514:"JpegIFByteCount",529:"YCbCrCoefficients",530:"YCbCrSubSampling",531:"YCbCrPositioning",532:"ReferenceBlackWhite"},I=F.StringValues={ExposureProgram:{0:"Not defined",1:"Manual",2:"Normal program",3:"Aperture priority",4:"Shutter priority",5:"Creative program",6:"Action program",7:"Portrait mode",8:"Landscape mode"},MeteringMode:{0:"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{0:"Unknown",1:"Daylight",2:"Fluorescent",3:"Tungsten (incandescent light)",4:"Flash",9:"Fine weather",10:"Cloudy weather",11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 - 5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{0:"Flash did not fire",1:"Flash fired",5:"Strobe return light not detected",7:"Strobe return light detected",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected",15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode",77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},SensingMethod:{1:"Not defined",2:"One-chip color area sensor",3:"Two-chip color area sensor",4:"Three-chip color area sensor",5:"Color sequential area sensor",7:"Trilinear sensor",8:"Color sequential linear sensor"},SceneCaptureType:{0:"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},SceneType:{1:"Directly photographed"},CustomRendered:{0:"Normal process",1:"Custom process"},WhiteBalance:{0:"Auto white balance",1:"Manual white balance"},GainControl:{0:"None",1:"Low gain up",2:"High gain up",3:"Low gain down",4:"High gain down"},Contrast:{0:"Normal",1:"Soft",2:"Hard"},Saturation:{0:"Normal",1:"Low saturation",2:"High saturation"},Sharpness:{0:"Normal",1:"Soft",2:"Hard"},SubjectDistanceRange:{0:"Unknown",1:"Macro",2:"Close view",3:"Distant view"},FileSource:{3:"DSC"},Components:{0:"",1:"Y",2:"Cb",3:"Cr",4:"R",5:"G",6:"B"}},v={120:"caption",110:"credit",25:"keywords",55:"dateCreated",80:"byline",85:"bylineTitle",122:"captionWriter",105:"headline",116:"copyright",15:"category"};F.enableXmp=function(){F.isXmpEnabled=!0},F.disableXmp=function(){F.isXmpEnabled=!1},F.getData=function(t,n){return!((self.Image&&t instanceof self.Image||self.HTMLImageElement&&t instanceof self.HTMLImageElement)&&!t.complete)&&(e(t)?n&&n.call(t):i(t,n),!0)},F.getTag=function(t,n){if(e(t))return t.exifdata[n]},F.getIptcTag=function(t,n){if(e(t))return t.iptcdata[n]},F.getAllTags=function(t){if(!e(t))return{};var n,r=t.exifdata,i={};for(n in r)r.hasOwnProperty(n)&&(i[n]=r[n]);return i},F.getAllIptcTags=function(t){if(!e(t))return{};var n,r=t.iptcdata,i={};for(n in r)r.hasOwnProperty(n)&&(i[n]=r[n]);return i},F.pretty=function(t){if(!e(t))return"";var n,r=t.exifdata,i="";for(n in r)r.hasOwnProperty(n)&&("object"==typeof r[n]?r[n]instanceof Number?i+=n+" : "+r[n]+" ["+r[n].numerator+"/"+r[n].denominator+"]\r\n":i+=n+" : ["+r[n].length+" values]\r\n":i+=n+" : "+r[n]+"\r\n");return i},F.readFromBinaryFile=function(e){return o(e)},"function"==typeof define&&define.amd&&define("exif-js",[],function(){return F})}).call(this);

/* ===== js\state.js ===== */
// Single source of truth — import this wherever photos/exifCount/camerasSet
// are read or mutated so all modules stay in sync.

const photos = [];   // Array of photo objects { id, file, src, exif, name, size, naturalW, naturalH }
let exifCount = 0;
const camerasSet = new Set();

function setExifCount(n) { exifCount = n; }


/* ===== js\formatters.js ===== */

function formatAperture(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  return 'f/' + n.toFixed(1);
}

function formatShutter(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  if (n >= 1) return n.toFixed(1) + 's';
  return '1/' + Math.round(1 / n) + 's';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(dateParts[1], 10);
  return `${dateParts[2]} ${months[m - 1] || m} ${dateParts[0]}, ${parts[1]}`;
}

function getFlashDesc(v) {
  return (v & 1) === 1 ? 'Fired' : 'Did not fire';
}

function getMeteringMode(v) {
  const modes = { 0: 'Unknown', 1: 'Average', 2: 'Center-weighted', 3: 'Spot', 4: 'Multi-spot', 5: 'Pattern', 6: 'Partial' };
  return modes[v] || 'Unknown';
}

function convertDMStoDD(dms, ref) {
  if (!dms || dms.length < 3) return 0;
  const d = dms[0].numerator / dms[0].denominator;
  const m = dms[1].numerator / dms[1].denominator;
  const s = dms[2].numerator / dms[2].denominator;
  let dd = d + m / 60 + s / 3600;
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
}



/* ===== js\lightbox.js ===== */
// ── Track the currently open photo ──
let currentPhotoId = null;
let miniMap = null; // Tracks the active Leaflet map

// ── Public API ────────────────────────────────────────────────────────────────

function openLightbox(id) {
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
        ↖ Open in Google Maps
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

  lbImg.onclick = function() { this.classList.toggle('enlarged'); };
}

function closeLightbox() {
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

/* ===== js\gallery.js ===== */
// ─── GALLERY ──────────────────────────────────────────────────────────────────
// Drag & drop wiring, file ingestion, stats bar, clear-all, and individual
// photo removal all live here.

// ── Drag & Drop ───────────────────────────────────────────────────────────────

function onDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}

function onDragLeave() {
  document.getElementById('drop-zone').classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}

// ── File Handling ─────────────────────────────────────────────────────────────

function handleFiles(files) {
  if (!files || files.length === 0) return;
  _showGallery();

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;

    // Unique ID for safe async removal
    const id = Math.random().toString(36).substring(2, 9);
    // Lightweight Object URL — avoids keeping a full base64 string in RAM
    const objectURL = URL.createObjectURL(file);

    photos.push({ id, file, src: objectURL, exif: null });

    const card = createLoadingCard();
    document.getElementById('gallery').appendChild(card);

    readExif(file, objectURL, id, card);
  });
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
}

// ── Remove a Single Photo ─────────────────────────────────────────────────────

function removePhoto(id, cardElement) {
  const index = photos.findIndex(p => p.id === id);
  if (index !== -1) {
    URL.revokeObjectURL(photos[index].src); // Free memory immediately
    photos.splice(index, 1);
  }
  cardElement.remove();
  updateStats();
}

// ── Clear All ─────────────────────────────────────────────────────────────────

function clearAll() {
  photos.forEach(photo => URL.revokeObjectURL(photo.src));
  photos.length = 0;
  document.getElementById('gallery').innerHTML = '';

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  
  updateStats();
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function updateStats() {
  // Recompute from the live photos array
  const newExifCount = photos.filter(p => p.exif && Object.keys(p.exif).length > 0).length;
  setExifCount(newExifCount);

  camerasSet.clear();
  photos.forEach(p => {
    if (p.exif && p.exif.Make) {
      camerasSet.add((p.exif.Make + ' ' + (p.exif.Model || '')).trim());
    }
  });

  document.getElementById('stat-count').textContent = photos.length;
  document.getElementById('stat-exif').textContent = newExifCount;

  const cameraWrap = document.getElementById('stat-camera-wrap');
  if (camerasSet.size > 0) {
    cameraWrap.style.display = 'flex';
    const cams = Array.from(camerasSet).slice(0, 3).join(', ');
    document.getElementById('stat-cameras').textContent =
      cams + (camerasSet.size > 3 ? ` +${camerasSet.size - 3}` : '');
  } else {
    cameraWrap.style.display = 'none';
  }

  // Reset UI when gallery becomes empty
  if (photos.length === 0) {
    document.getElementById('gallery').innerHTML = '';
    _hideGallery();
  }
}

// ── Private UI helpers ────────────────────────────────────────────────────────

function _showGallery() {
  document.body.classList.add('gallery-active');
}

function _hideGallery() {
  document.body.classList.remove('gallery-active');
}


/* ===== js\card.js ===== */
// ─── CARD BUILDER ─────────────────────────────────────────────────────────────
// Responsible for creating both the skeleton loading card and the fully-
// populated photo card DOM elements.

/** Returns a shimmer skeleton placeholder inserted while EXIF loads. */
function createLoadingCard() {
  const div = document.createElement('div');
  div.className = 'card-loading';
  return div;
}

/**
 * Builds a fully populated photo card for the given photo ID.
 * @param {string} id - Unique photo ID from state.photos
 * @returns {HTMLElement}
 */
function buildCard(id) {
  const p = photos.find(photo => photo.id === id);
  const idx = photos.findIndex(photo => photo.id === id);

  const exif = p.exif || {};
  const hasExif = Object.keys(exif).length > 0;

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.onclick = () => openLightbox(id);
  
  // Set initial opacity to 0 so it stays hidden until GSAP reveals it
  card.style.opacity = '0'; 

  // ── Remove button ──
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '✕';
  removeBtn.onclick = (e) => {
    e.stopPropagation(); 
    removePhoto(id, card);
  };
  card.appendChild(removeBtn);

  // ── Thumbnail & Dynamic Logic ──
  const img = document.createElement('img');
  img.src = p.src;
  img.alt = p.name;
  img.loading = 'lazy';
  
  // Wait for image to load to extract color and animate
  img.onload = () => {
    // 1. EXTRACT AVERAGE COLOR (The 1x1 Canvas Trick)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1; 
    canvas.height = 1;
    ctx.drawImage(img, 0, 0, 1, 1);
    
    try {
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      // Inject the color into CSS variables. We use 0.3 opacity to keep it subtle and misty.
      card.style.setProperty('--card-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
      card.style.setProperty('--card-glow-shadow', `rgba(${r}, ${g}, ${b}, 0.15)`);
    } catch(e) {
      console.warn("Could not extract image color.");
    }

    // 2. TRIGGER GSAP ANIMATION
    if (window.gsap) {
      gsap.fromTo(card, 
        { opacity: 0, scale: 0.9, y: 20 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.2)", delay: (idx % 10) * 0.05 }
      );
    } else {
      // Fallback if GSAP fails to load
      card.style.opacity = '1';
    }
  };
  
  card.appendChild(img);

  // ── Camera badge (top-left) ──
  if (exif.Make) {
    const badge = document.createElement('div');
    badge.className = 'camera-badge';
    badge.textContent = (exif.Make + (exif.Model ? ' ' + exif.Model : '')).trim().substring(0, 24);
    card.appendChild(badge);
  }

  // ── Hover overlay ──
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
      { label: 'Shutter', val: formatShutter(exif.ExposureTime) },
      { label: 'ISO', val: exif.ISOSpeedRatings ? 'ISO ' + exif.ISOSpeedRatings : null },
      { label: 'Focal', val: exif.FocalLength ? exif.FocalLength.toFixed(0) + 'mm' : null },
    ].filter(f => f.val);

    fields.forEach(f => {
      const item = document.createElement('div');
      item.className = 'exif-item';
      item.innerHTML = `<span class="exif-label">${f.label}</span><span class="exif-val">${f.val}</span>`;
      grid.appendChild(item);
    });

    if (fields.length > 0) {
      overlay.appendChild(grid);
    } else {
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


/* ===== js\exif.js ===== */
// ─── EXIF READING ─────────────────────────────────────────────────────────────
// Reads raw EXIF data from a File object via EXIF.js (global), then hands off
// to the card builder once image dimensions are also known.

/**
 * Kick off async EXIF extraction + dimension measurement for one file.
 * @param {File}        file        - Raw File from the input / drop event
 * @param {string}      src         - Object URL already created for this file
 * @param {string}      id          - Unique ID assigned to this photo
 * @param {HTMLElement} placeholder - Loading-card element to be replaced when done
 */
window.readExif = window.readExif || function readExif(file, src, id, placeholder) {
  const p = photos.find(photo => photo.id === id);
  if (!p) return;

  p.name = file.name;
  p.size = file.size;
  p.exif = {};

  let rendered = false;
  let renderedCard = null;

  function renderCard() {
    const latestPhoto = photos.find(photo => photo.id === id);
    if (!latestPhoto) return;

    const card = buildCard(id);

    if (rendered && renderedCard) {
      renderedCard.replaceWith(card);
    } else {
      placeholder.replaceWith(card);
    }

    rendered = true;
    renderedCard = card;
    updateStats();
  }

  function setDimensions(width, height) {
    const latestPhoto = photos.find(photo => photo.id === id);
    if (!latestPhoto) return;

    latestPhoto.naturalW = width || 0;
    latestPhoto.naturalH = height || 0;
    renderCard();
  }

  const tempImg = new Image();
  tempImg.onload = function () {
    setDimensions(tempImg.naturalWidth, tempImg.naturalHeight);
  };
  tempImg.onerror = function () {
    setDimensions(0, 0);
  };
  tempImg.src = src;

  try {
    if (window.EXIF && typeof EXIF.getData === 'function') {
      EXIF.getData(file, function () {
        const latestPhoto = photos.find(photo => photo.id === id);
        if (!latestPhoto) return;

        try {
          latestPhoto.exif = EXIF.getAllTags(this) || {};
        } catch (err) {
          latestPhoto.exif = {};
          console.warn('Could not read EXIF data.', err);
        }

        if (rendered) renderCard();
      });

      setTimeout(() => {
        if (!rendered) renderCard();
      }, 1200);
      return;
    }
  } catch (err) {
    console.warn('Could not start EXIF reader.', err);
  }

  setTimeout(() => {
    if (!rendered) renderCard();
  }, 0);
};


/* ===== script.js ===== */
// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// Wires the page controls and keeps the core functions available globally.

function toggleTheme() {
  const htmlDoc = document.documentElement;
  const themeBtn = document.getElementById('theme-btn');
  const isLight = htmlDoc.classList.toggle('light-theme');

  if (themeBtn) {
    themeBtn.textContent = isLight ? '🌙 Dark' : '☀️ Light';
  }
}

function initEventHandlers() {
  const themeBtn = document.getElementById('theme-btn');
  const clearBtn = document.getElementById('clear-btn');
  const addPhotosBtn = document.getElementById('add-photos-btn');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');

  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  if (addPhotosBtn && fileInput) addPhotosBtn.addEventListener('click', () => fileInput.click());
  if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', onDragOver);
    dropZone.addEventListener('dragleave', onDragLeave);
    dropZone.addEventListener('drop', onDrop);
  }
}

// Attach to window so inline onclick handlers in index.html keep working.
window.handleFiles = handleFiles;
window.clearAll = clearAll;
window.onDragOver = onDragOver;
window.onDragLeave = onDragLeave;
window.onDrop = onDrop;
window.closeLightbox = closeLightbox;
window.toggleTheme = toggleTheme;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventHandlers);
} else {
  initEventHandlers();
}

