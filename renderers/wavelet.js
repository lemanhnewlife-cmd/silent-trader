window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.WAVELET = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#040d18';
    ctx.fillRect(0, 0, w, h);

    const pad = 15;
    const mainW = w * 0.72;
    const sideW = w * 0.28;
    const topH = h * 0.52;
    const botH = h * 0.48;

    // Parse data
    const parseList = (s) => {
        if (Array.isArray(s)) return s;
        if (typeof s !== 'string') return [];
        const match = s.match(/\[(.*?)\]/);
        if (!match) return [];
        return match[1].split(',').map(v => parseFloat(v.trim())).filter(Number.isFinite);
    };

    const prices = parseList(tel.prices);
    const a3 = parseList(tel.a3);
    const d3 = parseList(tel.d3);
    const d2 = parseList(tel.d2);
    const d1 = parseList(tel.d1);

    // 1. Draw Price & A3 Trend (Top Left)
    if (prices.length > 1) {
        const minP = Math.min(...prices, ...a3);
        const maxP = Math.max(...prices, ...a3);
        const rng = (maxP - minP) || 1;
        const getY = (v) => topH - pad - ((v - minP) / rng) * (topH - 2 * pad);
        const getX = (i) => pad + (i / (prices.length - 1)) * (mainW - 2 * pad);

        // Price Line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        prices.forEach((p, i) => i === 0 ? ctx.moveTo(getX(i), getY(p)) : ctx.lineTo(getX(i), getY(p)));
        ctx.stroke();

        // A3 Trend Line
        ctx.beginPath();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ea5e9';
        a3.forEach((p, i) => i === 0 ? ctx.moveTo(getX(i), getY(p)) : ctx.lineTo(getX(i), getY(p)));
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // 2. Scalogram (Bottom Left)
    const drawHeatRow = (data, yOffset, rowH, label) => {
        if (!data.length) return;
        const cellW = (mainW - 2 * pad) / data.length;
        const maxAbs = Math.max(...data.map(Math.abs)) || 1;
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Arial';
        ctx.fillText(label, 5, yOffset + rowH / 2 + 4);

        data.forEach((v, i) => {
            const intensity = clamp(Math.abs(v) / maxAbs, 0, 1);
            const r = Math.floor(intensity * 168 + (1-intensity)*14);
            const g = Math.floor(intensity * 85 + (1-intensity)*13);
            const b = Math.floor(intensity * 247 + (1-intensity)*24);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(pad + i * cellW, yOffset + 2, cellW - 1, rowH - 4);
        });
    };

    const rowH = (botH - pad) / 3;
    drawHeatRow(d3, topH + 0 * rowH, rowH, 'D3');
    drawHeatRow(d2, topH + 1 * rowH, rowH, 'D2');
    drawHeatRow(d1, topH + 2 * rowH, rowH, 'D1');

    // 3. KPI Panel (Right)
    const startX = mainW + 10;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
    ctx.fillRect(startX, pad, sideW - 20, h - 2 * pad);
    
    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('WAVELET ANALYSIS', startX + 10, pad + 25);

    const drawMetric = (label, val, unit, y) => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Arial';
        ctx.fillText(label, startX + 10, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${num(val).toFixed(2)}${unit}`, startX + 10, y + 18);
    };

    drawMetric('Độ dốc A3 (Slope)', tel.a3_slope, '°', pad + 60);
    drawMetric('Năng lượng D2', tel.d2_energy, '', pad + 105);
    drawMetric('Nhiễu D1 (Noise)', tel.d1_noise, '', pad + 150);

    // SNR Bar
    const snr = num(tel.snr_db);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Tỷ số SNR (dB)', startX + 10, pad + 195);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(startX + 10, pad + 205, sideW - 40, 8);
    const snrW = clamp(snr / 40, 0, 1) * (sideW - 40);
    const grad = safeLinGrad(startX, 0, startX + sideW, 0);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = grad;
    ctx.fillRect(startX + 10, pad + 205, snrW, 8);

    // Open Trade Badge
    if (ot && ot.side) {
        const isBuy = ot.side.toUpperCase() === 'BUY';
        const profit = num(ot.floating_usd);
        ctx.fillStyle = isBuy ? '#10b981' : '#ef4444';
        ctx.roundRect ? ctx.beginPath() || ctx.roundRect(startX + 5, h - 50, sideW - 30, 35, 4) || ctx.fill() : ctx.fillRect(startX + 5, h - 50, sideW - 30, 35);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        const txt = `${ot.side} ${num(ot.lot)} @ ${num(ot.open_price).toFixed(2)}`;
        ctx.fillText(txt, startX + 12, h - 35);
        ctx.fillText(`${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, startX + 12, h - 20);
    }
};