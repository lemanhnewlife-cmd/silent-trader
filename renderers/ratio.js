export function renderRatio(canvas, telemetry) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width || 0;
  const h = canvas.height || 0;
  ctx.clearRect(0, 0, w, h);
  if (w <= 0 || h <= 0) return;

  const safe = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

  const ratio = safe(telemetry?.ratio, 0);
  const label = telemetry?.label || 'Ratio';
  const color = telemetry?.color || '#38bdf8';

  const centerX = safe(w / 2);
  const centerY = safe(h / 2);
  const radius = safe(Math.min(w, h) * 0.35);

  // Background Circle
  ctx.beginPath();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = safe(radius * 0.15);
  ctx.arc(centerX, centerY, radius, 0, safe(Math.PI * 2));
  ctx.stroke();

  // Progress Arc
  const startAngle = safe(-Math.PI / 2);
  const endAngle = safe(startAngle + (Math.PI * 2 * (Math.min(Math.max(ratio, 0), 100) / 100)));
  
  ctx.beginPath();
  const grad = ctx.createLinearGradient(safe(centerX - radius), centerY, safe(centerX + radius), centerY);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#ffffff');
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();

  // Text Rendering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const fontSizeValue = safe(radius * 0.5);
  ctx.font = `bold ${fontSizeValue}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${ratio.toFixed(1)}%`, centerX, safe(centerY - radius * 0.05));

  const fontSizeLabel = safe(radius * 0.18);
  ctx.font = `${fontSizeLabel}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(label.toUpperCase(), centerX, safe(centerY + radius * 0.4));

  // Bottom Bar Indicator
  const barW = safe(w * 0.6);
  const barH = safe(4);
  const barX = safe((w - barW) / 2);
  const barY = safe(h - 10);
  
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);
  
  ctx.fillStyle = color;
  const fillW = safe(barW * (Math.min(Math.max(ratio, 0), 100) / 100));
  ctx.fillRect(barX, barY, fillW, barH);
}