window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.ENTROPY = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safe = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Entropy Background Gradient
    const ent = safe(tel.entropy_value, 0.5);
    const grd = ctx.createLinearGradient(0, 0, 0, safe(h));
    grd.addColorStop(0, `rgba(20, 20, 30, 0.8)`);
    grd.addColorStop(1, `rgba(${safe(ent * 100)}, 10, 40, 0.9)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, safe(w), safe(h));

    // 2. Draw Probability Cone (Monte Carlo)
    if (Array.isArray(tel.cone_paths)) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
        ctx.lineWidth = 1;
        tel.cone_paths.forEach(path => {
            if (!Array.isArray(path)) return;
            ctx.moveTo(safe(path[0]?.x), safe(path[0]?.y));
            path.forEach(pt => {
                ctx.lineTo(safe(pt.x), safe(pt.y));
            });
        });
        ctx.stroke();
    }

    // 3. Draw Open Trade Marker
    if (ot && ot.entry_price) {
        const ty = safe(ot.y_coord);
        const side_color = ot.side === 'BUY' ? '#22c55e' : '#ef4444';
        
        // Radial highlight
        const rgrd = ctx.createRadialGradient(safe(w/2), ty, 0, safe(w/2), ty, 50);
        rgrd.addColorStop(0, side_color + '44');
        rgrd.addColorStop(1, 'transparent');
        ctx.fillStyle = rgrd;
        ctx.fillRect(0, safe(ty - 50), safe(w), 100);

        // Entry Line
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = side_color;
        ctx.moveTo(0, ty);
        ctx.lineTo(safe(w), ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = side_color;
        ctx.font = '10px monospace';
        ctx.fillText(`${ot.side} ${safe(ot.lots).toFixed(2)}`, 10, safe(ty - 5));
    }

    // 4. Telemetry Indicators
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    const metrics = [
        { l: 'ENT', v: ent.toFixed(4) },
        { l: 'CONF', v: (safe(tel.confidence) * 100).toFixed(1) + '%' },
        { l: 'VOL', v: safe(tel.volatility).toFixed(2) }
    ];
    
    metrics.forEach((m, i) => {
        ctx.fillText(`${m.l}: ${m.v}`, 15, 25 + (i * 18));
    });

    // 5. Center Pulse
    const pulseR = 5 + (Math.sin(Date.now() / 500) * 2);
    ctx.beginPath();
    ctx.arc(safe(w / 2), safe(h / 2), safe(pulseR), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
};