window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.VENOM = function(ctx, w, h, st) {
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
  bg.addColorStop(0, '#100508');
  bg.addColorStop(1, '#060204');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const spikeDetected = Boolean(tel.spike_detected);
  const spikeDir = String(tel.spike_dir || 'UP').toUpperCase();
  const spikeUsd = num(tel.spike_usd, 0);
  const halfLife = clamp(tel.half_life_pct, 0, 100);
  const exhaust = clamp(tel.exhaustion_score, 0, 100);
  const retrace = num(tel.retrace_target, 0);
  const ecg = Array.isArray(tel.ecg_series) ? tel.ecg_series.map(v => num(v, 0)) : [];

  const pad = 14;
  const leftW = w * 0.68 - pad * 1.3;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  const waveCol = spikeDetected ? '#ef4444' : '#10b981';

  // Left Panel: ECG Spike Pulse Monitor
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(24, 10, 14, 0.72)';
  ctx.fill();
  ctx.strokeStyle = spikeDetected ? 'rgba(239, 68, 68, 0.55)' : 'rgba(236, 72, 153, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ECG TOXIC FLOW & SPIKE EXHAUSTION MONITOR', pad + 14, pad + 20);

  // Alert banner
  const bCol = spikeDetected ? '#ef4444' : '#10b981';
  const bTxt = spikeDetected ? `SPIKE ${spikeDir} $${spikeUsd.toFixed(2)}` : `CALM | DELTA $${spikeUsd.toFixed(2)}`;
  ctx.fillStyle = bCol;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(bTxt, pad + leftW - 14, pad + 20);

  const cX = pad + 16;
  const cY = pad + 34;
  const cW = leftW - 32;
  const cH = h - pad * 2 - 48;
  const midY = cY + cH / 2;

  // Grid
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = cY + (g / 4) * cH;
    ctx.beginPath(); ctx.moveTo(cX, gy); ctx.lineTo(cX + cW, gy); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cX, midY); ctx.lineTo(cX + cW, midY); ctx.stroke();
  ctx.setLineDash([]);

  if (ecg.length >= 2) {
    const maxAbs = Math.max(0.5, ...ecg.map(v => Math.abs(v))) * 1.15;
    const toX = (i) => cX + (i / Math.max(1, ecg.length - 1)) * cW;
    const toY = (v) => midY - (v / maxAbs) * (cH * 0.45);

    // Gradient area fill around 0
    const areaG = safeLinGrad(0, cY, 0, cY + cH);
    areaG.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
    areaG.addColorStop(0.5, 'rgba(236, 72, 153, 0.04)');
    areaG.addColorStop(1, 'rgba(16, 185, 129, 0.25)');
    ctx.beginPath();
    ctx.moveTo(toX(0), midY);
    for (let i = 0; i < ecg.length; i++) ctx.lineTo(toX(i), toY(ecg[i]));
    ctx.lineTo(toX(ecg.length - 1), midY);
    ctx.closePath();
    ctx.fillStyle = areaG;
    ctx.fill();

    // ECG Line
    ctx.beginPath();
    for (let i = 0; i < ecg.length; i++) {
      const px = toX(i), py = toY(ecg[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = waveCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Pulsing heartbeat dot
    const lx = toX(ecg.length - 1);
    const ly = toY(ecg[ecg.length - 1]);
    const pr = 4 + Math.sin(t * 6) * 1.5;
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(lx, ly, Math.max(2, pr), 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Đang theo dõi xung ECG...', cX, midY - 10);
  }
  ctx.restore();

  // Right Panel: Exhaustion Semicircle Gauge + Half-Life + Retrace Target
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(24, 10, 14, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const gcx = rightX + rightW / 2;
  const gcy = pad + 92;
  const gr = clamp(Math.min(rightW * 0.36, 68), 36, 68);

  // Semicircle gauge (Math.PI to 2*Math.PI)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(gcx, gcy, gr, Math.PI, Math.PI * 2); ctx.stroke();

  const exCol = exhaust >= 70 ? '#ef4444' : exhaust >= 40 ? '#f97316' : '#10b981';
  ctx.strokeStyle = exCol;
  ctx.beginPath(); ctx.arc(gcx, gcy, gr, Math.PI, Math.PI + (exhaust / 100) * Math.PI); ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(exhaust)}`, gcx, gcy - 6);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('EXHAUSTION SCORE', gcx, gcy + 14);

  // Half-life bar
  const bX = rightX + 12;
  const bW = rightW - 24;
  const hlY = gcy + 36;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HALF-LIFE DECAY', bX, hlY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f97316';
  ctx.fillText(`${halfLife.toFixed(1)}%`, bX + bW, hlY);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(bX, hlY + 6, bW, 8);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(bX, hlY + 6, bW * (halfLife / 100), 8);

  // Retrace & Spike USD boxes
  [['SPIKE AMPLITUDE', `$${spikeUsd.toFixed(2)}`, '#ec4899'],
   ['RETRACE TARGET', retrace > 0 ? retrace.toFixed(2) : '-', '#10b981']].forEach((row, idx) => {
    const ry = hlY + 26 + idx * 28;
    roundRect(bX, ry, bW, 22, 4);
    ctx.fillStyle = 'rgba(40, 18, 25, 0.85)';
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], bX + 8, ry + 15);
    ctx.fillStyle = row[2];
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row[1], bX + bW - 8, ry + 15);
  });

  drawOpenTradeBadge(bX, h - pad - 48, bW);
  ctx.restore();
};
