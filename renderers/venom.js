window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.VENOM = function(ctx, w, h, st) {
  const tel = (st.snap && st.snap.visual_telemetry) || {};
  const ot = st.snap && st.snap.open_trade;
  const t = st.t || 0;
  const snap = st.snap || {};
  const venom_flow = snap.venom_flow || [];
  const toxicity = tel.toxicity || 0;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  const barW = w / Math.max(venom_flow.length, 1);
  venom_flow.forEach((v, i) => {
    const hue = 120 + v * 60;
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    const vh = Math.abs(v) * h * 0.4;
    ctx.fillRect(i * barW, h / 2 - (v > 0 ? vh : 0), barW - 1, vh);
  });

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  const pulse = Math.sin(t * 0.1) * 10;
  ctx.fillStyle = toxicity > 70 ? '#ef4444' : '#22c55e';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`TOXICITY: ${toxicity.toFixed(1)}%`, 20, 40 + pulse);

  if (ot) {
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fillRect(w - 200, 10, 190, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Side: ${ot.side}`, w - 190, 30);
    ctx.fillText(`P&L: $${(ot.floating_usd || 0).toFixed(2)}`, w - 190, 50);
  }
};