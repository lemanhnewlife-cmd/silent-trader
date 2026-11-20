window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SEISMOGRAPH = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const f = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Gradient
    const bgGrd = ctx.createLinearGradient(0, 0, 0, f(h));
    bgGrd.addColorStop(0, '#0f172a');
    bgGrd.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, f(w), f(h));

    // 2. Draw Seismograph Waves (Telemetry)
    if (tel.waves && Array.isArray(tel.waves)) {
        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        tel.waves.forEach((pt, i) => {
            const x = f((i / tel.waves.length) * w);
            const y = f(h / 2 + pt * (h / 4));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // 3. Draw Open Trade Marker
    if (ot && ot.entry_price) {
        const entryY = f(h / 2);
        const pulseRadius = f(10 + Math.sin(Date.now() / 200) * 5);
        
        const radGrd = ctx.createRadialGradient(f(w/2), entryY, 0, f(w/2), entryY, pulseRadius);
        radGrd.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
        radGrd.addColorStop(1, 'rgba(245, 158, 11, 0)');
        
        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(f(w/2), entryY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label instead of raw JSON
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        const label = (ot.type || 'TRADE') + ' @ ' + f(ot.entry_price).toFixed(2);
        ctx.fillText(label, f(w/2), entryY - 20);
    }

    // 4. Telemetry Status Indicators
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const statusText = 'VOL: ' + f(tel.volatility).toFixed(4) + ' | SENS: ' + f(tel.sensitivity).toFixed(2);
    ctx.fillText(statusText, 10, f(h - 10));
};