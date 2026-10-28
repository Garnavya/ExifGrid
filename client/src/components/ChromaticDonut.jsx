import { useEffect, useRef, useState } from 'react';
import { analyzeImageChromaticComposition, drawChromaticDonut } from '../utils/chromaticAnalysis.js';

export default function ChromaticDonut({ photoSrc, photoName }) {
  const canvasRef = useRef(null);
  const [chromaticData, setChromaticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedHex, setCopiedHex] = useState(null);

  useEffect(() => {
    if (!photoSrc) return;
    let cancelled = false;
    setLoading(true);

    analyzeImageChromaticComposition(photoSrc).then((data) => {
      if (cancelled) return;
      setChromaticData(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [photoSrc]);

  useEffect(() => {
    if (!canvasRef.current || !chromaticData) return;
    drawChromaticDonut(canvasRef.current, chromaticData, 200);
  }, [chromaticData]);

  const copyHex = (hex) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  if (!photoSrc) return null;

  return (
    <div className="meta-section chromatic-section" style={{ marginTop: '4px' }}>
      <div className="meta-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Color Harmony & RGB Spectrum</span>
        {chromaticData?.harmony && (
          <span style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontWeight: 700
          }}>
            {chromaticData.harmony.type.replace('_', ' ')}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          Analyzing Chromatic Spectrum...
        </div>
      ) : chromaticData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Radial Donut and Harmony Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Harmony Lore Description */}
          <div style={{
            padding: '8px 10px',
            background: 'var(--surface2)',
            borderRadius: '6px',
            border: '1px solid var(--border2)',
            fontSize: '11px',
            lineHeight: '1.4'
          }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🎨</span> {chromaticData.harmony.name}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
              {chromaticData.harmony.description}
            </div>
          </div>

          {/* RGB Channel Balance Split Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span style={{ color: '#f87171' }}>R: {chromaticData.rgbBalance.r}%</span>
              <span style={{ color: '#4ade80' }}>G: {chromaticData.rgbBalance.g}%</span>
              <span style={{ color: '#60a5fa' }}>B: {chromaticData.rgbBalance.b}%</span>
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${chromaticData.rgbBalance.r}%`, background: '#ef4444' }} title={`Red: ${chromaticData.rgbBalance.r}%`} />
              <div style={{ width: `${chromaticData.rgbBalance.g}%`, background: '#22c55e' }} title={`Green: ${chromaticData.rgbBalance.g}%`} />
              <div style={{ width: `${chromaticData.rgbBalance.b}%`, background: '#3b82f6' }} title={`Blue: ${chromaticData.rgbBalance.b}%`} />
            </div>
          </div>

          {/* Warm vs Cool Balance Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span style={{ color: '#fb923c' }}>☀️ Warm {chromaticData.warmCool.warm}%</span>
              <span style={{ color: '#38bdf8' }}>❄️ Cool {chromaticData.warmCool.cool}%</span>
            </div>
            <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${chromaticData.warmCool.warm}%`, background: 'linear-gradient(90deg, #f97316, #eab308)' }} />
              <div style={{ width: `${chromaticData.warmCool.cool}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
            </div>
          </div>

          {/* Dominant Palette Swatches */}
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Extracted Color Palette (Click to Copy)
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {chromaticData.dominantPalette.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyHex(item.hex)}
                  title={`Click to copy ${item.hex} (${item.percent}% scene)`}
                  style={{
                    flex: '1 1 28%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 6px',
                    background: 'var(--surface2)',
                    border: copiedHex === item.hex ? '1px solid var(--accent)' : '1px solid var(--border2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: item.hex,
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: copiedHex === item.hex ? 'var(--accent)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {copiedHex === item.hex ? 'COPIED!' : item.hex}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
