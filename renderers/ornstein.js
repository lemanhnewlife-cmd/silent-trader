window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.ORNSTEIN = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#04120e';
    ctx.fillRect(0, 0, w, h);

    const leftW = w * 0.34;
    const rightW = w * 0.66;
    const mu = num(tel.mu);
    const theta = num(tel.theta);
    const halfLife = num(tel.half_life);
    const ouZ = num(tel.ou_z);
    const prices = Array.isArray(tel.prices) ? tel.prices : [];
    const muSeries = Array.isArray(tel.mu_series) ? tel.mu_series : [];

    // --- LEFT ZONE: Physics & Half-Life ---
    const centerX = leftW / 2;
    const centerY = h * 0.4;
    
    // Spring Physics (Visualizing Mean Reversion)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const springHeight = clamp(50 + ouZ * 30, 20, 120);
    for (let i = 0; i <= 20; i++) {
        const sy = centerY - 60 + (i * springHeight) / 20;
        const sx = centerX + Math.sin(i + t * 0.005) * 15;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    
    // Particle (Price)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX + Math.sin(20 + t * 0.005) * 15, centerY - 60 + springHeight, 6, 0, Math.PI * 2);
    ctx.fill();

    // Half-Life Gauge
    const gx = centerX, gy = h * 0.85, gr = 50;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, Math.PI, 0);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 8;
    ctx.stroke();

    const hlAngle = Math.PI + (clamp(halfLife, 0, 40) / 40) * Math.PI;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, Math.PI, hlAngle);
    ctx.strokeStyle = halfLife > 26 ? '#ef4444' : '#10b981';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(halfLife > 26 ? 'BẪY TREND - KHÓA' : 'TÍNH DỪNG', gx, gy - 15);
    ctx.font = '10px sans-serif';
    ctx.fillText(`HL: ${halfLife.toFixed(1)} nến`, gx, gy + 12);

    // --- RIGHT ZONE: Chart & KPIs ---
    const chartX = leftW + 20, chartY = 40, chartW = rightW - 40, chartH = h - 100;
    if (prices.length > 1) {
        const pMin = Math.min(...prices, ...muSeries), pMax = Math.max(...prices, ...muSeries);
        const pR = (pMax - pMin) || 1;
        
        const getX = (i) => chartX + (i / (prices.length - 1)) * chartW;
        const getY = (p) => chartY + chartH - ((p - pMin) / pR) * chartH;

        // Mu Series (Dashed)
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        muSeries.forEach((p, i) => { if(i===0) ctx.moveTo(getX(i), getY(p)); else ctx.lineTo(getX(i), getY(p)); });
        ctx.stroke();
        ctx.setLineDash([]);

        // Price Line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        prices.forEach((p, i) => { if(i===0) ctx.moveTo(getX(i), getY(p)); else ctx.lineTo(getX(i), getY(p)); });
        ctx.stroke();
    }

    // KPIs
    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`μ: ${mu.toFixed(2)}`, chartX, h - 35);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`θ: ${theta.toFixed(4)}`, chartX + 100, h - 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Edge: $${num(tel.expected_edge_usd).toFixed(2)}`, chartX + 200, h - 35);

    // Open Trade Badge
    if (ot && ot.side) {
        const badgeW = 220, badgeH = 24, bx = w - badgeW - 10, by = 10;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fillRect(bx, by, badgeW, badgeH);
        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(bx, by, badgeW, badgeH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        const txt = `${ot.side.toUpperCase()} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${num(ot.floating_usd) >= 0 ? '+' : ''}$${num(ot.floating_usd).toFixed(2)}`;
        ctx.fillText(txt, bx + badgeW / 2, by + 16);
    }
};