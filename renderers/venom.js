window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.VENOM = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safe = (val, fallback = 0) => Number.isFinite(val) ? val : fallback;

    ctx.clearRect(0, 0, w, h);

    // Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, safe(h));
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, safe(w), safe(h));

    // Draw Telemetry Data
    if (tel.points && Array.isArray(tel.points)) {
        ctx.beginPath();
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        tel.points.forEach((p, i) => {
            const px = safe(p.x);
            const py = safe(p.y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Draw Probability Cone
        if (tel.upper && tel.lower) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
            tel.upper.forEach((p, i) => {
                const px = safe(p.x);
                const py = safe(p.y);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            for (let i = tel.lower.length - 1; i >= 0; i--) {
                ctx.lineTo(safe(tel.lower[i].x), safe(tel.lower[i].y));
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    // Draw Open Trade Marker
    if (ot && ot.price_y) {
        const ty = safe(ot.price_y);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = ot.type === 'buy' ? '#00ff88' : '#ff4444';
        ctx.moveTo(0, ty);
        ctx.lineTo(safe(w), ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label instead of raw JSON
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        const label = (ot.profit || 0).toFixed(2);
        ctx.fillText(label, 10, ty - 5);
    }

    // Draw Visual Telemetry Nodes
    if (tel.nodes) {
        tel.nodes.forEach(n => {
            const nx = safe(n.x);
            const ny = safe(n.y);
            const nr = safe(n.r, 3);
            
            const nodeGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
            nodeGrad.addColorStop(0, '#fff');
            nodeGrad.addColorStop(1, '#00f2ff');
            
            ctx.beginPath();
            ctx.fillStyle = nodeGrad;
            ctx.arc(nx, ny, nr, 0, Math.PI * 2);
            ctx.fill();
            
            if (n.val !== undefined) {
                ctx.fillStyle = '#00f2ff';
                ctx.fillText(Number(n.val).toFixed(1), nx + 5, ny - 5);
            }
        });
    }
};