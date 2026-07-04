import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

// Register Chart.js components exactly once upon import
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export const M_STRIPE = ['#E1332C', '#7B4FE3', '#1E5FBF']; // red / violet / blue

export function telemetryChartOptions(accent) {
  return {
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414',
        titleColor: '#f4f4f2',
        bodyColor: accent,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: 'rgba(255,255,255,0.1)' },
        ticks: {
          color: 'rgba(244,244,242,0.5)',
          font: { family: "'JetBrains Mono', monospace", size: 10 },
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        border: { display: false },
        ticks: {
          color: 'rgba(244,244,242,0.35)',
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          precision: 0,
        },
      },
    },
  };
}

export function buildDataset(photos, extract, roundKey) {
  const counts = {};
  let sum = 0;
  let n = 0;
  photos.forEach((photo) => {
    const raw = extract(photo);
    if (raw === undefined || raw === null || raw === '') return;
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    sum += num;
    n += 1;
    const key = roundKey ? roundKey(num) : String(num);
    counts[key] = (counts[key] || 0) + 1;
  });
  const labels = Object.keys(counts).sort(
    (a, b) => parseFloat(a) - parseFloat(b)
  );
  return {
    labels,
    data: labels.map((l) => counts[l]),
    average: n > 0 ? sum / n : 0,
    max: n > 0 ? Math.max(...photos.map((p) => Number(extract(p)) || 0)) : 0,
  };
}