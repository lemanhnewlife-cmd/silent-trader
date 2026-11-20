window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.VORTEX = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    ctx.fillStyle = '#090514';
    ctx.fillRect(0, 0, w, h);

    const leftW = w * 0.62;
    const rightX = leftW;
    const rightW = w - leftW;
    const centerX = leftW / 2;
    const centerY = h / 2;
    const scale = Math.min(leftW, h) * 0.35;

    // 1. Draw Phase Space Grid
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.1)';
    ctx.lineWidth = 1;
    [1, 2, 3].forEach(s => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, s * scale * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
        ctx.font = '10px Arial';
        ctx.fillText(s + 'σ', centerX + s * scale * 0.5 + 2, centerY - 2);
    });

    // 2. Draw Orbit (Comet effect)
    const ox = Array.isArray(tel.orbit_x) ? tel.orbit_x.map(v => num(v, 0)) : [];
    const oy = Array.isArray(tel.orbit_y) ? tel.orbit_y.map(v => num(v, 0)) : [];
    const nOrb = Math.min(ox.length, oy.length);

    if (nOrb > 1) {
        const ptScale = scale * 0.5;
        for (let i = 1; i < nOrb; i++) {
            const alpha = i / nOrb;
            ctx.beginPath();
            ctx.strokeStyle = alpha > 0.8 ? '#22d3ee' : '#c084fc';
            ctx.globalAlpha = alpha * 0.75;
            ctx.lineWidth = 1 + alpha * 2.5;
            ctx.moveTo(centerX + clamp(ox[i - 1], -3.2, 3.2) * ptScale, centerY - clamp(oy[i - 1], -3.2, 3.2) * ptScale);
            ctx.lineTo(centerX + clamp(ox[i], -3.2, 3.2) * ptScale, centerY - clamp(oy[i], -3.2, 3.2) * ptScale);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        // Head vector
        const lastX = centerX + clamp(ox[nOrb - 1], -3.2, 3.2) * ptScale;
        const lastY = centerY - clamp(oy[nOrb - 1], -3.2, 3.2) * ptScale;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Right Panel - KPIs
    const drawBadge = (x, y, label, val, color) => {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, rightW - 20, 45);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(label, x + 10, y + 18);
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(val, x + 10, y + 38);
    };

    const dir = tel.vortex_dir || 'N/A';
    drawBadge(rightX + 10, 20, 'HƯỚNG XOAY (VORTEX)', dir, dir === 'CCW' ? '#22d3ee' : '#f472b6');
    drawBadge(rightX + 10, 75, 'MÔ-MEN GÓC (L)', num(tel.angular_mom).toFixed(4), '#c084fc');
    drawBadge(rightX + 10, 130, 'BÁN KÍNH QUỸ ĐẠO (R)', num(tel.radius).toFixed(2), '#c084fc');
    drawBadge(rightX + 10, 185, 'ĐỘ CONG (CURVATURE)', num(tel.curvature).toFixed(4), '#22d3ee');

    // Open Trade Badge
    if (ot) {
        const otY = 250;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        ctx.strokeRect(rightX + 10, otY, rightW - 20, 50);
        ctx.fillRect(rightX + 10, otY, rightW - 20, 50);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        const sideStr = (ot.side || 'BUY').toUpperCase();
        const pnl = num(ot.floating_usd);
        const txt = `${sideStr} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
        ctx.fillText(txt, rightX + 20, otY + 30);
    }

    // Border warning
    ctx.strokeStyle = '#22d3ee';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, scale * 1.8, scale * 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
};