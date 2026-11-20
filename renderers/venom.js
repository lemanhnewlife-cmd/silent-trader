export default function render(ctx, telemetry) {
  const w = Number.isFinite(ctx.canvas.width) && ctx.canvas.width > 0 ? ctx.canvas.width : 0;
  const h = Number.isFinite(ctx.canvas.height) && ctx.canvas.height > 0 ? ctx.canvas.height : 0;
  if (w === 0 || h === 0) return;

  const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

  ctx.clearRect(0, 0, w, h);

  const data = telemetry || {};
  const price = safeNum(data.price, 0);
  const spread = safeNum(data.spread, 0);
  const volume = safeNum(data.volume, 0);
  const pressure = safeNum(data.pressure, 0.5);
  const trend = safeNum(data.trend, 0);

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = safeNum(Math.min(w, h) * 0.35, 10);

  // Background Glow
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
  grad.addColorStop(0, 'rgba(30, 30, 50, 1)');
  grad.addColorStop(1, 'rgba(10, 10, 20, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Pressure Ring
  ctx.beginPath();
  ctx.lineWidth = safeNum(radius * 0.1, 2);
  ctx.strokeStyle = pressure > 0.5 ? '#00ff88' : '#ff4444';
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + safeNum(pressure * Math.PI * 2, 0);
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();

  // Center Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${safeNum(radius * 0.3, 12)}px monospace`;
  ctx.fillText(price.toFixed(2), centerX, centerY - radius * 0.2);

  ctx.font = `${safeNum(radius * 0.15, 10)}px monospace`;
  ctx.fillStyle = '#8888ff';
  ctx.fillText(`VOL: ${volume.toFixed(0)}`, centerX, centerY + radius * 0.2);
  
  ctx.fillStyle = trend >= 0 ? '#00ff00' : '#ff3300';
  ctx.fillText(`TREND: ${(trend * 100).toFixed(1)}%`, centerX, centerY + radius * 0.4);

  // Decorative Lines
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.moveTo(0, centerY);
  ctx.lineTo(w, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, h);
  ctx.stroke();
}