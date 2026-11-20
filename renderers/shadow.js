// Plugin renderer Shadow
window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SHADOW = function(ctx, w, h, st) {
  'use strict';
  var tel = (st && st.snap && st.snap.visual_telemetry) || {};
  var ot = st && st.snap && st.snap.open_trade;
  var t = st && st.t || 0;
  ctx.fillStyle = '#0d050c';
  ctx.fillRect(0, 0, w, h);
  var topH = h * 0.72;
  var botH = h * 0.28;
  var botY = topH;
  var bins = tel.hist_bins || [];
  var gauss = tel.gauss_bins || [];
  var maxHist = 1;
  for (var i = 0; i < bins.length; i++) {
    if (bins[i] > maxHist) maxHist = bins[i];
  }
  var grad = ctx.createLinearGradient(0, topH, 0, 0);
  grad.addColorStop(0, '#ec4899');
  grad.addColorStop(1, '#facc15');
  ctx.fillStyle = grad;
  var barW = w / Math.max(bins.length, 1);
  for (var i = 0; i < bins.length; i++) {
    var bh = (bins[i] / maxHist) * topH * 0.85;
    ctx.fillRect(i * barW, topH - bh, barW * 0.8, bh);
  }
  if (gauss.length > 1) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    var maxG = 1;
    for (var i = 0; i < gauss.length; i++) {
      if (gauss[i] > maxG) maxG = gauss[i];
    }
    for (var i = 0; i < gauss.length; i++) {
      var x = i * barW;
      var y = topH - (gauss[i] / maxG) * topH * 0.85;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '12px monospace';
  ctx.fillText('SKEWNESS ' + (tel.skewness != null ? tel.skewness.toFixed(2) : '-'), w - 160, 24);
  ctx.fillText('KURTOSIS ' + (tel.kurtosis != null ? tel.kurtosis.toFixed(2) : '-'), w - 160, 44);
  var lower = tel.lower_wick_energy || 0;
  var upper = tel.upper_wick_energy || 0;
  var barH = botH * 0.45;
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(20, botY + 20, w * Math.min(lower / 100, 1), barH);
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(20, botY + 20 + barH + 12, w * Math.min(upper / 100, 1), barH);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '12px sans-serif';
  ctx.fillText('Lower Wick Energy ' + lower + '%', 20, botY + 15);
  ctx.fillText('Upper Wick Energy ' + upper + '%', 20, botY + 15 + barH + 12);
  if (ot) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('OPEN TRADE: ' + ot, 10, 22);
  }
};