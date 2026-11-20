window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHAMELEON = function(ctx, w, h, st) {
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
  bg.addColorStop(1, '#070410');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const regime = String(tel.regime || 'SIDEWAY').toUpperCase();
  const pTrend = clamp(tel.p_trend, 0, 1);
  const pSide = clamp(tel.p_sideway, 0, 1);
  const pChop = clamp(tel.p_chop, 0, 1);
  const sumP = Math.max(1e-6, pTrend + pSide + pChop);
  const er = num(tel.efficiency_ratio, 0);
  const ac = num(tel.autocorr, 0);
  const prices = Array.isArray(tel.prices) ? tel.prices.map(v => num(v, 0)).filter(v => v > 0) : [];

  const regCol = regime === 'TREND' ? '#10b981' : regime === 'SIDEWAY' ? '#f59e0b' : '#c084fc';
  const badgeTxt = regime === 'TREND' ? 'TREND MODE' : regime === 'SIDEWAY' ? 'SIDEWAY MODE' : 'HIBERNATE / CHOP';

  const pad = 14;
  const leftW = w * 0.36 - pad;
  const rightX = pad + leftW + 12;
  const rightW = w - rightX - pad;

  // Left Panel: Markov State Barycentric Triangle + Probability Bars
  ctx.save();
  roundRect(pad, pad, leftW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(15, 23, 20, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MARKOV REGIME TRIANGLE', pad + leftW / 2, pad + 18);

  const cx = pad + leftW / 2;
  const topY = pad + 42;
  const botTriY = pad + (h - pad * 2) * 0.56;
  const triHalfW = clamp(leftW * 0.34, 48, 86);

  const vT = { x: cx, y: topY };
  const vS = { x: cx - triHalfW, y: botTriY };
  const vC = { x: cx + triHalfW, y: botTriY };

  ctx.beginPath();
  ctx.moveTo(vT.x, vT.y);
  ctx.lineTo(vS.x, vS.y);
  ctx.lineTo(vC.x, vC.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(192, 132, 252, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Vertex labels
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#10b981'; ctx.fillText('TREND', vT.x, vT.y - 8);
  ctx.fillStyle = '#f59e0b'; ctx.fillText('SIDEWAY', vS.x, vS.y + 14);
  ctx.fillStyle = '#9ca3af'; ctx.fillText('CHOP', vC.x, vC.y + 14);

  // Barycentric active state dot
  const bx = (pTrend * vT.x + pSide * vS.x + pChop * vC.x) / sumP;
  const by = (pTrend * vT.y + pSide * vS.y + pChop * vC.y) / sumP;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(vT.x, vT.y); ctx.lineTo(bx, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(vS.x, vS.y); ctx.lineTo(bx, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(vC.x, vC.y); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = regCol;
  ctx.beginPath(); ctx.arc(bx, by, 7 + Math.sin(t * 4) * 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Probability bars
  const bars = [
    ['P(TREND)', pTrend, '#10b981'],
    ['P(SIDEWAY)', pSide, '#f59e0b'],
    ['P(CHOP)', pChop, '#9ca3af']
  ];
  const barX = pad + 14;
  const barW = leftW - 28;
  bars.forEach((row, idx) => {
    const ry = h - pad - 82 + idx * 24;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], barX, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = row[2];
    ctx.fillText(`${(row[1] * 100).toFixed(1)}%`, barX + barW, ry);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(barX, ry + 4, barW, 6);
    ctx.fillStyle = row[2];
    ctx.fillRect(barX, ry + 4, barW * clamp(row[1], 0, 1), 6);
  });
  ctx.restore();

  // Right Panel: Adaptive Price Curve + ER / AC + Badge + Open Trade
  ctx.save();
  roundRect(rightX, pad, rightW, h - pad * 2, 8);
  ctx.fillStyle = 'rgba(15, 23, 20, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header Badge + ER/AC
  roundRect(rightX + 12, pad + 12, 165, 32, 6);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fill();
  ctx.strokeStyle = regCol;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = regCol;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(badgeTxt, rightX + 94, pad + 32);

  const kX = rightX + 188;
  const kW = (rightW - 200) / 2;
  [['EFF RATIO', er.toFixed(3), '#10b981'], ['AUTOCORR', `${ac >= 0 ? '+' : ''}${ac.toFixed(3)}`, '#c084fc']].forEach((k, idx) => {
    const kx = kX + idx * (kW + 6);
    roundRect(kx, pad + 12, Math.max(40, kW), 32, 5);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(k[0], kx + 6, pad + 23);
    ctx.fillStyle = k[2];
    ctx.font = 'bold 12px monospace';
    ctx.fillText(k[1], kx + 6, pad + 38);
  });

  const cX = rightX + 14;
  const cY = pad + 56;
  const cW = rightW - 72;
  const cH = h - pad * 2 - (ot ? 98 : 70);

  if (prices.length >= 2) {
    let minV = Math.min(...prices);
    let maxV = Math.max(...prices);
    if (maxV - minV < 0.2) { minV -= 0.5; maxV += 0.5; }
    const span = maxV - minV;
    const toX = (i) => cX + (i / Math.max(1, prices.length - 1)) * cW;
    const toY = (v) => cY + cH - ((v - minV) / span) * cH;

    const areaGrad = safeLinGrad(0, cY, 0, cY + cH);
    areaGrad.addColorStop(0, regime === 'TREND' ? 'rgba(16,185,129,0.28)' : regime === 'SIDEWAY' ? 'rgba(245,158,11,0.28)' : 'rgba(192,132,252,0.28)');
    areaGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(toX(0), cY + cH);
    for (let i = 0; i < prices.length; i++) ctx.lineTo(toX(i), toY(prices[i]));
    ctx.lineTo(toX(prices.length - 1), cY + cH);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
      const px = toX(i), py = toY(prices[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = regCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(maxV.toFixed(2), cX + cW + 6, cY + 10);
    ctx.fillText(minV.toFixed(2), cX + cW + 6, cY + cH);
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Dang cap nhat chuoi gia regime...', cX, cY + cH / 2);
  }

  drawOpenTradeBadge(rightX + 12, h - pad - 34, rightW - 24);
  ctx.restore();
};
