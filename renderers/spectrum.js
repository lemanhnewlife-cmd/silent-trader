window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SPECTRUM = function(ctx, w, h, st) {
  const tel = (st.snap && st.snap.visual_telemetry) || {};
  const ot = st.snap && st.snap.open_trade;
  const t = st.t || 0;
  ctx.fillStyle = '#070511';
  ctx.fillRect(0, 0, w, h);
  const topH = h * 0.44;
  const botY = topH;
  const botH = h - topH;
  const bars = tel.spectrum_bars || [];
  const n = bars.length || 32;
  const bw = w / n * 0.8;
  const gap = w / n * 0.2;
  for (let i = 0; i < n; i++) {
    const v = Math.min(1, Math.max(0, bars[i] || 0));
    const bh = v * topH * 0.9;
    const x = i * (bw + gap) + gap * 0.5;
    const y = topH - bh;
    const grad = ctx.createLinearGradient(x, topH, x, y);
    grad.addColorStop(0, '#8b5cf6');
    grad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.fillRect(x, y, bw, bh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#22d3ee';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P=${v.toFixed(2)}`, x + bw/2, topH + 12);
  }
  const cx = w - 60;
  const cy = 60;
  const r = 40;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let d = 0; d < 360; d += 45) {
    const a = d * Math.PI / 180 - Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  const phase = (tel.composite_phase_deg || 0) * Math.PI / 180 - Math.PI/2;
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(phase) * (r - 10), cy + Math.sin(phase) * (r - 10));
  ctx.stroke();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HILBERT', cx, cy + r + 18);
  ctx.fillText(`${(tel.composite_phase_deg||0).toFixed(0)}°`, cx, cy + r + 32);
  const midY = botY + botH / 2;
  const scaleY = botH * 0.4;
  const pd = tel.price_detrended || [];
  const dw = tel.dominant_waves || [];
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  for (let i = 0; i < pd.length; i++) {
    const x = (i / Math.max(1, pd.length - 1)) * w;
    const y = midY - pd[i] * scaleY;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const colors = ['#22d3ee', '#8b5cf6', '#fde047'];
  for (let wi = 0; wi < Math.min(3, dw.length); wi++) {
    const wave = dw[wi];
    if (!wave) continue;
    const amp = wave.amplitude || 0;
    const freq = wave.frequency || 0.01;
    const ph = wave.phase || 0;
    ctx.strokeStyle = colors[wi];
    ctx.lineWidth = 2;
    ctx.shadowColor = colors[wi];
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < w; i += 2) {
      const x = i;
      const y = midY - Math.sin(freq * i + ph + t * 0.001) * amp * scaleY;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (ot) {
    const ox = (ot.index / Math.max(1, (pd.length||1) - 1)) * w;
    const oy = midY - (ot.price_detrended || 0) * scaleY;
    ctx.fillStyle = ot.side === 'buy' ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(ox, oy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ot.side.toUpperCase(), ox, oy - 10);
  }
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(w, midY);
  ctx.stroke();
  ctx.setLineDash([]);
};