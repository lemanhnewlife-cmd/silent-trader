export function render(canvas, telemetry) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
  const h = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;
  if (w === 0 || h === 0) return;

  ctx.clearRect(0, 0, w, h);

  const data = telemetry || {};
  const shadowValue = Number.isFinite(data.shadow_value) ? data.shadow_value : 0;
  const shadowPower = Number.isFinite(data.shadow_power) ? data.shadow_power : 0;
  const shadowTrend = Number.isFinite(data.shadow_trend) ? data.shadow_trend : 0;

  const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, safeNum(h));
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, safeNum(w), safeNum(h));

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const x = safeNum((w / 10) * i);
    const y = safeNum((h / 10) * i);
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, safeNum(h));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(safeNum(w), y);
    ctx.stroke();
  }

  // Shadow Core Visualization
  const centerX = safeNum(w / 2);
  const centerY = safeNum(h / 2);
  const baseRadius = safeNum(Math.min(w, h) * 0.3);
  const pulseRadius = safeNum(baseRadius + (shadowPower * 20));

  const radialGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius > 0 ? pulseRadius : 1);
  const color = shadowTrend >= 0 ? 'rgba(56, 189, 248,' : 'rgba(244, 63, 94,';
  radialGrad.addColorStop(0, color + ' 0.4)');
  radialGrad.addColorStop(0.5, color + ' 0.1)');
  radialGrad.addColorStop(1, 'transparent');

  ctx.fillStyle = radialGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius > 0 ? pulseRadius : 0, 0, Math.PI * 2);
  ctx.fill();

  // Shadow Line
  ctx.strokeStyle = shadowTrend >= 0 ? '#38bdf8' : '#f43f5e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(safeNum(w * 0.2), centerY);
  ctx.lineTo(safeNum(w * 0.8), safeNum(centerY - (shadowTrend * 50)));
  ctx.stroke();

  // Text Info
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`SHADOW: ${shadowValue.toFixed(2)}`, centerX, safeNum(centerY - baseRadius - 20));
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
  ctx.fillText(`POWER: ${shadowPower.toFixed(2)} | TREND: ${shadowTrend.toFixed(2)}`, centerX, safeNum(centerY + baseRadius + 30));
}