import { useMemo, useState } from 'react';
import { getSolarPosition, getDailySunTimes } from '../utils/sunCalc.js';

export default function SunTracker({ dateString, lat, lon }) {
  const [showSchedule, setShowSchedule] = useState(false);

  // Parse EXIF date: "YYYY:MM:DD HH:MM:SS" or standard ISO
  const captureDate = useMemo(() => {
    if (!dateString) return null;
    if (typeof dateString === 'string' && dateString.includes(':')) {
      const parts = dateString.split(' ');
      if (parts.length >= 2) {
        const d = parts[0].replace(/:/g, '-');
        const parsed = new Date(`${d}T${parts[1]}`);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime()) ? null : fallback;
  }, [dateString]);

  const solarData = useMemo(() => {
    if (!captureDate) return null;
    return getSolarPosition(captureDate, lat, lon);
  }, [captureDate, lat, lon]);

  const dailySchedule = useMemo(() => {
    if (!captureDate || typeof lat !== 'number' || typeof lon !== 'number') return null;
    return getDailySunTimes(captureDate, lat, lon);
  }, [captureDate, lat, lon]);

  if (!solarData) {
    return null;
  }

  // SVG Arc Geometry (Dimensions: 240 x 120)
  const arcRadius = 76;
  const cx = 120;
  const cy = 100;

  // Normalized angle: horizon (0°) is at angle 0 rad, zenith (90°) is at angle -pi/2
  // Map solar altitude (-20° to 90°) to arc angle
  const clampedAlt = Math.max(-20, Math.min(90, solarData.altitude));
  const isSetting = solarData.azimuth >= 180;
  let angleOnDome;
  if (!isSetting) {
    // Rising: 180° -> 90°
    angleOnDome = 180 - (Math.max(0, clampedAlt) / 90) * 90;
  } else {
    // Setting: 90° -> 0°
    angleOnDome = 90 - (Math.max(0, clampedAlt) / 90) * 90;
  }
  const radDome = (angleOnDome * Math.PI) / 180;
  const sunX = cx + arcRadius * Math.cos(radDome);
  const sunY = cy - arcRadius * Math.sin(radDome);

  return (
    <div className="meta-section sun-tracker-section" style={{ marginTop: '8px' }}>
      <div className="meta-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Sun Elevation & Natural Light</span>
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          padding: '2px 8px',
          borderRadius: '4px',
          background: `${solarData.phaseColor}25`,
          color: solarData.phaseColor,
          border: `1px solid ${solarData.phaseColor}66`,
          fontWeight: 700
        }}>
          {solarData.phaseName}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Sky Dome Elevation Arc */}
        <div style={{
          background: '#121312',
          borderRadius: '8px',
          padding: '12px 10px 8px',
          border: '1px solid var(--border2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          <svg width="240" height="120" viewBox="0 0 240 120">
            <defs>
              <linearGradient id="skyArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={solarData.phaseColor} stopOpacity="1" />
                <stop offset="60%" stopColor={solarData.phaseColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={solarData.phaseColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ground Baseline Fill */}
            <rect x="10" y={cy} width="220" height="18" fill="rgba(255,255,255,0.03)" rx="2" />

            {/* Ground Horizon Line */}
            <line x1="12" y1={cy} x2="228" y2={cy} stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,3" />

            {/* Golden Hour Zone Indicator (0° - 6° altitude) */}
            <path
              d={`M ${cx - arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 0 1 ${cx - arcRadius * Math.cos((6 * Math.PI)/180)} ${cy - arcRadius * Math.sin((6 * Math.PI)/180)}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d={`M ${cx + arcRadius * Math.cos((6 * Math.PI)/180)} ${cy - arcRadius * Math.sin((6 * Math.PI)/180)} A ${arcRadius} ${arcRadius} 0 0 1 ${cx + arcRadius} ${cy}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Celestial Dome Arc */}
            <path
              d={`M ${cx - arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 0 1 ${cx + arcRadius} ${cy}`}
              fill="none"
              stroke="url(#skyArcGrad)"
              strokeWidth="2.5"
            />

            {/* Horizon & Zenith Labels */}
            <text x="16" y={cy - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">E 0°</text>
            <text x={cx} y="16" fill="#f8fafc" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ZENITH 90°</text>
            <text x="224" y={cy - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end" fontWeight="bold">W 0°</text>

            {/* Sun Marker with Glow */}
            {solarData.altitude >= -4 ? (
              <>
                <circle cx={sunX} cy={sunY} r="14" fill="url(#sunGlow)" />
                <circle cx={sunX} cy={sunY} r="5" fill="#ffffff" stroke={solarData.phaseColor} strokeWidth="2.5" />
              </>
            ) : (
              <text x={cx} y={cy - 24} fill="#c084fc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                🌙 Below Horizon ({solarData.altitude.toFixed(1)}°)
              </text>
            )}
          </svg>

          {/* Quick Metrics Overlay */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 8px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <span style={{ color: '#94a3b8' }}>
              Altitude: <strong style={{ color: '#fbbf24' }}>{solarData.altitude.toFixed(1)}°</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>
              Azimuth: <strong style={{ color: '#38bdf8' }}>{Math.round(solarData.azimuth)}° {solarData.cardinal}</strong>
            </span>
          </div>
        </div>

        {/* Phase Lighting Guidance Note */}
        <div style={{
          padding: '8px 10px',
          background: 'var(--surface2)',
          borderRadius: '6px',
          border: '1px solid var(--border2)',
          borderLeft: `3px solid ${solarData.phaseColor}`,
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: 'bold', color: 'var(--text)', marginBottom: '2px' }}>
            ☀️ Lighting Conditions & Shadows
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
            {solarData.phaseDesc}
          </div>
        </div>

        {/* Expandable Daily Solar Timetable */}
        {dailySchedule && (
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: '4px',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{showSchedule ? '▲ Hide Daily Sun Schedule' : '▼ View Daily Golden Hour Schedule'}</span>
              <span>{dailySchedule.solarNoon}</span>
            </button>

            {showSchedule && (
              <div style={{
                marginTop: '6px',
                padding: '8px',
                background: 'var(--surface2)',
                borderRadius: '6px',
                border: '1px solid var(--border2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>🌅 Sunrise</span>
                  <span style={{ color: 'var(--text)' }}>{dailySchedule.sunrise}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                  <span>✨ Morning Golden Hour</span>
                  <span>{dailySchedule.morningGoldenHour}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>☀️ Solar Noon</span>
                  <span style={{ color: 'var(--text)' }}>{dailySchedule.solarNoon}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                  <span>✨ Evening Golden Hour</span>
                  <span>{dailySchedule.eveningGoldenHour}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>🌇 Sunset</span>
                  <span style={{ color: 'var(--text)' }}>{dailySchedule.sunset}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                  <span>🌌 Blue Hour</span>
                  <span>{dailySchedule.blueHour}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
