window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.ISING = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#0b0614';
    ctx.fillRect(0, 0, w, h);

    const pad = 15;
    const leftW = w * 0.58 - pad;
    const rightW = w * 0.42 - pad;
    const topH = h - 2 * pad;

    // 1. Left: 5x3 Spin Matrix
    const spinsRaw = tel.spins || '';
    let spins = [];
    try {
        if (typeof spinsRaw === 'string' && spinsRaw.includes('sample=')) {
            const jsonStr = spinsRaw.split('sample=')[1].replace(/'/g, '"');
            spins = JSON.parse(jsonStr);
        }
    } catch(e) {}

    const cols = 5, rows = 3;
    const cellW = leftW / cols;
    const cellH = topH / rows;

    for (let i = 0; i < 15; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = pad + c * cellW;
        const y = pad + r * cellH;
        const item = spins[i] || { sym: '---', spin: 0, ret_pct: 0 };

        ctx.strokeStyle = tel.phase_locked ? '#ec4899' : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(num(x + 2), num(y + 2), num(cellW - 4), num(cellH - 4));

        const centerX = x + cellW / 2;
        const centerY = y + cellH / 2;
        
        // Draw Arrow
        const isUp = item.spin > 0;
        ctx.fillStyle = isUp ? '#22c55e' : (item.spin < 0 ? '#ef4444' : '#64748b');
        ctx.beginPath();
        if (isUp) {
            ctx.moveTo(num(centerX), num(centerY - 10));
            ctx.lineTo(num(centerX - 6), num(centerY + 4));
            ctx.lineTo(num(centerX + 6), num(centerY + 4));
        } else {
            ctx.moveTo(num(centerX), num(centerY + 10));
            ctx.lineTo(num(centerX - 6), num(centerY - 4));
            ctx.lineTo(num(centerX + 6), num(centerY - 4));
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(String(item.sym), num(centerX), num(centerY - 14));
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(num(item.ret_pct).toFixed(2) + '%', num(centerX), num(centerY + 18));
    }

    // 2. Right: Magnetization Series & KPI
    const rightX = pad + leftW + pad;
    const chartH = topH * 0.5;
    
    // Mag Series Chart
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(num(rightX), num(pad), num(rightW), num(chartH));
    
    const magRaw = tel.mag_series || '';
    let magData = [];
    try {
        if (typeof magRaw === 'string' && magRaw.includes('sample=')) {
            magData = JSON.parse(magRaw.split('sample=')[1].replace(/'/g, '"'));
        }
    } catch(e) {}

    if (magData.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        magData.forEach((v, i) => {
            const px = rightX + (i / (magData.length - 1)) * rightW;
            const py = pad + (chartH / 2) - (v * chartH / 2);
            if (i === 0) ctx.moveTo(num(px), num(py));
            else ctx.lineTo(num(px), num(py));
        });
        ctx.stroke();
    }

    // KPI Area
    const kpiY = pad + chartH + 20;
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#ec4899';
    ctx.fillText('MÔ HÌNH ISING - TRẠNG THÁI HỆ THỐNG', num(rightX), num(kpiY));
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Từ hóa M: ${num(tel.magnetization).toFixed(3)}`, num(rightX), num(kpiY + 25));
    ctx.fillText(`Nhiệt độ T: ${num(tel.temperature).toFixed(2)} (Tc: ${num(tel.curie_temp).toFixed(2)})`, num(rightX), num(kpiY + 45));
    ctx.fillText(`Độ nhạy Chi: ${num(tel.susceptibility).toFixed(4)}`, num(rightX), num(kpiY + 65));
    
    if (tel.phase_locked) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('● PHASE LOCKED (ĐỒNG BỘ)', num(rightX), num(kpiY + 85));
    }

    // Open Trade Badge
    if (ot && ot.side) {
        const badgeY = h - pad - 30;
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(num(rightX), num(badgeY), num(rightW), 30);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(num(rightX), num(badgeY), num(rightW), 30);
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Arial';
        const side = String(ot.side).toUpperCase();
        const pnl = num(ot.floating_usd);
        const txt = `${side} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
        ctx.fillText(txt, num(rightX + 10), num(badgeY + 19));
    }
};