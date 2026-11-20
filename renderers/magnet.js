window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.MAGNET = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safe = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, safe(h));
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, safe(w), safe(h));

    // 2. Draw Magnet Core (Radial)
    const centerX = safe(w / 2);
    const centerY = safe(h / 2);
    const radius = safe(Math.min(w, h) * 0.3);
    
    const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    radGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Telemetry Lines
    if (tel.points && Array.isArray(tel.points)) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        tel.points.forEach((p, i) => {
            const px = safe(p.x * w);
            const py = safe(p.y * h);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
    }

    // 4. Draw Open Trade Indicator (No raw JSON)
    if (ot) {
        const otX = safe(w * 0.8);
        const otY = safe(h * 0.2);
        ctx.fillStyle = ot.type === 'buy' ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 14px monospace';
        const label = (ot.type || 'N/A').toUpperCase() + ' @ ' + safe(ot.price).toFixed(2);
        ctx.fillText(label, otX, otY);
        
        // Draw trade marker
        ctx.beginPath();
        ctx.arc(otX - 10, otY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. Draw Telemetry Numeric Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial';
    const conf = safe(tel.confidence, 0);
    ctx.fillText("CONF: " + conf.toFixed(1) + "%", 10, 20);
    const attr = safe(tel.attr_value, 0);
    ctx.fillText("ATTR: " + attr.toFixed(4), 10, 35);
};