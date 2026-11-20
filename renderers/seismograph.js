window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SEISMOGRAPH = function(ctx, w, h, st) {
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
    const pnlCol = pnl >= 0 ? '#10b981' : '#ef4444';
    const pnlStr = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
    ctx.save();
    roundRect(x, y, bw, 40, 6);
    ctx.fillStyle = isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(ot.side || 'OPEN').toUpperCase()} ${num(ot.lot, 0).toFixed(2)} @ ${num(ot.open_price, 0).toFixed(2)}`, x + 8, y + 16);
    ctx.fillStyle = pnlCol;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PnL ${pnlStr}`, x + 8, y + 32);
    ctx.restore();
  }

  // Background
  const bg = safeLinGrad(0, 0, 0, h);
  bg.addColorStop(0, '#081020');
  bg.addColorStop(1, '#040812');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const splitX = w * 0.72;
  const pad = 14;
  const leftW = splitX - pad * 1.5;
  const topH = h * 0.54;
  const botY = topH + 10;
  const botH = h - botY - pad;

  const bidWave = Array.isArray(tel.bid_wave) ? tel.bid_wave.map(v => num(v, 0)).filter(v => v > 0) : [];
  const askWave = Array.isArray(tel.ask_wave) ? tel.ask_wave.map(v => num(v, 0)).filter(v => v > 0) : [];
  const sprWave = Array.isArray(tel.spread_wave) ? tel.spread_wave.map(v => num(v, 0)) : [];

  const spreadUsd = num(tel.spread_usd, 0);
  const spreadZ = num(tel.spread_zscore, 0);
  const richter = clamp(tel.richter, 0, 10);
  const skew = num(tel.quote_skew, 0);
  const storm = Boolean(tel.storm_alert);

  // Top-left panel: Bid & Ask Quotes
  ctx.save();
  roundRect(pad, pad, leftW, topH - pad, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const plotX = pad + 12;
  const plotY = pad + 26;
  const plotW = leftW - 72;
  const plotH = topH - pad - 36;

  // Grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = plotY + (g / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ORDERBOOK BID / ASK MICRO-RIBBON', plotX, pad + 18);

  if (bidWave.length >= 2 && askWave.length >= 2) {
    const allP = bidWave.concat(askWave);
    let minP = Math.min(...allP);
    let maxP = Math.max(...allP);
    if (maxP - minP < 0.05) { minP -= 0.1; maxP += 0.1; }
    const span = maxP - minP;
    const nPts = Math.min(bidWave.length, askWave.length);
    const toX = (i) => plotX + (i / Math.max(1, nPts - 1)) * plotW;
    const toY = (v) => plotY + plotH - ((v - minP) / span) * plotH;

    // Fill ribbon between ask & bid
    ctx.beginPath();
    for (let i = 0; i < nPts; i++) {
      const x = toX(i), y = toY(askWave[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = nPts - 1; i >= 0; i--) {
      ctx.lineTo(toX(i), toY(bidWave[i]));
    }
    ctx.closePath();
    ctx.fillStyle = storm ? 'rgba(255, 107, 107, 0.22)' : 'rgba(0, 212, 255, 0.14)';
    ctx.fill();

    // Ask line (#fb923c)
    ctx.beginPath();
    for (let i = 0; i < nPts; i++) {
      const x = toX(i), y = toY(askWave[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bid line (#00d4ff)
    ctx.beginPath();
    for (let i = 0; i < nPts; i++) {
      const x = toX(i), y = toY(bidWave[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right price labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(maxP.toFixed(2), plotX + plotW + 6, plotY + 8);
    ctx.fillText(((maxP + minP) / 2).toFixed(2), plotX + plotW + 6, plotY + plotH / 2 + 3);
    ctx.fillText(minP.toFixed(2), plotX + plotW + 6, plotY + plotH);

    // Live dots
    const lx = toX(nPts - 1);
    ctx.fillStyle = '#fb923c';
    ctx.beginPath(); ctx.arc(lx, toY(askWave[nPts - 1]), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath(); ctx.arc(lx, toY(bidWave[nPts - 1]), 3.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Dang thu thap song Bid/Ask...', plotX, plotY + plotH / 2);
  }
  ctx.restore();

  // Bottom-left panel: Spread Seismograph Wave
  ctx.save();
  roundRect(pad, botY, leftW, botH, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = storm ? 'rgba(255, 107, 107, 0.45)' : 'rgba(16, 185, 129, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const sX = pad + 12;
  const sY = botY + 24;
  const sW = leftW - 72;
  const sH = botH - 34;

  ctx.fillStyle = storm ? '#ff6b6b' : '#10b981';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SPREAD SEISMOGRAPH TRACE (USD)', sX, botY + 16);

  if (sprWave.length >= 2) {
    const maxS = Math.max(0.5, ...sprWave) * 1.15;
    const minS = 0;
    const toSX = (i) => sX + (i / Math.max(1, sprWave.length - 1)) * sW;
    const toSY = (v) => sY + sH - (clamp((v - minS) / (maxS - minS), 0, 1)) * sH;

    // Area fill
    const sGrad = safeLinGrad(0, sY, 0, sY + sH);
    sGrad.addColorStop(0, storm ? 'rgba(255, 107, 107, 0.4)' : 'rgba(16, 185, 129, 0.35)');
    sGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    ctx.beginPath();
    ctx.moveTo(toSX(0), sY + sH);
    for (let i = 0; i < sprWave.length; i++) {
      ctx.lineTo(toSX(i), toSY(sprWave[i]));
    }
    ctx.lineTo(toSX(sprWave.length - 1), sY + sH);
    ctx.closePath();
    ctx.fillStyle = sGrad;
    ctx.fill();

    // Waveform
    ctx.beginPath();
    for (let i = 0; i < sprWave.length; i++) {
      const px = toSX(i), py = toSY(sprWave[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = storm ? '#ff6b6b' : '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`$${maxS.toFixed(2)}`, sX + sW + 6, sY + 8);
    ctx.fillText(`$0.00`, sX + sW + 6, sY + sH);
  }
  ctx.restore();

  // Right panel: Richter Gauge + KPIs + Open Trade
  const rx = splitX + 4;
  const rw = w - rx - pad;
  ctx.save();
  roundRect(rx, pad, rw, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fill();
  ctx.strokeStyle = storm ? '#ff6b6b' : 'rgba(251, 146, 60, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const gcx = rx + rw / 2;
  const gcy = pad + 95;
  const gr = clamp(Math.min(rw * 0.36, 72), 36, 72);

  // Outer radial glow
  const rGlow = safeRadGrad(gcx, gcy, 4, gcx, gcy, gr * 1.15);
  rGlow.addColorStop(0, storm ? 'rgba(255,107,107,0.28)' : 'rgba(251,146,60,0.18)');
  rGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rGlow;
  ctx.beginPath(); ctx.arc(gcx, gcy, gr * 1.15, 0, Math.PI * 2); ctx.fill();

  // Gauge arc track
  const startA = Math.PI * 0.75;
  const endA = Math.PI * 2.25;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(gcx, gcy, gr, startA, endA); ctx.stroke();

  // Active Richter arc
  const frac = clamp(richter / 10, 0, 1);
  const valA = startA + frac * (endA - startA);
  const arcCol = richter >= 6 ? '#ff6b6b' : richter >= 3.5 ? '#f59e0b' : '#10b981';
  ctx.strokeStyle = arcCol;
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(gcx, gcy, gr, startA, valA); ctx.stroke();

  // Needle
  const nx = gcx + Math.cos(valA) * (gr - 14);
  const ny = gcy + Math.sin(valA) * (gr - 14);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(gcx, gcy); ctx.lineTo(nx, ny); ctx.stroke();
  ctx.fillStyle = arcCol;
  ctx.beginPath(); ctx.arc(gcx, gcy, 5, 0, Math.PI * 2); ctx.fill();

  // Richter text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(richter.toFixed(1), gcx, gcy + 28);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('RICHTER SCALE', gcx, gcy + 42);

  // Storm badge
  const pulse = 0.65 + 0.35 * Math.sin(t * 5);
  ctx.fillStyle = storm ? `rgba(255, 107, 107, ${pulse.toFixed(2)})` : 'rgba(16, 185, 129, 0.9)';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(storm ? 'STORM ALERT ACTIVE' : 'SEISMIC CALM', gcx, pad + 18);

  // KPI rows
  const kpiY = gcy + 58;
  const kpis = [
    ['SPREAD', `$${spreadUsd.toFixed(2)}`, '#00d4ff'],
    ['SPREAD Z', `${spreadZ >= 0 ? '+' : ''}${spreadZ.toFixed(2)}s`, Math.abs(spreadZ) > 2 ? '#ff6b6b' : '#e2e8f0'],
    ['QUOTE SKEW', `${skew >= 0 ? '+' : ''}${skew.toFixed(2)}`, '#fb923c']
  ];
  kpis.forEach((row, idx) => {
    const ry = kpiY + idx * 24;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    roundRect(rx + 10, ry, rw - 20, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], rx + 16, ry + 13);
    ctx.fillStyle = row[2];
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row[1], rx + rw - 16, ry + 13);
  });

  drawOpenTradeBadge(rx + 10, h - pad - 48, rw - 20);
  ctx.restore();
};
