import React from 'react';
import useCountUp from '../hooks/useCountUp.js';

export default function GaugeDial({ label, value, max, unit, accent }) {
  const animated = useCountUp(value);
  const pct = max > 0 ? Math.min(animated / max, 1) : 0;
  const angle = -120 + pct * 240; // sweep from -120deg to +120deg

  return (
    <div className="gauge-dial">
      <svg viewBox="0 0 200 140" className="gauge-svg">
        <path
          d="M 30 120 A 90 90 0 1 1 170 120"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 30 120 A 90 90 0 1 1 170 120"
          fill="none"
          stroke={accent}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * 283} 283`}
          className="gauge-arc"
        />
        <line
          x1="100"
          y1="120"
          x2="100"
          y2="45"
          stroke="#f4f4f2"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 100 120)`}
          className="gauge-needle"
        />
        <circle cx="100" cy="120" r="6" fill="#f4f4f2" />
      </svg>
      <div className="gauge-readout">
        <span className="gauge-value">{Math.round(animated)}</span>
        <span className="gauge-unit">{unit}</span>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}