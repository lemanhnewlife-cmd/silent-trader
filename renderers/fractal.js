window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.FRACTAL = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#070816';
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const leftW = w * 0.38;
    const rightW = w * 0.62;

    // 1. LEFT: Log-Log Plot & Higuchi D
    const logK = Array.isArray(tel.log_k) ? tel.log_k : [];
    const logLk = Array.isArray(tel.log_lk) ? tel.log_lk : [];
    const dVal = num(tel.higuchi_d, 1.0);

    ctx.strokeStyle = 'rgba(129, 140, 248, 0.2)';
    ctx.strokeRect(pad, pad, leftW - pad * 1.5, h * 0.6);
    
    if (logK.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        const minX = Math.min(...logK), maxX = Math.max(...logK);
        const minY = Math.min(...logLk), maxY = Math.max(...logLk);
        
        logK.forEach((kx, i) => {
            const lx = logLk[i];
            const px = pad + ((kx - minX) / (maxX - minX || 1)) * (leftW - pad * 1.5 - 20);
            const py = pad + h * 0.6 - ((lx - minY) / (maxY - minY || 1)) * (h * 0.6 - 20);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(px - 2, py - 2, 4, 4);
        });
        ctx.stroke();
    }

    // D-Scale
    const scaleY = pad + h * 0.6 + 40;
    const scaleW = leftW - pad * 2;
    const grad = safeLinGrad(pad, 0, pad + scaleW, 0);
    grad.addColorStop(0, '#34d399');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(pad, scaleY, scaleW, 8);
    const dPos = pad + clamp((dVal - 1) / 1, 0, 1) * scaleW;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(dPos, scaleY - 5); ctx.lineTo(dPos - 5, scaleY - 12); ctx.lineTo(dPos + 5, scaleY - 12); ctx.fill();
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`D = ${dVal.toFixed(4)}`, pad, scaleY - 20);
    
    // Regime Badge
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(pad, scaleY + 25, 120, 24);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px Inter';
    ctx.fillText(String(tel.regime || 'N/A'), pad + 10, scaleY + 41);

    // 2. RIGHT: Prices & D-Series
    const prices = Array.isArray(tel.prices) ? tel.prices : [];
    const dSeries = Array.isArray(tel.d_series) ? tel.d_series : [];
    const rightX = leftW + 10;

    // Price Chart (Top Right)
    if (prices.length > 1) {
        const pMin = Math.min(...prices), pMax = Math.max(...prices);
        ctx.beginPath();
        ctx.strokeStyle = '#34d399';
        prices.forEach((p, i) => {
            const px = rightX + (i / (prices.length - 1)) * (rightW - pad - 20);
            const py = pad + (1 - (p - pMin) / (pMax - pMin || 1)) * (h * 0.4);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
    }

    // D-Series (Bottom Right)
    const dsY = pad + h * 0.5;
    const dsH = h * 0.35;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(rightX, dsY, rightW - pad - 20, dsH);
    if (dSeries.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#818cf8';
        dSeries.forEach((d, i) => {
            const px = rightX + (i / (dSeries.length - 1)) * (rightW - pad - 20);
            const py = dsY + dsH - clamp((d - 1) / 1, 0, 1) * dsH;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
        // Thresholds
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        [1.42, 1.65].forEach(thr => {
            const ty = dsY + dsH - clamp((thr - 1) / 1, 0, 1) * dsH;
            ctx.beginPath(); ctx.moveTo(rightX, ty); ctx.lineTo(rightX + rightW - pad - 20, ty); ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    // Lyapunov & Trade Badge
    ctx.fillStyle = '#fff';
    ctx.font = '12px Inter';
    ctx.fillText(`Lyapunov: ${num(tel.lyapunov).toFixed(6)}`, rightX, h - 20);

    if (ot) {
        const otTxt = `${ot.side} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${num(ot.floating_usd) >= 0 ? '+' : ''}$${num(ot.floating_usd).toFixed(2)}`;
        ctx.fillStyle = '#34d399';
        ctx.fillRect(w - 240, h - 35, 220, 25);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(otTxt, w - 230, h - 18);
    }

    ctx.fillStyle = 'rgba(129, 140, 248, 0.8)';
    ctx.font = 'bold 16px Inter';
    ctx.fillText("FRACTAL ENGINE — PHÂN TÍCH ĐA THANG ĐO", rightX, pad - 10);
};