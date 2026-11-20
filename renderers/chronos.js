export function render(canvas, ctx, data) {
  if (!canvas || !ctx) return;
  const w = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
  const h = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;
  if (w === 0 || h === 0) return;

  ctx.clearRect(0, 0, w, h);
  if (!data || !data.telemetry) return;

  const tel = data.telemetry;
  const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const x = safeNum((w / 10) * i);
    const y = safeNum((h / 10) * i);
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Main Telemetry Display
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = safeNum(Math.min(w, h) * 0.35);

  // Outer Ring
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Entropy Pulse
  const entropy = safeNum(tel.entropy, 0);
  const pulseSize = safeNum(radius * (0.5 + entropy * 0.5));
  const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
  radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();

  // Text Info
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Price
  ctx.font = 'bold 32px monospace';
  ctx.fillStyle = '#f8fafc';
  const price = safeNum(tel.last_price, 0).toFixed(2);
  ctx.fillText(price, centerX, centerY - 20);

  // Signal / State
  ctx.font = '14px monospace';
  ctx.fillStyle = '#94a3b8';
  const state = (tel.state || 'IDLE').toUpperCase();
  ctx.fillText(`STATE: ${state}`, centerX, centerY + 20);

  // Metrics Grid (Bottom)
  const metrics = [
    { label: 'VOL', val: safeNum(tel.volatility, 0).toFixed(4) },
    { label: 'ENT', val: entropy.toFixed(4) },
    { label: 'BIAS', val: safeNum(tel.bias, 0).toFixed(2) }
  ];

  const part = w / (metrics.length + 1);
  ctx.font = '12px monospace';
  metrics.forEach((m, i) => {
    const mx = safeNum(part * (i + 1));
    const my = safeNum(h - 40);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(m.label, mx, my);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(m.val, mx, my + 15);
  });

  // Trend Line (Simple representation)
  if (Array.isArray(data.history) && data.history.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    const step = w / (data.history.length - 1);
    data.history.forEach((p, i) => {
      const px = safeNum(i * step);
      const py = safeNum(h - (safeNum(p) * h)); // Normalized 0-1
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
}