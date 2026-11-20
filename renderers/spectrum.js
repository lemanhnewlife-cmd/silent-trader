export default function render(canvas, telemetry) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
  const h = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;

  if (w === 0 || h === 0) return;

  ctx.clearRect(0, 0, w, h);

  const data = telemetry || {};
  const points = Array.isArray(data.spectrum) ? data.spectrum : [];
  const signalStrength = Number.isFinite(data.signal_strength) ? data.signal_strength : 0;
  const frequency = Number.isFinite(data.frequency) ? data.frequency : 0;

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  if (points.length === 0) {
    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WAITING FOR SPECTRUM DATA...', w / 2, h / 2);
    return;
  }

  // Draw Spectrum Waves
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  const step = w / (points.length - 1 || 1);
  points.forEach((val, i) => {
    const x = Number.isFinite(i * step) ? i * step : 0;
    const normalizedVal = Number.isFinite(val) ? val : 0;
    const y = Number.isFinite(h - (normalizedVal * h)) ? h - (normalizedVal * h) : h;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill Area
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
  fillGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
  fillGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Draw Signal Indicator
  const centerX = w * 0.85;
  const centerY = h * 0.2;
  const radius = Number.isFinite(h * 0.1) ? h * 0.1 : 0;

  if (radius > 0) {
    const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    const glowColor = signalStrength > 0.7 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(249, 115, 22, 0.5)';
    radGrad.addColorStop(0, glowColor);
    radGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Text Info
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'right';
  const displayFreq = frequency.toFixed(2);
  const displayStrength = (signalStrength * 100).toFixed(1);
  ctx.fillText(`${displayFreq} Hz`, w - 20, h - 40);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`STRENGTH: ${displayStrength}%`, w - 20, h - 20);
}