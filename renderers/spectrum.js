window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SPECTRUM = function(ctx, w, h, st) {
  if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
  const snap = (st && st.snap) || {};
  const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
  const ot = snap.open_trade || null;
  const t = Number.isFinite(st && st.t) ? st.t : 0;

  const num = (v, fb = 0) => (typeof v === 'number' && Number.isFinite(v)) ? v : (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : fb);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, num(v, lo)));
  const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1, 1), num(y1, 1));
  const safeRadGrad = (x0, y0, r0, x1, y1, r1) => ctx.createRadialGradient(num(x0), num(y0), Math.max(0.5, num(r0, 0.5)), num(x1), num(y1), Math.max(1, num(r1, 1)));

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
  bg.addColorStop(1, '#040a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const pad = 12;
  const topH = h * 0.46;
  const splitX = w * 0.72;
  const botY = topH + 8;
  const botH = h - botY - pad;

  const rawBars = Array.isArray(tel.spectrum_bars) ? tel.spectrum_bars : [];
  const bars = rawBars.map((b, i) => (b && typeof b === 'object')
    ? { period: num(b.period, i + 4), power: Math.max(0, num(b.power, 0)), dominant: Boolean(b.dominant) }
    : { period: i + 4, power: Math.max(0, num(b, 0)), dominant: false });

  const domWaves = Array.isArray(tel.dominant_waves) ? tel.dominant_waves : [];
  const phaseDeg = num(tel.composite_phase_deg, 0);
  const priceDet = Array.isArray(tel.price_detrended) ? tel.price_detrended.map(v => num(v, 0)) : [];

  // Top-Left Panel: DFT Power Spectrum Bars
  const barBoxW = splitX - pad * 1.5;
  ctx.save();
  roundRect(pad, pad, barBoxW, topH - pad, 8);
  ctx.fillStyle = 'rgba(10, 25, 38, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(8, 145, 178, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('DFT FOURIER POWER SPECTRUM', pad + 12, pad + 17);

  if (bars.length > 0) {
    const maxP = Math.max(1e-6, ...bars.map(b => b.power));
    const bx0 = pad + 14;
    const by0 = pad + 26;
    const bwAll = barBoxW - 28;
    const bhAll = topH - pad - 48;
    const slotW = bwAll / bars.length;
    const bw = Math.max(6, slotW * 0.65);

    bars.forEach((b, i) => {
      const ratio = clamp(b.power / maxP, 0.04, 1);
      const bh = Math.max(3, ratio * bhAll);
      const x = bx0 + i * slotW + (slotW - bw) / 2;
      const y = by0 + bhAll - bh;

      const grad = safeLinGrad(x, by0 + bhAll, x, y);
      if (b.dominant) {
        grad.addColorStop(0, '#0891b2');
        grad.addColorStop(1, '#10b981');
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#38bdf8');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, bw, bh);

      ctx.fillStyle = b.dominant ? '#10b981' : '#94a3b8';
      ctx.font = b.dominant ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${Math.round(b.period)}`, x + bw / 2, by0 + bhAll + 13);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.fillText(b.power.toFixed(2), x + bw / 2, Math.max(by0 + 8, y - 3));
    });
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Dang tinh pho Fourier DFT...', pad + 14, pad + (topH - pad) / 2);
  }
  ctx.restore();

  // Top-Right Panel: Hilbert Phase Compass + Open Trade
  const rx = splitX + 4;
  const rw = w - rx - pad;
  ctx.save();
  roundRect(rx, pad, rw, topH - pad, 8);
  ctx.fillStyle = 'rgba(10, 25, 38, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(8, 145, 178, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = rx + (ot ? rw * 0.34 : rw * 0.5);
  const cy = pad + (topH - pad) * 0.52;
  const r = clamp(Math.min(rw * 0.25, (topH - pad) * 0.36), 28, 52);

  const pGlow = safeRadGrad(cx, cy, 2, cx, cy, r * 1.15);
  pGlow.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
  pGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pGlow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  for (let deg = 0; deg < 360; deg += 45) {
    const a = (deg * Math.PI) / 180 - Math.PI / 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }

  const phA = (phaseDeg * Math.PI) / 180 - Math.PI / 2;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(phA) * (r - 7), cy + Math.sin(phA) * (r - 7));
  ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HILBERT PHASE', cx, pad + 16);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`${phaseDeg.toFixed(0)} deg`, cx, cy + r + 14);

  if (ot && typeof ot === 'object') {
    const bx = rx + rw * 0.56;
    const bw2 = rw * 0.41;
    const by = pad + 18;
    const isBuy = String(ot.side || '').toUpperCase() === 'BUY';
    const pnl = num(ot.floating_usd, 0);
    const col = isBuy ? '#10b981' : '#ef4444';
    const pnlStr = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
    roundRect(bx, by, bw2, topH - pad - 32, 6);
    ctx.fillStyle = isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(ot.side || 'OPEN').toUpperCase()} ${num(ot.lot, 0).toFixed(2)}`, bx + 8, by + 18);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.fillText(`@ ${num(ot.open_price, 0).toFixed(2)}`, bx + 8, by + 35);
    ctx.fillStyle = pnl >= 0 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(pnlStr, bx + 8, by + 54);
  }
  ctx.restore();

  // Bottom Panel: Detrended Price + Dominant Harmonic Waves
  ctx.save();
  roundRect(pad, botY, w - pad * 2, botH, 8);
  ctx.fillStyle = 'rgba(10, 25, 38, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(8, 145, 178, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const wx0 = pad + 14;
  const wy0 = botY + 24;
  const ww = w - pad * 2 - 28;
  const wh = botH - 36;
  const midY = wy0 + wh / 2;

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('DETRENDED WAVE & TOP-3 DOMINANT HARMONICS', wx0, botY + 16);

  // Legend top-right of bottom box
  const waveColors = ['#06b6d4', '#f59e0b', '#10b981'];
  let legX = w - pad - 14;
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  for (let wi = Math.min(3, domWaves.length) - 1; wi >= 0; wi--) {
    const dw = domWaves[wi];
    if (!dw || typeof dw !== 'object') continue;
    const lbl = `P${Math.round(num(dw.period, 0))} (${num(dw.phase_deg, 0).toFixed(0)}°)`;
    ctx.fillStyle = waveColors[wi];
    ctx.fillText(lbl, legX, botY + 16);
    legX -= ctx.measureText(lbl).width + 14;
  }

  // Zero line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(wx0, midY); ctx.lineTo(wx0 + ww, midY); ctx.stroke();
  ctx.setLineDash([]);

  // Scale across price_detrended and all dominant wave series
  let maxAbs = 1e-6;
  priceDet.forEach(v => { const a = Math.abs(v); if (a > maxAbs) maxAbs = a; });
  domWaves.slice(0, 3).forEach(dw => {
    if (dw && Array.isArray(dw.series)) {
      dw.series.forEach(v => { const a = Math.abs(num(v, 0)); if (a > maxAbs) maxAbs = a; });
    }
  });
  const scaleY = (wh * 0.44) / maxAbs;

  // Detrended price (translucent white)
  if (priceDet.length >= 2) {
    ctx.beginPath();
    for (let i = 0; i < priceDet.length; i++) {
      const px = wx0 + (i / Math.max(1, priceDet.length - 1)) * ww;
      const py = midY - priceDet[i] * scaleY;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Top 3 dominant harmonic curves
  domWaves.slice(0, 3).forEach((dw, wi) => {
    const ser = dw && Array.isArray(dw.series) ? dw.series : null;
    if (!ser || ser.length < 2) return;
    ctx.beginPath();
    for (let i = 0; i < ser.length; i++) {
      const px = wx0 + (i / Math.max(1, ser.length - 1)) * ww;
      const py = midY - num(ser[i], 0) * scaleY;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = waveColors[wi];
    ctx.lineWidth = 2;
    ctx.stroke();

    const lx = wx0 + ww;
    const ly = midY - num(ser[ser.length - 1], 0) * scaleY;
    ctx.fillStyle = waveColors[wi];
    ctx.beginPath(); ctx.arc(lx, ly + Math.sin(t * 3 + wi) * 0.5, 3, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
};
