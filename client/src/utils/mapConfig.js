import L from 'leaflet';

/**
 * Map Configuration & High-Resolution Tile Provider.
 * 
 * Supports:
 * - Google Maps (Streets / Roadmap, Satellite Hybrid, Terrain)
 * - CARTO Basemaps (Dark Matter)
 * - OpenStreetMap
 */

export const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4ybb_1_4994f3ed1765777b8258e3cb';

export const MAP_STYLES = {
  GOOGLE_STREETS: 'google_streets',
  GOOGLE_HYBRID: 'google_hybrid',
  GOOGLE_TERRAIN: 'google_terrain',
  DARK: 'dark_all',
  OSM: 'osm'
};

export const MAP_STYLE_LABELS = {
  [MAP_STYLES.GOOGLE_STREETS]: '🗺️ Google Maps',
  [MAP_STYLES.GOOGLE_HYBRID]: '🛰️ Google Satellite',
  [MAP_STYLES.GOOGLE_TERRAIN]: '⛰️ Google Terrain',
  [MAP_STYLES.DARK]: '🌑 Dark Mode'
};

/**
 * Creates a Leaflet TileLayer for the requested map style.
 * 
 * @param {string} style Map style variant (google_streets, google_hybrid, google_terrain, dark_all, osm)
 * @param {Object} customOptions Optional Leaflet TileLayer options override
 * @returns {L.TileLayer} Configured Leaflet TileLayer instance
 */
export function createMapTileLayer(style = MAP_STYLES.GOOGLE_STREETS, customOptions = {}) {
  switch (style) {
    case MAP_STYLES.GOOGLE_STREETS:
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        minZoom: 1,
        attribution: '&copy; Google Maps',
        ...customOptions
      });

    case MAP_STYLES.GOOGLE_HYBRID:
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        minZoom: 1,
        attribution: '&copy; Google Maps',
        ...customOptions
      });

    case MAP_STYLES.GOOGLE_TERRAIN:
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        minZoom: 1,
        attribution: '&copy; Google Maps',
        ...customOptions
      });

    case MAP_STYLES.DARK:
      return L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 1,
        attribution: '&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        crossOrigin: true,
        ...customOptions
      });

    case MAP_STYLES.OSM:
    default:
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 1,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        ...customOptions
      });
  }
}

// Backward compatibility aliases
export const createCartoTileLayer = createMapTileLayer;
