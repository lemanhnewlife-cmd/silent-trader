window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.HYDRA = function(ctx, w, h, st) {
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
  bg.addColorStop(0, '#080410');
  bg.addColorStop(1, '#050814');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const sats = Array.isArray(tel.satellites) ? tel.satellites : [];
  const buyPct = clamp(tel.buy_weight_pct, 0, 100);
  const sellPct = clamp(tel.sell_weight_pct, 0, 100);
  const waitPct = clamp(tel.wait_weight_pct, 0, 100);
  const consPct = clamp(tel.consensus_pct, 0, 100);
  const kelly = num(tel.kelly_mult, 1);
  const quorum = Boolean(tel.quorum_met);
  const buyVotes = Math.round(num(tel.buy_votes, 0));
  const sellVotes = Math.round(num(tel.sell_votes, 0));

  const pad = 14;
  const leftW = w * 0.66 - pad * 1.3;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  // Left Panel: 14-Satellite Hydra Orbit Network
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(16, 12, 32, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = pad + leftW / 2;
  const cy = pad + (h - pad * 2) / 2;
  const rxOrb = clamp(leftW * 0.37, 80, 220);
  const ryOrb = clamp((h - pad * 2) * 0.37, 65, 118);

  // Orbit ring
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rxOrb, ryOrb, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Core radial glow
  const coreCol = buyVotes > sellVotes ? '#4ade80' : sellVotes > buyVotes ? '#f43f5e' : '#a855f7';
  const cGlow = safeRadGrad(cx, cy, 4, cx, cy, 56);
  cGlow.addColorStop(0, quorum ? 'rgba(74, 222, 128, 0.32)' : 'rgba(168, 85, 247, 0.25)');
  cGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cGlow;
  ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.fill();

  const totalSats = sats.length;
  for (let i = 0; i < totalSats; i++) {
    const s = sats[i];
    if (!s || typeof s !== 'object') continue;
    const act = String(s.action || 'WAIT').toUpperCase();
    const sCol = act === 'BUY' ? '#4ade80' : act === 'SELL' ? '#f43f5e' : '#64748b';
    const a = (i / Math.max(1, totalSats)) * Math.PI * 2 - Math.PI / 2 + t * 0.04;
    const nx = cx + Math.cos(a) * rxOrb;
    const ny = cy + Math.sin(a) * ryOrb;

    ctx.strokeStyle = act === 'WAIT' ? 'rgba(100,116,139,0.28)' : sCol;
    ctx.lineWidth = act === 'WAIT' ? 1 : 1.8;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();

    const nr = act === 'WAIT' ? 6 : 8.5;
    ctx.fillStyle = sCol;
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();

    const shortLbl = String(s.short_name || s.sid || `S${i + 1}`).slice(0, 8);
    const conf = Math.round(num(s.confidence, 0));
    const lx = cx + Math.cos(a) * (rxOrb + 24);
    const ly = cy + Math.sin(a) * (ryOrb + 16);
    ctx.fillStyle = act === 'WAIT' ? '#94a3b8' : sCol;
    ctx.font = act === 'WAIT' ? '9px monospace' : 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${shortLbl} ${conf}%`, lx, ly + 3);
  }

  // Central Hydra Core
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = coreCol;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${consPct.toFixed(0)}%`, cx, cy + 2);
  ctx.fillStyle = quorum ? '#4ade80' : '#a855f7';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(quorum ? 'QUORUM' : 'STANDBY', cx, cy + 16);
  ctx.restore();

  // Right Panel: Vote Allocation + Kelly + Open Trade
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(16, 12, 32, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('14-BRAIN SWARM CONSENSUS', rightX + 12, pad + 20);

  // Stacked Vote Bar
  const bX = rightX + 12;
  const bW = rightW - 24;
  const bY = pad + 34;
  const totPct = Math.max(1e-6, buyPct + waitPct + sellPct);
  const wBuy = (buyPct / totPct) * bW;
  const wWait = (waitPct / totPct) * bW;
  const wSell = bW - wBuy - wWait;

  ctx.fillStyle = '#4ade80'; ctx.fillRect(bX, bY, wBuy, 14);
  ctx.fillStyle = '#475569'; ctx.fillRect(bX + wBuy, bY, wWait, 14);
  ctx.fillStyle = '#f43f5e'; ctx.fillRect(bX + wBuy + wWait, bY, wSell, 14);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#4ade80'; ctx.textAlign = 'left';
  ctx.fillText(`BUY ${buyPct.toFixed(1)}% (${buyVotes})`, bX, bY + 28);
  ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
  ctx.fillText(`WAIT ${waitPct.toFixed(0)}%`, bX + bW / 2, bY + 28);
  ctx.fillStyle = '#f43f5e'; ctx.textAlign = 'right';
  ctx.fillText(`SELL ${sellPct.toFixed(1)}% (${sellVotes})`, bX + bW, bY + 28);

  const kpis = [
    ['CONSENSUS', `${consPct.toFixed(1)}%`, '#4ade80'],
    ['KELLY MULT', `${kelly.toFixed(2)}x`, '#06b6d4'],
    ['QUORUM GATE', quorum ? 'MET / ACTIVE' : 'WAITING', quorum ? '#4ade80' : '#f59e0b'],
    ['ACTIVE HEADS', `${totalSats} NODES`, '#a855f7']
  ];
  kpis.forEach((row, idx) => {
    const ry = bY + 46 + idx * 32;
    roundRect(bX, ry, bW, 24, 4);
    ctx.fillStyle = 'rgba(30, 27, 56, 0.8)';
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], bX + 8, ry + 16);
    ctx.fillStyle = row[2];
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row[1], bX + bW - 8, ry + 16);
  });

  drawOpenTradeBadge(bX, h - pad - 48, bW);
  ctx.restore();
};
