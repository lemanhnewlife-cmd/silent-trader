window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SHADOW = function(ctx, w, h, st) {
  if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
  const snap = (st && st.snap) || {};
  const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
  const ot = snap.open_trade || null;
  const t = Number.isFinite(st && st.t) ? st.t : 0;

  const num = (v, fb = 0) => (typeof v === 'number' && Number.isFinite(v)) ? v : (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : fb);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, num(v, lo)));
  const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1, 1), num(y1, 1));

  function roundRect(x, y, rw, rh, rad) {
    const r = Math.min(num(rad, 6), rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + rw - r, y);
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
    ctx.lineTo(x + rw, y + rh - r);
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
    ctx.lineTo(x + r, y + rh);
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawOpenTradeBadge(x, y, bw) {
    if (!ot || typeof ot !== 'object') return;
    const isBuy = String(ot.side || '').toUpperCase() === 'BUY';
    const pnl = num(ot.floating_usd, 0);
    const col = isBuy ? '#10b981' : '#ef4444';
    const pnlStr = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
    ctx.save();
    roundRect(x, y, bw, 38, 6);
    ctx.fillStyle = isBuy ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(ot.side || 'OPEN').toUpperCase()} ${num(ot.lot, 0).toFixed(2)} @ ${num(ot.open_price, 0).toFixed(2)}`, x + 8, y + 15);
    ctx.fillStyle = pnl >= 0 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PnL ${pnlStr}`, x + 8, y + 31);
    ctx.restore();
  }

  // Background
  const bg = safeLinGrad(0, 0, 0, h);
  bg.addColorStop(0, '#030303');
  bg.addColorStop(1, '#0b0b0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const skew = num(tel.skewness, 0);
  const kurt = num(tel.kurtosis, 0);
  const upWick = clamp(tel.upper_wick_energy, 0, 100);
  const loWick = clamp(tel.lower_wick_energy, 0, 100);
  const histBins = Array.isArray(tel.hist_bins) ? tel.hist_bins.map(v => Math.max(0, num(v, 0))) : [];
  const gaussBins = Array.isArray(tel.gauss_bins) ? tel.gauss_bins.map(v => Math.max(0, num(v, 0))) : [];

  const pad = 14;
  const leftW = w * 0.68 - pad * 1.3;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  // Left Panel: Fat-Tail Distribution vs Gaussian Curve
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(20, 20, 26, 0.75)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('RETURN DISTRIBUTION vs GAUSSIAN BELL (FAT-TAIL DETECTOR)', pad + 14, pad + 20);

  const cX = pad + 16;
  const cY = pad + 34;
  const cW = leftW - 32;
  const cH = h - pad * 2 - 58;

  const nBins = Math.max(histBins.length, gaussBins.length);
  if (nBins >= 2) {
    const maxVal = Math.max(0.05, ...histBins, ...gaussBins) * 1.1;
    const slotW = cW / nBins;
    const bw = Math.max(8, slotW * 0.72);

    // Center mean dashed axis
    const midX = cX + cW / 2;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(midX, cY); ctx.lineTo(midX, cY + cH); ctx.stroke();
    ctx.setLineDash([]);

    // Histogram bars
    for (let i = 0; i < nBins; i++) {
      const hv = num(histBins[i], 0);
      const gv = num(gaussBins[i], 0);
      const isTail = i < Math.floor(nBins * 0.25) || i >= Math.ceil(nBins * 0.75);
      const fatTail = isTail && hv > gv * 1.15;
      const bh = clamp(hv / maxVal, 0, 1) * cH;
      const bx = cX + i * slotW + (slotW - bw) / 2;
      const by = cY + cH - bh;

      const barGrad = safeLinGrad(bx, cY + cH, bx, by);
      if (fatTail) {
        barGrad.addColorStop(0, 'rgba(248, 113, 113, 0.35)');
        barGrad.addColorStop(1, '#f87171');
      } else {
        barGrad.addColorStop(0, 'rgba(113, 113, 122, 0.25)');
        barGrad.addColorStop(1, '#a1a1aa');
      }
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = fatTail ? '#fca5a5' : '#71717a';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`B${i + 1}`, bx + bw / 2, cY + cH + 14);
    }

    // Gaussian bell overlay (#10b981)
    if (gaussBins.length >= 2) {
      ctx.beginPath();
      for (let i = 0; i < gaussBins.length; i++) {
        const gx = cX + i * slotW + slotW / 2;
        const gy = cY + cH - clamp(gaussBins[i] / maxVal, 0, 1) * cH;
        if (i === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      for (let i = 0; i < gaussBins.length; i++) {
        const gx = cX + i * slotW + slotW / 2;
        const gy = cY + cH - clamp(gaussBins[i] / maxVal, 0, 1) * cH;
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = '#71717a';
    ctx.font = '12px monospace';
    ctx.fillText('Dang thu thap mau phan phoi...', cX, cY + cH / 2);
  }
  ctx.restore();

  // Right Panel: Wick Imbalance + Skew / Kurtosis + Open Trade
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(20, 20, 26, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('WICK IMBALANCE & MOMENTS', rightX + 12, pad + 20);

  // Dual horizontal energy bars
  const bX = rightX + 12;
  const bW = rightW - 24;
  const drawEnergyBar = (y, title, pct, col) => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, bX, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${pct.toFixed(1)}%`, bX + bW, y);
    ctx.fillStyle = 'rgba(63, 63, 70, 0.6)';
    ctx.fillRect(bX, y + 6, bW, 10);
    ctx.fillStyle = col;
    ctx.fillRect(bX, y + 6, bW * (pct / 100), 10);
  };

  drawEnergyBar(pad + 46, 'UPPER WICK ENERGY (SELL PRESSURE)', upWick, '#f87171');
  drawEnergyBar(pad + 88, 'LOWER WICK ENERGY (BUY SUPPORT)', loWick, '#10b981');

  // Skewness & Kurtosis KPI boxes
  const kpis = [
    ['SKEWNESS', `${skew >= 0 ? '+' : ''}${skew.toFixed(2)}`, Math.abs(skew) > 0.5 ? '#facc15' : '#e4e4e7'],
    ['KURTOSIS (TAIL)', `${kurt >= 0 ? '+' : ''}${kurt.toFixed(2)}`, kurt > 1.0 ? '#f87171' : '#e4e4e7'],
    ['BIAS SIGNAL', loWick > upWick + 5 ? 'BULL TAIL' : upWick > loWick + 5 ? 'BEAR TAIL' : 'NEUTRAL', '#10b981']
  ];
  kpis.forEach((row, idx) => {
    const ry = pad + 128 + idx * 30;
    roundRect(bX, ry, bW, 24, 4);
    ctx.fillStyle = 'rgba(39, 39, 42, 0.75)';
    ctx.fill();
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], bX + 8, ry + 15);
    ctx.fillStyle = row[2];
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row[1], bX + bW - 8, ry + 15);
  });

  // Pulse Stealth Strike indicator
  const strikeCol = upWick > loWick ? '#f87171' : '#10b981';
  ctx.fillStyle = strikeCol;
  ctx.beginPath(); ctx.arc(bX + 8, pad + 230, 4 + Math.sin(t * 4) * 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(kurt > 0.5 ? 'FAT-TAIL ANOMALY DETECTED' : 'NORMAL TAIL ENVELOPE', bX + 18, pad + 233);

  drawOpenTradeBadge(bX, h - pad - 48, bW);
  ctx.restore();
};
