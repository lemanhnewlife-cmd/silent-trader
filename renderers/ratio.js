window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.RATIO = function(ctx, w, h, st) {
  const tel = (st.snap && st.snap.visual_telemetry) || {};
  const snap = st.snap || {};
  const buy_vol = tel.buy_volume || 1;
  const sell_vol = tel.sell_volume || 1;
  const total = buy_vol + sell_vol;
  const ratio = (buy_vol / total) * 100;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  const midX = w / 2;
  const barH = 40;
  const barY = h / 2 - 20;

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(50, barY, w - 100, barH);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(50, barY, (w - 100) * (ratio / 100), barH);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, barY, w - 100, barH);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`BUY ${ratio.toFixed(1)}%`, midX - 50, barY - 10);
  ctx.fillText(`SELL ${(100 - ratio).toFixed(1)}%`, midX + 50, barY - 10);

  const imbalance = snap.imbalance_score || 0;
  ctx.font = '32px monospace';
  ctx.fillStyle = imbalance > 0 ? '#22c55e' : '#ef4444';
  ctx.fillText(`IMBALANCE: ${imbalance.toFixed(2)}`, midX, barY + 80);
};