window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHRONOS = function(ctx, w, h, st) {
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
    ctx.fillStyle = isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
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
  bg.addColorStop(0, '#010409');
  bg.addColorStop(1, '#060c18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const pad = 14;
  const leftW = w * 0.36 - pad * 1.2;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  const utcFloat = clamp(tel.utc_hour_float, 0, 24);
  const activeWin = String(tel.active_window || 'STANDBY');
  const nextWin = String(tel.next_window_name || 'NEXT');
  const nextSec = Math.max(0, Math.floor(num(tel.next_window_sec, 0)));
  const devZ = num(tel.deviation_z, 0);
  const windows = Array.isArray(tel.windows) ? tel.windows : [];
  const prices = Array.isArray(tel.session_prices) ? tel.session_prices.map(v => num(v, 0)).filter(v => v > 0) : [];
  const sMean = num(tel.session_mean, prices.length ? prices[prices.length - 1] : 0);
  const sUpper = num(tel.session_upper, sMean + 10);
  const sLower = num(tel.session_lower, sMean - 10);

  // Left Panel: 24h Chronos Clock
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = pad + leftW / 2;
  const cy = pad + (h - pad * 2) * 0.45;
  const r = clamp(Math.min(leftW * 0.36, h * 0.32), 45, 110);

  const glow = safeRadGrad(cx, cy, 4, cx, cy, r * 1.2);
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2); ctx.fill();

  // Outer dial rings
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // 24 hour ticks
  for (let hr = 0; hr < 24; hr++) {
    const a = (hr / 24) * Math.PI * 2 - Math.PI / 2;
    const isMajor = hr % 6 === 0;
    const len = isMajor ? 9 : 4;
    ctx.strokeStyle = isMajor ? '#38bdf8' : 'rgba(148,163,184,0.35)';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }

  // 7 Macro Windows
  windows.forEach((win) => {
    if (!win || typeof win !== 'object') return;
    const hr = clamp(win.hour, 0, 24);
    const a = (hr / 24) * Math.PI * 2 - Math.PI / 2;
    const wx = cx + Math.cos(a) * (r - 2);
    const wy = cy + Math.sin(a) * (r - 2);
    const isAct = Boolean(win.active);
    ctx.fillStyle = isAct ? '#f59e0b' : '#8b5cf6';
    ctx.beginPath();
    ctx.arc(wx, wy, isAct ? 5.5 + Math.sin(t * 4) * 1.2 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (isAct || leftW > 220) {
      ctx.fillStyle = isAct ? '#f59e0b' : '#64748b';
      ctx.font = isAct ? 'bold 9px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      const lbl = String(win.name || '').split(' ')[0];
      ctx.fillText(lbl, cx + Math.cos(a) * (r + 14), cy + Math.sin(a) * (r + 14) + 3);
    }
  });

  // UTC Hour Hand
  const handA = (utcFloat / 24) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(handA) * (r - 12), cy + Math.sin(handA) * (r - 12));
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

  // Digital UTC time
  const hh = Math.floor(utcFloat);
  const mm = Math.floor((utcFloat - hh) * 60);
  const utcStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} UTC`;
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(utcStr, cx, cy + r * 0.42);

  // Countdown below dial
  const cdMin = Math.floor(nextSec / 60);
  const cdSec = nextSec % 60;
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`ACTIVE: ${activeWin}`, cx, h - pad - 34);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText(`NEXT: ${nextWin} (${String(cdMin).padStart(2, '0')}:${String(cdSec).padStart(2, '0')})`, cx, h - pad - 16);
  ctx.restore();

  // Right Panel: Session Channel & Mean Reversion Chart
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top KPI strip
  const kpis = [
    ['DEV Z', `${devZ >= 0 ? '+' : ''}${devZ.toFixed(2)}s`, Math.abs(devZ) >= 1.5 ? '#f59e0b' : '#38bdf8'],
    ['SESSION MEAN', sMean.toFixed(2), '#10b981'],
    ['BAND WIDTH', `$${Math.max(0, sUpper - sLower).toFixed(2)}`, '#8b5cf6']
  ];
  const cardW = (rightW - 36) / 3;
  kpis.forEach((k, idx) => {
    const kx = rightX + 12 + idx * (cardW + 6);
    const ky = pad + 10;
    roundRect(kx, ky, cardW, 38, 5);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
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
  const cY = pad + 58;
  const cW = rightW - 76;
  const cH = h - pad * 2 - (ot ? 100 : 72);

  if (prices.length >= 2) {
    const allV = prices.concat([sMean, sUpper, sLower]).filter(v => v > 0);
    let minV = Math.min(...allV);
    let maxV = Math.max(...allV);
    if (maxV - minV < 0.5) { minV -= 1; maxV += 1; }
    const padSpan = (maxV - minV) * 0.08;
    minV -= padSpan; maxV += padSpan;
    const span = maxV - minV;
    const toX = (i) => cX + (i / Math.max(1, prices.length - 1)) * cW;
    const toY = (v) => cY + cH - ((v - minV) / span) * cH;

    // Channel band fill [lower, upper]
    const yUp = toY(sUpper);
    const yLo = toY(sLower);
    const yMean = toY(sMean);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
    ctx.fillRect(cX, Math.min(yUp, yLo), cW, Math.abs(yLo - yUp));

    // Upper & Lower band lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cX, yUp); ctx.lineTo(cX + cW, yUp); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cX, yLo); ctx.lineTo(cX + cW, yLo); ctx.stroke();

    // Mean line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cX, yMean); ctx.lineTo(cX + cW, yMean); ctx.stroke();
    ctx.setLineDash([]);

    // Price path
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
      const px = toX(i), py = toY(prices[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Active price point
    const lx = toX(prices.length - 1);
    const ly = toY(prices[prices.length - 1]);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(lx, ly, 4.5, 0, Math.PI * 2); ctx.fill();

    // Axis labels
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b'; ctx.fillText(sUpper.toFixed(1), cX + cW + 6, clamp(yUp + 3, cY + 10, cY + cH));
    ctx.fillStyle = '#10b981'; ctx.fillText(sMean.toFixed(1), cX + cW + 6, clamp(yMean + 3, cY + 10, cY + cH));
    ctx.fillStyle = '#f59e0b'; ctx.fillText(sLower.toFixed(1), cX + cW + 6, clamp(yLo + 3, cY + 10, cY + cH));
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Dang nap du lieu gia phien...', cX, cY + cH / 2);
  }

  drawOpenTradeBadge(rightX + 12, h - pad - 34, rightW - 24);
  ctx.restore();
};
