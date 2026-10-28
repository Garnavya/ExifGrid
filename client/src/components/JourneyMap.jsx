// client/src/components/JourneyMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/map.css';

export default function JourneyMap({ photos }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let timeouts = []; // 1. Array to track all pending animations

    if (!mapInstanceRef.current && mapContainerRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([20, 0], 2);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

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

    const journeyPoints = photos
      .filter(p => {
        const lat = p.exif?.latitude ?? p.exif?.gpsLat;
        const lng = p.exif?.longitude ?? p.exif?.gpsLng;
        return lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
      })
      .sort((a, b) => {
        const timeA = parseTimestamp(a.exif?.dateTimeOriginal || a.exif?.DateTimeOriginal || a.exif?.dateTime);
        const timeB = parseTimestamp(b.exif?.dateTimeOriginal || b.exif?.DateTimeOriginal || b.exif?.dateTime);
        return timeA - timeB;
      })
      .map(p => {
         const lat = Number(p.exif.latitude ?? p.exif.gpsLat);
         const lng = Number(p.exif.longitude ?? p.exif.gpsLng);
         return [lat, lng];
      });

    if (journeyPoints.length > 0) {
      const bounds = L.latLngBounds(journeyPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true, duration: 1.5 });

      if (journeyPoints.length > 1) {
        L.polyline(journeyPoints, {
          color: '#00ffcc',
          weight: 3,
          opacity: 0.8,
          className: 'animated-route' 
        }).addTo(map);
      }

      journeyPoints.forEach((point, index) => {
        const customIcon = L.divIcon({ className: 'photo-marker', iconSize: [12, 12] });
        
        // 2. Push every timeout into our tracking array
        const timerId = setTimeout(() => {
          // 3. Strict safety check: don't draw if unmounted or map is gone
          if (isMounted && mapInstanceRef.current) {
             L.marker(point, { icon: customIcon }).addTo(mapInstanceRef.current);
          }
        }, index * 200); 

        timeouts.push(timerId);
      });
    }

    return () => {
      // 4. Clean up everything when the user switches away
      isMounted = false;
      timeouts.forEach(clearTimeout); // Kill all zombie animations
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [photos]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', padding: '0 2rem 2rem 2rem', height: 'calc(100vh - 180px)' }}>
        <div className="map-container" ref={mapContainerRef} style={{ height: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}></div>
    </div>
  );
}