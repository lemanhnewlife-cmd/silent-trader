window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.ENTROPY = function(ctx, w, h, st) {
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

  function drawOpenTradeBadge(x, y, bw) {
    if (!ot || typeof ot !== 'object') return;
    const isBuy = String(ot.side || '').toUpperCase() === 'BUY';
    const pnl = num(ot.floating_usd, 0);
    const col = isBuy ? '#10b981' : '#ef4444';
    const pnlStr = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
    ctx.save();
    roundRect(x, y, bw, 24, 5);
    ctx.fillStyle = isBuy ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(ot.side || 'OPEN').toUpperCase()} ${num(ot.lot, 0).toFixed(2)} @ ${num(ot.open_price, 0).toFixed(2)}`, x + 8, y + 16);
    ctx.fillStyle = pnl >= 0 ? '#10b981' : '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText(pnlStr, x + bw - 8, y + 16);
    ctx.restore();
  }

  // Background
  const bg = safeLinGrad(0, 0, 0, h);
  bg.addColorStop(0, '#080410');
  bg.addColorStop(1, '#04020a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const entropy = clamp(tel.entropy, 0, 1.5);
  const hurst = clamp(tel.hurst, 0, 1);
  const energyPct = clamp(tel.energy_pct, 0, 100);
  const phaseState = String(tel.phase_state || 'CAN_BANG');
  const entSeries = Array.isArray(tel.entropy_series) ? tel.entropy_series.map(v => num(v, 0)) : [];
  const hurSeries = Array.isArray(tel.hurst_series) ? tel.hurst_series.map(v => num(v, 0)) : [];

  const pad = 14;
  const leftW = w * 0.34 - pad;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  const isChaos = phaseState.includes('LOAN') || entropy > 0.85;
  const isCompressed = energyPct >= 65 || phaseState.includes('NEN');
  const reactorCol = isCompressed ? '#10b981' : isChaos ? '#f43f5e' : '#a855f7';

  // Left Panel: Thermodynamic Compression Reactor
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(20, 12, 34, 0.65)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = pad + leftW / 2;
  const cy = pad + (h - pad * 2) * 0.44;
  const maxR = clamp(Math.min(leftW * 0.38, h * 0.31), 40, 100);

  const rGrad = safeRadGrad(cx, cy, 4, cx, cy, maxR * 1.25);
  rGrad.addColorStop(0, isCompressed ? 'rgba(16,185,129,0.35)' : isChaos ? 'rgba(244,63,94,0.3)' : 'rgba(168,85,247,0.3)');
  rGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rGrad;
  ctx.beginPath(); ctx.arc(cx, cy, maxR * 1.25, 0, Math.PI * 2); ctx.fill();

  // 4 concentric rings contracting with energyPct & 1-entropy
  const compression = clamp(energyPct / 100, 0.05, 1);
  for (let ring = 4; ring >= 1; ring--) {
    const breathe = Math.sin(t * (2 + compression * 3) + ring) * 2.5;
    const rr = Math.max(8, (maxR * (ring / 4)) * (1 - compression * 0.22) + breathe);
    ctx.strokeStyle = ring === 1 ? reactorCol : 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = ring === 1 ? 2.5 : 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
  }

  // Orbiting thermo particles
  const pCount = 12;
  for (let i = 0; i < pCount; i++) {
    const a = (i / pCount) * Math.PI * 2 + t * (0.6 + compression * 1.6);
    const pr = maxR * (0.45 + 0.4 * (1 - compression));
    ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#a855f7';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${energyPct.toFixed(1)}%`, cx, cy + 7);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('COMPRESSION ENERGY', cx, pad + 20);

  roundRect(cx - 66, h - pad - 42, 132, 24, 5);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fill();
  ctx.strokeStyle = reactorCol;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = reactorCol;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(phaseState, cx, h - pad - 26);
  ctx.restore();

  // Right Panel: Dual Series Chart (Entropy vs Hurst)
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(20, 12, 34, 0.65)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // KPI cards
  const kpis = [
    ['SHANNON ENTROPY', entropy.toFixed(3), '#a855f7'],
    ['HURST EXPONENT', hurst.toFixed(3), '#10b981'],
    ['STATE REGIME', isChaos ? 'HIGH CHAOS' : isCompressed ? 'COMPRESSED' : 'BALANCED', reactorCol]
  ];
  const cardW = (rightW - 36) / 3;
  kpis.forEach((k, idx) => {
    const kx = rightX + 12 + idx * (cardW + 6);
    const ky = pad + 10;
    roundRect(kx, ky, cardW, 38, 5);
    ctx.fillStyle = 'rgba(30, 27, 50, 0.78)';
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(k[0], kx + 8, ky + 14);
    ctx.fillStyle = k[2];
    ctx.font = 'bold 13px monospace';
    ctx.fillText(k[1], kx + 8, ky + 30);
  });

  const cX = rightX + 14;
  const cY = pad + 60;
  const cW = rightW - 56;
  const cH = h - pad * 2 - (ot ? 102 : 74);

  // Horizontal grid + 0.50 equilibrium line
  for (let g = 0; g <= 4; g++) {
    const val = 1 - g * 0.25;
    const gy = cY + (g / 4) * cH;
    ctx.strokeStyle = g === 2 ? 'rgba(244, 63, 94, 0.5)' : 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = g === 2 ? 1.5 : 1;
    if (g === 2) ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cX, gy); ctx.lineTo(cX + cW, gy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(val.toFixed(2), cX + cW + 6, gy + 3);
  }

  function plotSeries(arr, color, fillTop) {
    if (arr.length < 2) return;
    const toX = (i) => cX + (i / Math.max(1, arr.length - 1)) * cW;
    const toY = (v) => cY + cH - clamp(v, 0, 1) * cH;
    const grad = safeLinGrad(0, cY, 0, cY + cH);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(toX(0), cY + cH);
    for (let i = 0; i < arr.length; i++) ctx.lineTo(toX(i), toY(arr[i]));
    ctx.lineTo(toX(arr.length - 1), cY + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < arr.length; i++) {
      const px = toX(i), py = toY(arr[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const lx = toX(arr.length - 1);
    const ly = toY(arr[arr.length - 1]);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  plotSeries(entSeries, '#a855f7', 'rgba(168, 85, 247, 0.22)');
  plotSeries(hurSeries, '#10b981', 'rgba(16, 185, 129, 0.2)');

  drawOpenTradeBadge(rightX + 12, h - pad - 34, rightW - 24);
  ctx.restore();
};
