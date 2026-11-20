window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.MAGNET = function(ctx, w, h, st) {
  const tel = (st.snap && st.snap.visual_telemetry) || {};
  const ot = st.snap && st.snap.open_trade;
  const t = st.t || 0;
  const snap = st.snap || {};
  const price_orbit = snap.price_orbit || [];
  const vwap_core = snap.vwap_core || 0;
  const sigma_dist = snap.sigma_dist || 0;

  ctx.fillStyle = '#040814';
  ctx.fillRect(0, 0, w, h);

  const leftW = w * 0.44;
  const cx = leftW / 2;
  const cy = h / 2;
  const r = Math.min(leftW, h) * 0.3;

  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(leftW, cy);
  ctx.stroke();

  [[1, '#3b82f6'], [2, '#eab308'], [2.8, '#f472b6']].forEach(ring => {
    ctx.strokeStyle = ring[1];
    ctx.beginPath();
    ctx.arc(cx, cy, r * ring[0] * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  });

  const angle = t * 0.4;
  const px = cx + Math.cos(angle) * sigma_dist * 8;
  const py = cy + Math.sin(angle) * sigma_dist * 8;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('Do Cang ' + tel.tension_pct + '%', cx + 8, cy - 8);

  ctx.fillStyle = '#fff';
  ctx.fillText('vwap_core ' + vwap_core, leftW + 10, 24);
  ctx.fillText('sigma_dist ' + sigma_dist, leftW + 10, 44);
  if (ot) {
    ctx.fillText('open_trade ' + JSON.stringify(ot), leftW + 10, 64);
  }

  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  price_orbit.forEach((p, i) => {
    const x = leftW + 20 + (i / Math.max(price_orbit.length - 1, 1)) * (w - leftW - 40);
    const y = cy + (p - vwap_core) * 3;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  ['p1', 'm1', 'p2', 'm2'].forEach(b => {
    const val = snap[b];
    if (val != null) {
      ctx.strokeStyle = b[0] === 'p' ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(leftW + 20, cy + (val - vwap_core) * 3);
      ctx.lineTo(w - 20, cy + (val - vwap_core) * 3);
      ctx.stroke();
    }
  });
};