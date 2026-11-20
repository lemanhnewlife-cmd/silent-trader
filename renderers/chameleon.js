window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHAMELEON = function(ctx, w, h, st) {
  'use strict';
  const stt = st || {};
  const snap = stt.snap || {};
  const tel = snap.visual_telemetry || {};
  const ot = snap.open_trade;
  const t = stt.t || 0;
  const regime = tel.regime || 'SIDEWAY';
  const pT = Number(tel.p_trend || 0);
  const pS = Number(tel.p_sideway || 0);
  const pC = Number(tel.p_chop || 0);
  const prices = tel.prices || [];
  const er = Number(tel.efficiency_ratio || 0);
  const rho = Number(tel.autocorr || 0);
  const bg = regime === 'TREND' ? '#04130f' : regime === 'SIDEWAY' ? '#100718' : '#17080a';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const lw = w * 0.44;
  const cx = lw * 0.5;
  const cy = h * 0.5;
  const r = Math.min(lw, h) * 0.35;
  const ax = cx;
  const ay = cy - r;
  const bx = cx - r * 0.866;
  const by = cy + r * 0.5;
  const cx2 = cx + r * 0.866;
  const cy2 = cy + r * 0.5;
  const angle = t * 0.5;
  const vx = cx + r * Math.cos(angle - Math.PI / 2);
  const vy = cy + r * Math.sin(angle - Math.PI / 2);
  const px = pT * ax + pS * bx + pC * cx2;
  const py = pT * ay + pS * by + pC * cy2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx2, cy2);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const verts = [
    {x: ax, y: ay, c: '#10b981', label: 'TREND', p: pT},
    {x: bx, y: by, c: '#c084fc', label: 'SIDEWAY', p: pS},
    {x: cx2, y: cy2, c: '#ef4444', label: 'HIBERNATE', p: pC}
  ];
  verts.forEach(v => {
    ctx.fillStyle = v.c;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText(v.label + ' ' + (v.p * 100 | 0) + '%', v.x + 8, v.y + 4);
  });
  const grad = ctx.createRadialGradient(px, py, 0, px, py, 22);
  grad.addColorStop(0, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, 22, 0, Math.PI * 2);
  ctx.fill();
  const rx = lw;
  const rw = w - lw;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(rx, 0, rw, h);
  if (prices.length > 1) {
    const mn = Math.min(...prices);
    const mx = Math.max(...prices);
    const step = rw / (prices.length - 1);
    const baseY = h * 0.62;
    const scale = h * 0.22 / (mx - mn || 1);
    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = rx + i * step;
      const y = baseY - (p - mn) * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = regime === 'TREND' ? '#10b981' : regime === 'SIDEWAY' ? '#c084fc' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const badge = regime === 'TREND' ? 'TREND' : regime === 'SIDEWAY' ? 'SIDEWAY' : 'NGU DONG NE BAO';
  ctx.fillStyle = regime === 'TREND' ? '#10b981' : regime === 'SIDEWAY' ? '#c084fc' : '#ef4444';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(badge, rx + 16, 42);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '13px monospace';
  ctx.fillText('ER=' + er.toFixed(2) + '  AC=' + rho.toFixed(2), rx + 16, 66);
  if (ot) {
    ctx.fillText('OT=' + String(ot), rx + 16, 90);
  }
};