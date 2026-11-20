window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.RATIO = function(ctx, w, h, st) {
  if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
  const snap = (st && st.snap) || {};
  const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
  const ot = snap.open_trade || null;

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

  // Background
  const bg = safeLinGrad(0, 0, 0, h);
  bg.addColorStop(0, '#06141c');
  bg.addColorStop(1, '#040b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const compZ = num(tel.composite_z, 0);
  const tiltDeg = clamp(tel.tilt_deg, -35, 35);
  const domPair = String(tel.dominant_pair || 'XAU/CORR');
  const ratios = Array.isArray(tel.ratios) ? tel.ratios : [];
  const zSeries = Array.isArray(tel.z_series) ? tel.z_series.map(v => num(v, 0)) : [];

  const pad = 12;
  const topH = h * 0.45;
  const botY = topH + 8;
  const botH = h - botY - pad;
  const leftW = w * 0.32 - pad;
  const rightX = pad + leftW + 10;
  const rightW = w - rightX - pad;

  // Top-Left Panel: Composite Tilt Beam Gauge
  ctx.save();
  roundRect(pad, pad, leftW, topH - pad, 8);
  ctx.fillStyle = 'rgba(10, 26, 36, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const bCx = pad + leftW / 2;
  const bCy = pad + (topH - pad) * 0.56;
  const beamR = clamp(leftW * 0.34, 34, 80);
  const rad = (tiltDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * beamR;
  const dy = Math.sin(rad) * beamR;

  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('COMPOSITE Z-BEAM', bCx, pad + 18);

  // Fulcrum triangle
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.beginPath();
  ctx.moveTo(bCx, bCy + 2);
  ctx.lineTo(bCx - 8, bCy + 16);
  ctx.lineTo(bCx + 8, bCy + 16);
  ctx.closePath();
  ctx.fill();

  const zCol = Math.abs(compZ) >= 1.5 ? '#f59e0b' : '#10b981';
  ctx.strokeStyle = zCol;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(bCx - dx, bCy - dy); ctx.lineTo(bCx + dx, bCy + dy); ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath(); ctx.arc(bCx - dx, bCy - dy, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(bCx + dx, bCy + dy, 4.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = zCol;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`Z: ${compZ >= 0 ? '+' : ''}${compZ.toFixed(2)}s (${tiltDeg.toFixed(1)} deg)`, bCx, topH - 12);
  ctx.restore();

  // Top-Right Panel: 3 Cross-Asset Ratio Cards
  ctx.save();
  roundRect(rightX, pad, rightW, topH - pad, 8);
  ctx.fillStyle = 'rgba(10, 26, 36, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`INTERMARKET RATIOS (LEAD: ${domPair})`, rightX + 12, pad + 18);

  const cards = ratios.slice(0, 3);
  if (cards.length > 0) {
    const cw = (rightW - 24 - (cards.length - 1) * 8) / cards.length;
    const cy0 = pad + 28;
    const ch = topH - pad - 38;
    cards.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const cx0 = rightX + 12 + idx * (cw + 8);
      const isDom = String(item.pair || '') === domPair;
      const rz = num(item.zscore, 0);
      roundRect(cx0, cy0, cw, ch, 6);
      ctx.fillStyle = isDom ? 'rgba(45, 212, 191, 0.14)' : 'rgba(15, 35, 45, 0.75)';
      ctx.fill();
      ctx.strokeStyle = isDom ? '#2dd4bf' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isDom ? '#2dd4bf' : '#e2e8f0';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(item.pair || `PAIR ${idx + 1}`), cx0 + 8, cy0 + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`Ratio: ${num(item.ratio, 0).toFixed(4)}`, cx0 + 8, cy0 + 36);
      ctx.fillText(`Asset: ${num(item.price, 0).toFixed(2)}`, cx0 + 8, cy0 + 50);

      // Deviation bar [-3, +3]
      const barY = cy0 + ch - 24;
      const barW = cw - 16;
      const midX = cx0 + 8 + barW / 2;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.fillRect(cx0 + 8, barY, barW, 6);
      const fillFrac = clamp(rz / 3, -1, 1) * (barW / 2);
      ctx.fillStyle = rz >= 0 ? '#10b981' : '#f59e0b';
      if (fillFrac >= 0) ctx.fillRect(midX, barY, fillFrac, 6);
      else ctx.fillRect(midX + fillFrac, barY, Math.abs(fillFrac), 6);

      ctx.fillStyle = Math.abs(rz) >= 1.5 ? '#f59e0b' : '#cbd5e1';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Z ${rz >= 0 ? '+' : ''}${rz.toFixed(2)}`, cx0 + cw - 8, cy0 + 18);
    });
  }
  ctx.restore();

  // Bottom Panel: Z-Score Equilibrium Series + Open Trade
  ctx.save();
  roundRect(pad, botY, w - pad * 2, botH, 8);
  ctx.fillStyle = 'rgba(10, 26, 36, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PAIR RATIO Z-SCORE REVERSION CHANNEL', pad + 14, botY + 17);

  if (ot && typeof ot === 'object') {
    const isBuy = String(ot.side || '').toUpperCase() === 'BUY';
    const pnl = num(ot.floating_usd, 0);
    const pnlStr = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
    ctx.fillStyle = isBuy ? '#10b981' : '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${String(ot.side || 'OPEN').toUpperCase()} ${num(ot.lot, 0).toFixed(2)} @ ${num(ot.open_price, 0).toFixed(2)} (${pnlStr})`, w - pad - 14, botY + 17);
  }

  const cX = pad + 14;
  const cY = botY + 26;
  const cW = w - pad * 2 - 60;
  const cH = botH - 36;
  const maxAbs = Math.max(2.5, ...zSeries.map(v => Math.abs(v))) * 1.1;
  const toX = (i) => cX + (i / Math.max(1, zSeries.length - 1)) * cW;
  const toY = (v) => cY + cH / 2 - (v / maxAbs) * (cH / 2);

  // Equilibrium & threshold guides
  [[0, '#10b981', false, '0.0'], [1.5, 'rgba(245,158,11,0.5)', true, '+1.5'], [-1.5, 'rgba(245,158,11,0.5)', true, '-1.5']].forEach(([zv, col, dash, lbl]) => {
    const gy = toY(zv);
    ctx.strokeStyle = col;
    ctx.lineWidth = dash ? 1 : 1.5;
    if (dash) ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cX, gy); ctx.lineTo(cX + cW, gy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(lbl, cX + cW + 6, gy + 3);
  });

  if (zSeries.length >= 2) {
    const midY = toY(0);
    const zGrad = safeLinGrad(0, cY, 0, cY + cH);
    zGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    zGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
    zGrad.addColorStop(1, 'rgba(245, 158, 11, 0.3)');

    ctx.beginPath();
    ctx.moveTo(toX(0), midY);
    for (let i = 0; i < zSeries.length; i++) ctx.lineTo(toX(i), toY(zSeries[i]));
    ctx.lineTo(toX(zSeries.length - 1), midY);
    ctx.closePath();
    ctx.fillStyle = zGrad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < zSeries.length; i++) {
      const px = toX(i), py = toY(zSeries[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const lx = toX(zSeries.length - 1);
    const ly = toY(zSeries[zSeries.length - 1]);
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};
