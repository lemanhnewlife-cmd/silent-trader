window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SYNTHDXY = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#050e18';
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const chartW = w * 0.68 - pad;
    const chartH = h - pad * 2;
    const panelX = w * 0.68;
    const panelW = w * 0.32;

    // Parse series data
    const parseSeries = (s) => {
        if (Array.isArray(s)) return s;
        if (typeof s === 'string' && s.includes('[')) {
            try { return JSON.parse(s.split('=')[1]); } catch(e) { return []; }
        }
        return [];
    };

    const xauSeries = parseSeries(tel.xau_series);
    const dxySeries = parseSeries(tel.dxy_series);

    if (xauSeries.length > 1) {
        const minXau = Math.min(...xauSeries);
        const maxXau = Math.max(...xauSeries);
        const minDxy = Math.min(...dxySeries);
        const maxDxy = Math.max(...dxySeries);

        const getY = (val, min, max) => chartH + pad - ((val - min) / (Math.max(max - min, 0.001))) * chartH;
        const getX = (idx) => pad + (idx / (xauSeries.length - 1)) * chartW;

        // Draw Divergence Area
        ctx.beginPath();
        for (let i = 0; i < xauSeries.length; i++) {
            const x = getX(i);
            const yXau = getY(xauSeries[i], minXau, maxXau);
            const yDxy = getY(maxDxy - (dxySeries[i] - minDxy), minDxy, maxDxy); // Inverted DXY
            if (i === 0) ctx.moveTo(x, yXau); else ctx.lineTo(x, yXau);
        }
        for (let i = xauSeries.length - 1; i >= 0; i--) {
            const x = getX(i);
            const yDxy = getY(maxDxy - (dxySeries[i] - minDxy), minDxy, maxDxy);
            ctx.lineTo(x, yDxy);
        }
        ctx.closePath();
        ctx.fillStyle = num(tel.divergence) > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.fill();

        // Draw XAU Line
        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        xauSeries.forEach((v, i) => {
            const x = getX(i), y = getY(v, minXau, maxXau);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw DXY Inverted Line
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24';
        ctx.setLineDash([5, 5]);
        dxySeries.forEach((v, i) => {
            const x = getX(i), y = getY(maxDxy - (v - minDxy), minDxy, maxDxy);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Right Panel: Gauges
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('DXY TỔNG HỢP (ICE)', panelX + 10, pad);
    
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(num(tel.dxy_syn).toFixed(3), panelX + 10, pad + 35);

    ctx.font = '12px Inter';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Phân kỳ: ${num(tel.divergence).toFixed(2)}σ`, panelX + 10, pad + 60);
    ctx.fillText(`Carry Pressure: ${num(tel.carry_pressure).toFixed(3)}%`, panelX + 10, pad + 75);

    // Components List
    let comps = [];
    try { 
        if (typeof tel.components === 'string') comps = JSON.parse(tel.components.split('=')[1].replace(/'/g, '"'));
        else if (Array.isArray(tel.components)) comps = tel.components;
    } catch(e) {}

    comps.slice(0, 5).forEach((c, i) => {
        const y = pad + 110 + i * 35;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(panelX + 10, y, panelW - 20, 30);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(String(c.sym || ''), panelX + 15, y + 20);
        ctx.fillStyle = num(c.ret_pct) >= 0 ? '#10b981' : '#ef4444';
        ctx.fillText(`${num(c.ret_pct).toFixed(2)}%`, panelX + 80, y + 20);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`W: ${num(c.weight)}%`, panelX + 140, y + 20);
    });

    // Open Trade Badge
    if (ot && ot.side) {
        const badgeY = h - 40;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(panelX + 10, badgeY, panelW - 20, 25);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px Inter';
        const txt = `${ot.side.toUpperCase()} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${num(ot.floating_usd) >= 0 ? '+' : ''}$${num(ot.floating_usd).toFixed(2)}`;
        ctx.fillText(txt, panelX + 20, badgeY + 17);
    }

    // Title
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.fillRect(pad, 10, 180, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px Inter';
    ctx.fillText('SYNTHETIC DXY MONITOR', pad + 10, 24);
};