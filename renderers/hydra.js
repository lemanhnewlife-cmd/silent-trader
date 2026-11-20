window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.HYDRA = function(ctx, w, h, st) {
  const tel = (st.snap && st.snap.visual_telemetry) || {};
  const t = st.t || 0;
  const heads = tel.active_heads || 3;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  ctx.translate(w / 2, h / 2);
  for (let i = 0; i < heads; i++) {
    const angle = (i / heads) * Math.PI * 2 + t * 0.05;
    const dist = 60 + Math.sin(t * 0.1 + i) * 20;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    ctx.strokeStyle = `hsl(${(t + i * 40) % 360}, 70%, 50%)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(x * 0.5, y * 1.5, x, y);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = '#6366f1';
  ctx.font = '14px monospace';
  ctx.fillText(`HYDRA NODES: ${heads}`, 20, 30);
  ctx.fillText(`LATENCY: ${tel.latency_ms || 0}ms`, 20, 50);
  if (st.snap && st.snap.open_trade) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('ACTIVE POSITION DETECTED', 20, 70);
  }
};