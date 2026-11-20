window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.MAGNET = function(ctx, w, h, st) {
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
  bg.addColorStop(0, '#051008');
  bg.addColorStop(1, '#030806');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const vwapCore = num(tel.vwap_core, 0);
  const sessVwap = num(tel.session_vwap, vwapCore);
  const sigmaDist = num(tel.sigma_dist, 0);
  const tensionPct = clamp(tel.tension_pct, 0, 100);
  const pullForce = num(tel.pull_force, 0);
  const escVel = num(tel.escape_velocity, 0);
  const orbit = Array.isArray(tel.price_orbit) ? tel.price_orbit.map(v => num(v, 0)).filter(v => v > 0) : [];
  const bands = (tel.bands && typeof tel.bands === 'object') ? tel.bands : {};

  const pad = 14;
  const leftW = w * 0.36 - pad;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  // Left Panel: Gravity Well & Elastic Tension
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(10, 24, 18, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = pad + leftW / 2;
  const cy = pad + (h - pad * 2) * 0.41;
  const maxR = clamp(Math.min(leftW * 0.38, h * 0.31), 42, 96);

  const wellGlow = safeRadGrad(cx, cy, 4, cx, cy, maxR * 1.15);
  wellGlow.addColorStop(0, 'rgba(34, 197, 94, 0.22)');
  wellGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wellGlow;
  ctx.beginPath(); ctx.arc(cx, cy, maxR * 1.15, 0, Math.PI * 2); ctx.fill();

  // Concentric 1s, 2s, 2.8s rings
  [[1 / 2.8, '#22c55e', '1s'], [2 / 2.8, '#eab308', '2s'], [1, '#ef4444', '2.8s']].forEach(([scale, col, lbl]) => {
    const rr = maxR * scale;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, cx, cy - rr - 3);
  });

  // VWAP core center
  ctx.fillStyle = '#22c55e';
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();

  // Orbiting particle pulled by elastic cord
  const normDist = clamp(Math.abs(sigmaDist) / 2.8, 0.08, 1.05);
  const pR = normDist * maxR;
  const dirAngle = (sigmaDist >= 0 ? -Math.PI / 4 : Math.PI * 0.75) + Math.sin(t * 1.5) * 0.12;
  const px = cx + Math.cos(dirAngle) * pR;
  const py = cy + Math.sin(dirAngle) * pR;

  const tenCol = tensionPct >= 75 ? '#ef4444' : tensionPct >= 50 ? '#eab308' : '#22c55e';
  ctx.strokeStyle = tenCol;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${sigmaDist >= 0 ? '+' : ''}${sigmaDist.toFixed(2)} sigma`, cx, cy + maxR + 18);

  // Tension bar + Pull / Esc Vel
  const barX = pad + 16;
  const barW = leftW - 32;
  const barY = h - pad - 56;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ELASTIC TENSION', barX, barY - 5);
  ctx.textAlign = 'right';
  ctx.fillStyle = tenCol;
  ctx.fillText(`${tensionPct.toFixed(1)}%`, barX + barW, barY - 5);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.fillStyle = tenCol;
  ctx.fillRect(barX, barY, barW * (tensionPct / 100), 8);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Pull: ${pullForce >= 0 ? '+' : ''}${pullForce.toFixed(2)}`, barX, h - pad - 18);
  ctx.textAlign = 'right';
  ctx.fillText(`Esc Vel: ${escVel.toFixed(2)}`, barX + barW, h - pad - 18);
  ctx.restore();

  // Right Panel: Price Orbit inside Anchored VWAP Sigma Bands
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(10, 24, 18, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // KPI Header cards
  const kpis = [
    ['VWAP CORE', vwapCore > 0 ? vwapCore.toFixed(2) : '-', '#22c55e'],
    ['SESSION VWAP', sessVwap > 0 ? sessVwap.toFixed(2) : '-', '#38bdf8'],
    ['SIGMA STEP', `$${num(tel.sigma, 0).toFixed(2)}`, '#f472b6']
  ];
  const cardW = (rightW - 36) / 3;
  kpis.forEach((k, idx) => {
    const kx = rightX + 12 + idx * (cardW + 6);
    const ky = pad + 10;
    roundRect(kx, ky, cardW, 38, 5);
    ctx.fillStyle = 'rgba(15, 35, 25, 0.85)';
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
  const cW = rightW - 78;
  const cH = h - pad * 2 - (ot ? 100 : 72);

  if (orbit.length >= 2) {
    const bandVals = [bands.p1, bands.m1, bands.p2, bands.m2, bands.p28, bands.m28, vwapCore, sessVwap]
      .map(v => num(v, 0)).filter(v => v > 0);
    const otVals = (ot && typeof ot === 'object') ? [ot.open_price, ot.sl, ot.tp].map(v => num(v, 0)).filter(v => v > 0) : [];
    const allV = orbit.concat(bandVals, otVals);
    let minV = Math.min(...allV);
    let maxV = Math.max(...allV);
    if (maxV - minV < 1) { minV -= 1; maxV += 1; }
    const padS = (maxV - minV) * 0.06;
    minV -= padS; maxV += padS;
    const span = maxV - minV;
    const toX = (i) => cX + (i / Math.max(1, orbit.length - 1)) * cW;
    const toY = (v) => cY + cH - ((v - minV) / span) * cH;

    // 1s and 2s shaded channels
    if (num(bands.p2, 0) > 0 && num(bands.m2, 0) > 0) {
      const yP2 = toY(num(bands.p2)), yM2 = toY(num(bands.m2));
      ctx.fillStyle = 'rgba(234, 179, 8, 0.07)';
      ctx.fillRect(cX, Math.min(yP2, yM2), cW, Math.abs(yM2 - yP2));
    }
    if (num(bands.p1, 0) > 0 && num(bands.m1, 0) > 0) {
      const yP1 = toY(num(bands.p1)), yM1 = toY(num(bands.m1));
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(cX, Math.min(yP1, yM1), cW, Math.abs(yM1 - yP1));
    }

    const hLine = (val, col, dash, lbl) => {
      if (val <= 0) return;
      const ly = toY(val);
      ctx.strokeStyle = col;
      ctx.lineWidth = dash ? 1 : 1.6;
      if (dash) ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cX, ly); ctx.lineTo(cX + cW, ly); ctx.stroke();
      ctx.setLineDash([]);
      if (lbl) {
        ctx.fillStyle = col;
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lbl, cX + cW + 6, clamp(ly + 3, cY + 9, cY + cH));
      }
    };

    hLine(num(bands.p28), 'rgba(239,68,68,0.65)', true, `+2.8s ${num(bands.p28).toFixed(0)}`);
    hLine(num(bands.m28), 'rgba(239,68,68,0.65)', true, `-2.8s ${num(bands.m28).toFixed(0)}`);
    hLine(num(bands.p2), 'rgba(234,179,8,0.65)', true, `+2s ${num(bands.p2).toFixed(0)}`);
    hLine(num(bands.m2), 'rgba(234,179,8,0.65)', true, `-2s ${num(bands.m2).toFixed(0)}`);
    hLine(vwapCore, '#22c55e', false, `VWAP ${vwapCore.toFixed(0)}`);

    // Open Trade entry/SL/TP reference
    if (ot && num(ot.open_price) > 0) {
      hLine(num(ot.open_price), '#f472b6', true, '');
    }

    // Price Orbit line
    ctx.beginPath();
    for (let i = 0; i < orbit.length; i++) {
      const ox = toX(i), oy = toY(orbit[i]);
      if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
    }
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lx = toX(orbit.length - 1);
    const ly = toY(orbit[orbit.length - 1]);
    ctx.fillStyle = '#f472b6';
    ctx.beginPath(); ctx.arc(lx, ly, 4.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Dang nap quy dao gia VWAP...', cX, cY + cH / 2);
  }

  drawOpenTradeBadge(rightX + 12, h - pad - 34, rightW - 24);
  ctx.restore();
};
