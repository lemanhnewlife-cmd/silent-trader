window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.KALMAN = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#040b14';
    ctx.fillRect(0, 0, w, h);

    const padding = 40;
    const chartW = w * 0.7 - padding;
    const chartH = h - padding * 2;
    const sideW = w * 0.3;

    const raw = Array.isArray(tel.raw_series) ? tel.raw_series : [];
    const kf = Array.isArray(tel.kf_series) ? tel.kf_series : [];
    const fc = Array.isArray(tel.forecast) ? tel.forecast : [];

    if (raw.length > 0) {
        const allVals = [...raw, ...kf, ...fc].filter(Number.isFinite);
        const minV = Math.min(...allVals) * 0.9998;
        const maxV = Math.max(...allVals) * 1.0002;
        const range = maxV - minV || 1;

        const getX = (idx, total) => padding + (idx / (total - 1)) * chartW;
        const getY = (val) => padding + chartH - ((val - minV) / range) * chartH;

        // Draw Raw Series (Dots)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        raw.forEach((v, i) => {
            ctx.beginPath();
            ctx.arc(getX(i, raw.length), getY(v), 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Kalman Series (Glow Line)
        if (kf.length > 1) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            kf.forEach((v, i) => {
                const px = getX(i, kf.length);
                const py = getY(v);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw Forecast (Dashed)
        if (fc.length > 0) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#10b981';
            ctx.beginPath();
            const startIdx = kf.length - 1;
            ctx.moveTo(getX(startIdx, kf.length), getY(kf[startIdx]));
            fc.forEach((v, i) => {
                const px = getX(startIdx + i + 1, kf.length + fc.length);
                const py = getY(v);
                ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Sidebar Metrics
    const drawVector = (label, val, x, y, width, color) => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(label, x, y - 5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, width, 8);
        const norm = clamp(val * 50, -width / 2, width / 2);
        ctx.fillStyle = color;
        ctx.fillRect(x + width / 2, y, norm, 8);
    };

    const sideX = w * 0.7 + 20;
    drawVector('VẬN TỐC (V)', num(tel.velocity), sideX, 60, 80, '#06b6d4');
    drawVector('GIA TỐC (A)', num(tel.accel), sideX, 90, 80, '#f43f5e');
    drawVector('ĐỘ GIẬT (J)', num(tel.jerk), sideX, 120, 80, '#fbbf24');

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Gain: ${num(tel.kalman_gain).toFixed(4)}`, sideX, 160);
    ctx.fillText(`Res: ${num(tel.residual).toFixed(2)}`, sideX, 180);

    if (ot) {
        const side = (ot.side || 'BUY').toUpperCase();
        const pnl = num(ot.floating_usd);
        ctx.fillStyle = side === 'BUY' ? '#10b981' : '#f43f5e';
        ctx.roundRect(sideX, 210, 100, 40, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${side} ${num(ot.lot)} @ ${num(ot.open_price).toFixed(2)}`, sideX + 5, 225);
        ctx.fillText(`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, sideX + 5, 240);
    }

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('KALMAN BALLISTIC', padding, 25);
};