window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.QUANTUM = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#060718';
    ctx.fillRect(0, 0, w, h);

    const padding = 20;
    const leftW = w * 0.68 - padding;
    const rightW = w * 0.32 - padding;
    const chartH = h - padding * 2;

    // 1. Left: Potential Well & Wave Function
    const bins = Array.isArray(tel.potential_bins) ? tel.potential_bins : (typeof tel.potential_bins === 'string' ? JSON.parse(tel.potential_bins.replace('list[16] sample=', '')) : []);
    const psi = Array.isArray(tel.psi_sq) ? tel.psi_sq : (typeof tel.psi_sq === 'string' ? JSON.parse(tel.psi_sq.replace('list[16] sample=', '')) : []);
    
    const binCount = 16;
    const binW = leftW / binCount;

    // Draw Potential Bins
    bins.forEach((val, i) => {
        const bh = clamp(num(val) * chartH, 2, chartH);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fillRect(padding + i * binW, padding + chartH - bh, binW - 2, bh);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.strokeRect(padding + i * binW, padding + chartH - bh, binW - 2, bh);
    });

    // Draw Wave Function (Psi^2)
    if (psi.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        psi.forEach((val, i) => {
            const px = padding + i * binW + binW / 2;
            const py = padding + chartH - clamp(num(val) * chartH * 0.8, 0, chartH);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Price Position Marker
    const pPos = num(tel.price_pos_norm, 0.5);
    const markerX = padding + pPos * leftW;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(markerX, padding + chartH / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Right: Telemetry & KPI
    const panelX = w * 0.68 + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(panelX, padding, rightW, chartH);

    // Tunneling Probability Gauge
    const prob = num(tel.tunnel_prob, 0);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('XÁC SUẤT XUYÊN HẦM', panelX + 10, padding + 25);
    
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(panelX + 10, padding + 35, rightW - 20, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(panelX + 10, padding + 35, (rightW - 20) * (prob / 100), 10);
    ctx.font = 'bold 18px monospace';
    ctx.fillText(prob.toFixed(1) + '%', panelX + 10, padding + 65);

    // State Badge
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(panelX + 10, padding + 80, rightW - 20, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(tel.state_mode || 'QUANTUM_IDLE'), panelX + rightW / 2, padding + 96);
    ctx.textAlign = 'left';

    // KPIs
    const kpis = [
        { l: 'Động năng (KE)', v: num(tel.kinetic_energy).toFixed(3) },
        { l: 'Rào cản (V)', v: num(tel.barrier_height).toFixed(3) },
        { l: 'Tâm hố', v: num(tel.well_center).toFixed(2) }
    ];
    kpis.forEach((k, i) => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(k.l, panelX + 10, padding + 130 + i * 35);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(k.v, panelX + 10, padding + 145 + i * 35);
    });

    // Open Trade Badge
    if (ot && ot.side) {
        const grad = safeLinGrad(panelX, h - 50, panelX, h - 20);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(panelX + 5, h - 55, rightW - 10, 35);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(panelX + 5, h - 55, rightW - 10, 35);
        
        ctx.fillStyle = ot.side.toUpperCase() === 'BUY' ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        const profit = num(ot.floating_usd);
        const txt = `${ot.side.toUpperCase()} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}$`;
        ctx.fillText(txt, panelX + 12, h - 33);
    }
};