window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.HAWKES = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const safeLinGrad = (x0, y0, x1, y1, stops) => {
        const g = ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));
        stops.forEach(s => g.addColorStop(clamp(num(s.p), 0, 1), s.c));
        return g;
    };

    // Background
    ctx.fillStyle = '#100805';
    ctx.fillRect(0, 0, w, h);

    const padding = 20;
    const chartW = w * 0.65;
    const panelW = w * 0.3;
    const centerY = h / 2;

    // 1. Draw Intensity Chart (Left 70%)
    const buyInt = Array.isArray(tel.buy_intensity) ? tel.buy_intensity : (typeof tel.buy_intensity === 'string' && tel.buy_intensity.startsWith('list') ? JSON.parse(tel.buy_intensity.split('=')[1]) : []);
    const sellInt = Array.isArray(tel.sell_intensity) ? tel.sell_intensity : (typeof tel.sell_intensity === 'string' && tel.sell_intensity.startsWith('list') ? JSON.parse(tel.sell_intensity.split('=')[1]) : []);

    const drawWave = (data, color, isUp) => {
        if (!data.length) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const step = chartW / (data.length - 1);
        data.forEach((v, i) => {
            const x = padding + i * step;
            const val = num(v) * 80;
            const y = isUp ? centerY - val : centerY + val;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Fill area
        ctx.lineTo(padding + (data.length - 1) * step, centerY);
        ctx.lineTo(padding, centerY);
        ctx.fillStyle = color + '22';
        ctx.fill();
    };

    drawWave(buyInt, '#22c55e', true);
    drawWave(sellInt, '#ef4444', false);

    // Axis
    ctx.strokeStyle = '#332015';
    ctx.beginPath();
    ctx.moveTo(padding, centerY); ctx.lineTo(padding + chartW, centerY);
    ctx.stroke();

    // 2. Branching Ratio Gauge (Right 30%)
    const gaugeX = w - panelW / 2 - padding;
    const gaugeY = h * 0.45;
    const br = num(tel.branching_ratio, 0);
    
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, 50, Math.PI, 0);
    ctx.strokeStyle = '#332015';
    ctx.lineWidth = 8;
    ctx.stroke();

    const brAngle = Math.PI + (clamp(br, 0, 1.4) / 1.4) * Math.PI;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, 50, Math.PI, brAngle);
    ctx.strokeStyle = br > 1.0 ? '#f97316' : '#22c55e';
    ctx.stroke();

    // Criticality Alert
    if (tel.criticality === true && Math.floor(t * 2) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('TỚI HẠN BÙNG NỔ', gaugeX, gaugeY - 70);
    }

    // Stats Panel
    ctx.textAlign = 'left';
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#888';
    const statsY = gaugeY + 40;
    ctx.fillText(`λ+ (Buy): ${num(tel.lambda_buy).toFixed(4)}`, gaugeX - 60, statsY);
    ctx.fillText(`λ- (Sell): ${num(tel.lambda_sell).toFixed(4)}`, gaugeX - 60, statsY + 18);
    ctx.fillText(`Imbalance: ${num(tel.imbalance).toFixed(3)}`, gaugeX - 60, statsY + 36);
    ctx.fillText(`Branching: ${br.toFixed(2)}`, gaugeX - 60, statsY + 54);

    // Open Trade Badge
    if (ot && ot.side) {
        const badgeW = 220;
        const badgeH = 24;
        const bx = padding;
        const by = h - padding - badgeH;
        ctx.fillStyle = '#1e1510';
        ctx.roundRect(bx, by, badgeW, badgeH, 4);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.stroke();
        
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 11px Inter';
        const profit = num(ot.floating_usd);
        const sign = profit >= 0 ? '+' : '';
        ctx.fillText(`${ot.side} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${sign}$${profit.toFixed(2)}`, bx + 10, by + 16);
    }

    // Title
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('HAWKES INTENSITY CLUSTER', padding, padding + 10);
};