export async function extractDominantColor(src) {
  try {
    // Fetch the local object URL
    const response = await fetch(src);
    const blob = await response.blob();

    // Decode and resize on a background thread (prevents UI freezing)
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: 1,
      resizeHeight: 1,
      resizeQuality: 'low'
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(bitmap, 0, 0);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    
    return { r, g, b };
  } catch {
    return null; // Fallback if extraction fails
  }
}

export function glowStyle({ r, g, b }, card = true) {
  if (!r && r !== 0) return {};
  if (card) {
    return {
      '--card-glow': `rgba(${r}, ${g}, ${b}, 0.35)`,
      '--card-glow-shadow': `rgba(${r}, ${g}, ${b}, 0.15)`,
    };
  }
  return {
    background: `radial-gradient(circle at center, rgba(${r},${g},${b},0.15) 0%, transparent 70%)`,
    borderLeftColor: `rgba(${r},${g},${b},0.4)`,
  };
}