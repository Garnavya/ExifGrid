// client/src/components/JourneyMap.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/map.css';
import { formatAperture, formatExifDate } from '../utils/formatters.js';
import { createMapTileLayer, MAP_STYLES, MAP_STYLE_LABELS } from '../utils/mapConfig.js';

export default function JourneyMap({ photos = [], onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.GOOGLE_STREETS);

  // Esc key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const parseTimestamp = (val) => {
    if (!val) return 0;
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'string') {
      const cleaned = val.trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      const d = new Date(cleaned);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
  };

  const geotaggedPhotos = useMemo(() => {
    return photos
      .filter(p => {
        const lat = p.exif?.latitude ?? p.exif?.gpsLat;
        const lng = p.exif?.longitude ?? p.exif?.gpsLng;
        return lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
      })
      .sort((a, b) => {
        const timeA = parseTimestamp(a.exif?.dateTimeOriginal || a.exif?.DateTimeOriginal || a.exif?.dateTime);
        const timeB = parseTimestamp(b.exif?.dateTimeOriginal || b.exif?.DateTimeOriginal || b.exif?.dateTime);
        return timeA - timeB;
      });
  }, [photos]);

  // Handle TileLayer switching dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = createMapTileLayer(mapStyle).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  useEffect(() => {
    let isMounted = true;
    let timeouts = [];

    if (!mapInstanceRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([20, 0], 2);
      
      const layer = createMapTileLayer(mapStyle).addTo(map);
      tileLayerRef.current = layer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size immediately so tiles render properly inside the modal
    const resizeTimer = setTimeout(() => {
      if (isMounted && mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    timeouts.push(resizeTimer);

    const journeyPoints = geotaggedPhotos.map(p => {
      const lat = Number(p.exif.latitude ?? p.exif.gpsLat);
      const lng = Number(p.exif.longitude ?? p.exif.gpsLng);
      return { lat, lng, photo: p };
    });

    if (journeyPoints.length > 0) {
      const latLngs = journeyPoints.map(pt => [pt.lat, pt.lng]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.2 });

      if (journeyPoints.length > 1) {
        L.polyline(latLngs, {
          color: '#00ffcc',
          weight: 3,
          opacity: 0.85,
          className: 'animated-route'
        }).addTo(map);
      }

      journeyPoints.forEach((pt, index) => {
        const customIcon = L.divIcon({ className: 'photo-marker', iconSize: [14, 14] });
        
        const timerId = setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(mapInstanceRef.current);
            
            // Rich photographic popup
            const p = pt.photo;
            const formattedDate = formatExifDate(p.exif?.DateTimeOriginal || p.exif?.dateTime);
            const opticsText = [
              p.exif?.Model,
              p.exif?.FocalLength && `${Math.round(p.exif.FocalLength)}mm`,
              p.exif?.FNumber && formatAperture(p.exif.FNumber)
            ].filter(Boolean).join(' • ');

            const popupHtml = `
              <div style="font-family: var(--font-body); min-width: 180px; max-width: 240px; padding: 2px;">
                ${p.src ? `<img src="${p.src}" alt="${p.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />` : ''}
                <div style="font-weight: 600; font-size: 12px; margin-bottom: 2px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</div>
                ${opticsText ? `<div style="font-family: var(--font-mono); font-size: 10px; color: #00ffcc; margin-bottom: 2px;">${opticsText}</div>` : ''}
                ${formattedDate ? `<div style="font-size: 10px; color: #94a3b8;">${formattedDate}</div>` : ''}
                <div style="font-family: var(--font-mono); font-size: 9px; color: #64748b; margin-top: 4px;">Lat: ${pt.lat.toFixed(4)}, Lon: ${pt.lng.toFixed(4)}</div>
              </div>
            `;
            marker.bindPopup(popupHtml);
          }
        }, index * 120);

        timeouts.push(timerId);
      });
    }

    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [geotaggedPhotos]);

  return (
    <div className="journey-modal-overlay" onClick={onClose}>
      <div className="journey-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="journey-modal-header">
          <div className="journey-modal-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', color: '#00ffcc' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>Global Photographic Journey</span>
            <span className="journey-badge">
              {geotaggedPhotos.length} {geotaggedPhotos.length === 1 ? 'Geotagged Photo' : 'Geotagged Photos'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* CARTO Basemap Style Switcher */}
            <div style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px'
            }}>
              {Object.entries(MAP_STYLE_LABELS).map(([styleKey, label]) => (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => setMapStyle(styleKey)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: mapStyle === styleKey ? 'var(--surface2)' : 'transparent',
                    color: mapStyle === styleKey ? 'var(--accent)' : 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: mapStyle === styleKey ? '600' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button 
              type="button" 
              className="journey-close-btn" 
              onClick={onClose} 
              title="Close Journey Map (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Map Body */}
        <div className="journey-modal-body">
          {geotaggedPhotos.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-dim)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', color: '#64748b', marginBottom: '12px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <h3 style={{ color: 'var(--text)', marginBottom: '6px' }}>No Geotagged Photos in Gallery</h3>
              <p style={{ maxWidth: '400px', fontSize: '13px', lineHeight: '1.5' }}>
                None of your currently loaded photos contain GPS coordinates in their EXIF headers. Import images captured with location services enabled to trace your journey route.
              </p>
            </div>
          ) : (
            <div 
              className="journey-map-container" 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
