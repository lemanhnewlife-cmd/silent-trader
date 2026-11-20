export default function render(canvas, telemetry) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
  const h = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;
  ctx.clearRect(0, 0, w, h);
  if (w === 0 || h === 0) return;

  const safe = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

  const pull = safe(telemetry?.pull_force, 0);
  const push = safe(telemetry?.push_force, 0);
  const intensity = safe(telemetry?.intensity, 0);
  const centerX = w / 2;
  const centerY = h / 2;
  const baseRadius = Math.min(w, h) * 0.35;

  // Background Gradient
  const bgGrad = ctx.createRadialGradient(
    safe(centerX), safe(centerY), 0,
    safe(centerX), safe(centerY), safe(baseRadius * 1.5)
  );
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Magnet Core
  const coreRadius = safe(baseRadius * (0.8 + intensity * 0.2));
  const coreGrad = ctx.createLinearGradient(0, safe(centerY - coreRadius), 0, safe(centerY + coreRadius));
  coreGrad.addColorStop(0, pull > push ? '#3b82f6' : '#ef4444');
  coreGrad.addColorStop(1, '#1e293b');

  ctx.beginPath();
  ctx.arc(safe(centerX), safe(centerY), safe(coreRadius), 0, Math.PI * 2);
  ctx.strokeStyle = pull > push ? '#60a5fa' : '#f87171';
  ctx.lineWidth = safe(2 + intensity * 5);
  ctx.stroke();
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // Force Waves
  const waveCount = 3;
  for (let i = 0; i < waveCount; i++) {
    const waveRadius = safe(coreRadius + (i + 1) * 20 * (1 + intensity));
    const alpha = safe(0.5 / (i + 1));
    ctx.beginPath();
    ctx.arc(safe(centerX), safe(centerY), safe(waveRadius), 0, Math.PI * 2);
    ctx.strokeStyle = pull > push ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
    ctx.setLineDash([5, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Telemetry Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  const displayPull = pull.toFixed(2);
  const displayPush = push.toFixed(2);
  ctx.fillText(`PULL: ${displayPull} | PUSH: ${displayPush}`, safe(centerX), safe(h - 20));
  
  ctx.font = '12px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`INTENSITY: ${(intensity * 100).toFixed(1)}%`, safe(centerX), safe(h - 40));
}