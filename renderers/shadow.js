window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SHADOW = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry;
    const ot = st.snap.open_trade;
    if (!tel) return;

    const safeX = (val) => Number.isFinite(val) ? val : 0;
    const safeY = (val) => Number.isFinite(val) ? val : 0;
    const safeR = (val) => (Number.isFinite(val) && val > 0) ? val : 1;

    // Draw Shadow Zones
    if (tel.shadow_zones && Array.isArray(tel.shadow_zones)) {
        tel.shadow_zones.forEach(z => {
            const x = safeX(z.x);
            const y = safeY(z.y);
            const rw = safeX(z.w);
            const rh = safeY(z.h);
            
            ctx.save();
            const grad = ctx.createLinearGradient(x, y, x + rw, y);
            grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
            grad.addColorStop(0.5, z.type === 'bull' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)');
            grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
            
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, rw, rh);
            ctx.restore();
        });
    }

    // Draw Prediction Cone
    if (tel.cone && Array.isArray(tel.cone.points)) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.setLineDash([5, 5]);
        tel.cone.points.forEach((p, i) => {
            const px = safeX(p.x);
            const py = safeY(p.y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw Open Trade Marker (No JSON debug)
    if (ot && ot.entry_px) {
        const ox = safeX(ot.x);
        const oy = safeY(ot.y);
        const or = safeR(ot.r || 5);

        ctx.beginPath();
        ctx.arc(ox, oy, or, 0, Math.PI * 2);
        ctx.fillStyle = ot.side === 'buy' ? '#22c55e' : '#ef4444';
        ctx.fill();

        // Compact Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(`${ot.side.toUpperCase()} ${ot.lots}`, ox + or + 2, oy + 4);
    }

    // Telemetry Label
    if (tel.conf) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`CONF: ${tel.conf}% | VOL: ${tel.vol_zscore || 0}`, 10, h - 20);
    }
};