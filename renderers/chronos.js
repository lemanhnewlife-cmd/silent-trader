window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHRONOS = function(ctx, w, h, st) {
  const doc = (st.snap && st.snap.visual_telemetry) || {};
  const ot = st.snap && st.snap.open_trade;
  const t = st.t || 0;
  const L = w * 0.44;
  const R = w * 0.56;
  ctx.fillStyle = '#08090f';
  ctx.fillRect(0, 0, w, h);
  // left orbital clock
  ctx.save();
  ctx.translate(L * 0.5, h * 0.5);
  ctx.rotate(-Math.PI / 2);
  const Rc = Math.min(L * 0.8, h * 0.6);
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * Rc, Math.sin(a) * Rc);
    ctx.strokeStyle = i % 4 === 0 ? '#1f2937' : '#374151';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // UTC hand
  ctx.rotate(doc.utc_hour_float * Math.PI / 12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -Rc * 0.6);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.stroke();
  // countdown
  const ns = doc.next_window_sec || 0;
  const mn = Math.floor(ns / 60);
  const ss = ns % 60;
  ctx.fillStyle = '#facc15';
  ctx.fillText('' + mn + ':' + (ss < 10 ? '0' : '') + ss, 0, Rc * 0.8);
  // window markers
  const windows = doc.windows || [];
  for (let i = 0; i < 7 && i < windows.length; i++) {
    const w = windows[i];
    const x = L * 0.1 + i * L * 0.12;
    ctx.fillStyle = w.active ? '#ef4444' : (i % 2 ? '#facc15' : '#06b6d4');
    ctx.fillRect(x, h * 0.1, L * 0.04, h * 0.8);
  }
  ctx.restore();
  // right session chart
  ctx.save();
  ctx.translate(R, h * 0.1);
  ctx.scale(0.75, 0.75);
  // session price line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(100, -50);
  ctx.stroke();
  // mean line
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(100, 0);
  ctx.stroke();
  // upper/lower bands
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -30); ctx.lineTo(100, -30);
  ctx.moveTo(0, 30); ctx.lineTo(100, 30);
  ctx.stroke();
  // z-score badge
  ctx.fillStyle = '#ec4899';
  ctx.fillText('Z: ' + (doc.deviation_z || 0), 0, -80);
  // open trade badge
  if (ot) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('OT: ' + ot, 0, -60);
  }
  ctx.restore();
};
