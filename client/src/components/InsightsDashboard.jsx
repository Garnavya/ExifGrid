import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import GaugeDial from './GaugeDial.jsx';
import {
  M_STRIPE,
  buildDataset,
  telemetryChartOptions,
} from '../utils/telemetryChartConfig.js';
import '../css/InsightsDashboard.css';

export default function InsightsDashboard({ photos = [], onClose }) {
  const iso = useMemo(
    () =>
      buildDataset(photos, (p) => p.exif?.ISO || p.exif?.ISOSpeedRatings),
    [photos]
  );

  const focal = useMemo(
    () =>
      buildDataset(
        photos,
        (p) => p.exif?.FocalLength,
        (n) => `${Math.round(n)}mm`
      ),
    [photos]
  );

  const isoChartData = {
    labels: iso.labels,
    datasets: [
      {
        label: 'Shots',
        data: iso.data,
        backgroundColor: M_STRIPE[0],
        borderRadius: 3,
        maxBarThickness: 28,
      },
    ],
  };

  const focalChartData = {
    labels: focal.labels,
    datasets: [
      {
        label: 'Shots',
        data: focal.data,
        backgroundColor: M_STRIPE[2],
        borderRadius: 3,
        maxBarThickness: 28,
      },
    ],
  };

  const hasData = photos.length > 0;

  // Pass the M_STRIPE colors to the CSS via custom properties on the root panel
  const panelStyle = {
    '--stripe-c1': M_STRIPE[0],
    '--stripe-c2': M_STRIPE[1],
    '--stripe-c3': M_STRIPE[2],
  };

  return (
    <div className="insights-overlay" onClick={onClose}>
      <div
        className="insights-panel"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="insights-stripe" />

        <div className="insights-header">
          <div>
            <div className="insights-eyebrow">TELEMETRY</div>
            <h3 className="insights-title">Shooting Analytics</h3>
          </div>
          <button className="insights-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {!hasData ? (
          <div className="insights-empty">
            No photos loaded yet. Drop in a batch to see your shooting data.
          </div>
        ) : (
          <>
            <div className="insights-gauges">
              <GaugeDial
                label="AVG ISO"
                value={iso.average}
                max={Math.max(iso.max, 3200)}
                unit="ISO"
                accent={M_STRIPE[0]}
              />
              <GaugeDial
                label="AVG FOCAL LENGTH"
                value={focal.average}
                max={Math.max(focal.max, 200)}
                unit="mm"
                accent={M_STRIPE[2]}
              />
              <div className="insights-count">
                <span className="insights-count-value">{photos.length}</span>
                <span className="insights-count-label">FRAMES LOGGED</span>
              </div>
            </div>

            <div className="insights-charts">
              <div className="insights-chart-block">
                <div className="insights-chart-label">
                  ISO DISTRIBUTION
                </div>
                <div className="insights-chart-canvas">
                  <Bar data={isoChartData} options={telemetryChartOptions(M_STRIPE[0])} />
                </div>
              </div>
              <div className="insights-chart-block">
                <div className="insights-chart-label">
                  FOCAL LENGTH DISTRIBUTION
                </div>
                <div className="insights-chart-canvas">
                  <Bar data={focalChartData} options={telemetryChartOptions(M_STRIPE[2])} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}