export default function render(canvas, telemetry) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
  const h = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;
  ctx.clearRect(0, 0, w, h);
  if (w === 0 || h === 0) return;

  const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);
  const data = telemetry || {};
  const value = safeNum(data.value, 0);
  const history = Array.isArray(data.history) ? data.history : [];
  const color = data.color || '#38bdf8';

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = safeNum((w / 4) * i);
    const y = safeNum((h / 4) * i);
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Seismograph Line
  if (history.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const step = safeNum(w / (history.length - 1));
    history.forEach((v, i) => {
      const x = safeNum(i * step);
      const y = safeNum(h / 2 - (v * h / 4));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, 'transparent');
    ctx.lineTo(safeNum(w), safeNum(h));
    ctx.lineTo(0, safeNum(h));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Value Circle
  const centerX = safeNum(w / 2);
  const centerY = safeNum(h / 2);
  const radius = safeNum(Math.min(w, h) * 0.15);
  
  const radialGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  radialGrad.addColorStop(0, color + '44');
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value.toFixed(2), centerX, centerY + 5);
}