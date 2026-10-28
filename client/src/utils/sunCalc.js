/**
 * Pure Astronomical Solar Position & Golden Hour Calculator.
 * 
 * Implements standard Jean Meeus astronomical algorithms to compute
 * solar elevation, azimuth, golden hour, blue hour, and celestial cycles.
 * 100% client-side, zero external dependencies.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Normalizes an angle to 0..360 degrees.
 */
function normalizeDegrees(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Computes solar position (altitude and azimuth in degrees) for a given Date and coordinates.
 * 
 * @param {Date} date Capture timestamp
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {Object} Solar altitude, azimuth, solar phase name, and descriptive lighting guidance
 */
export function getSolarPosition(date, lat, lon) {
  if (!date || isNaN(date.getTime())) {
    return null;
  }

  // Fallback to equator if coordinates omitted
  const latitude = typeof lat === 'number' && !isNaN(lat) ? lat : 0;
  const longitude = typeof lon === 'number' && !isNaN(lon) ? lon : 0;

  // Julian Day
  const time = date.getTime();
  const jd = time / 86400000 + 2440587.5;
  const d = jd - 2451545.0;

  // Mean solar anomaly
  const M = normalizeDegrees(357.5291 + 0.98560028 * d) * RAD;

  // Equation of the center
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;

  // Ecliptic longitude
  const eclipticLon = normalizeDegrees((M * DEG) + (C * DEG) + 180 + 102.9372) * RAD;

  // Obliquity of the ecliptic
  const ob = 23.4397 * RAD;

  // Declination
  const sinDec = Math.sin(eclipticLon) * Math.sin(ob);
  const dec = Math.asin(sinDec);

  // Right Ascension
  const ra = Math.atan2(Math.sin(eclipticLon) * Math.cos(ob), Math.cos(eclipticLon));

  // Sidereal time & Local Hour Angle
  const gmst = normalizeDegrees(280.16 + 360.9856235 * d) * RAD;
  const H = gmst + (longitude * RAD) - ra;

  // Solar Altitude (Elevation)
  const phi = latitude * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altitudeDeg = alt * DEG;

  // Solar Azimuth (measured from South or North)
  const cosAz = (Math.sin(dec) - Math.sin(phi) * Math.sin(alt)) / (Math.cos(phi) * Math.cos(alt));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * DEG;
  if (Math.sin(H) > 0) {
    az = 360 - az;
  }
  // Convert to compass bearing (0° North, 90° East, 180° South, 270° West)
  const azimuthBearing = normalizeDegrees(az + 180);

  // Compass Cardinal
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const cardIndex = Math.round(azimuthBearing / 22.5) % 16;
  const compassCard = cardinals[cardIndex];

  // Lighting Condition Phase Classification
  let phase = 'DAYLIGHT';
  let phaseName = 'Direct Daylight';
  let phaseColor = '#facc15';
  let phaseDesc = 'Bright sun above 6°. Harsh direct light with sharp, high-contrast directional shadows.';

  if (altitudeDeg > 45) {
    phase = 'ZENITH';
    phaseName = 'High Overhead Sun';
    phaseColor = '#ffffff';
    phaseDesc = 'Sun high in the sky. Deep downward shadows under brow and nose; consider diffuser or fill flash.';
  } else if (altitudeDeg > 6 && altitudeDeg <= 20) {
    phase = 'GOLDEN_APPROACH';
    phaseName = 'Late Afternoon / Warm Light';
    phaseColor = '#f59e0b';
    phaseDesc = 'Sun descending. Color temperature warming; shadows lengthening beautifully across textures.';
  } else if (altitudeDeg > 0 && altitudeDeg <= 6) {
    phase = 'GOLDEN_HOUR';
    phaseName = 'Golden Hour ✨';
    phaseColor = '#fbbf24';
    phaseDesc = 'Prime photographic light. Diffuse warm amber tones, long soft shadows, and glowing rim highlights.';
  } else if (altitudeDeg >= -4 && altitudeDeg <= 0) {
    phase = 'BLUE_HOUR';
    phaseName = 'Civil Dusk / Blue Hour 🌌';
    phaseColor = '#60a5fa';
    phaseDesc = 'Sun just below horizon. Deep saturated cobalt sky, cool ambient wash; ideal for cityscape glow.';
  } else if (altitudeDeg >= -12 && altitudeDeg < -4) {
    phase = 'NAUTICAL_TWILIGHT';
    phaseName = 'Nautical Twilight';
    phaseColor = '#818cf8';
    phaseDesc = 'Horizon visible at sea; first magnitude stars appear. Deep gradient tones across the sky.';
  } else if (altitudeDeg >= -18 && altitudeDeg < -12) {
    phase = 'ASTRONOMICAL_TWILIGHT';
    phaseName = 'Astronomical Twilight';
    phaseColor = '#c084fc';
    phaseDesc = 'Atmospheric glow faint. Milky Way galactic core beginning to emerge from darkness.';
  } else {
    phase = 'NIGHT';
    phaseName = 'True Night (Astro Window)';
    phaseColor = '#a855f7';
    phaseDesc = 'Sun more than 18° below horizon. Pure dark sky; pristine conditions for astrophotography & long exposures.';
  }

  return {
    altitude: altitudeDeg,
    azimuth: azimuthBearing,
    cardinal: compassCard,
    phase,
    phaseName,
    phaseColor,
    phaseDesc
  };
}

/**
 * Calculates that day's approximate solar milestones (sunrise, solar noon, sunset, golden hour windows).
 */
export function getDailySunTimes(date, lat, lon) {
  if (!date || isNaN(date.getTime()) || typeof lat !== 'number' || typeof lon !== 'number') {
    return null;
  }

  // Simplified approximation of sunrise and sunset for daily schedule visualization
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);

  // Hour angle for sunrise at altitude = -0.833°
  const phi = lat * RAD;
  const time = noon.getTime();
  const jd = time / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const M = normalizeDegrees(357.5291 + 0.98560028 * d) * RAD;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M)) * RAD;
  const eclipticLon = normalizeDegrees((M * DEG) + (C * DEG) + 180 + 102.9372) * RAD;
  const ob = 23.4397 * RAD;
  const dec = Math.asin(Math.sin(eclipticLon) * Math.sin(ob));

  const cosH0 = (Math.sin(-0.833 * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));

  // If perpetual night or midnight sun at polar latitudes
  if (cosH0 > 1 || cosH0 < -1) {
    return null;
  }

  const H0 = Math.acos(cosH0) * DEG;
  const timeDiffHours = H0 / 15;

  const solarNoonMinutes = 12 * 60 - (lon * 4); // local solar noon offset
  const sunriseMinutes = solarNoonMinutes - timeDiffHours * 60;
  const sunsetMinutes = solarNoonMinutes + timeDiffHours * 60;

  const formatMin = (mins) => {
    let m = mins % (24 * 60);
    if (m < 0) m += 24 * 60;
    const hrs = Math.floor(m / 60);
    const mn = Math.round(m % 60);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayH = hrs % 12 || 12;
    return `${displayH}:${mn < 10 ? '0' : ''}${mn} ${ampm}`;
  };

  return {
    sunrise: formatMin(sunriseMinutes),
    morningGoldenHour: `${formatMin(sunriseMinutes)} – ${formatMin(sunriseMinutes + 45)}`,
    solarNoon: formatMin(solarNoonMinutes),
    eveningGoldenHour: `${formatMin(sunsetMinutes - 45)} – ${formatMin(sunsetMinutes)}`,
    sunset: formatMin(sunsetMinutes),
    blueHour: `${formatMin(sunsetMinutes)} – ${formatMin(sunsetMinutes + 30)}`
  };
}
