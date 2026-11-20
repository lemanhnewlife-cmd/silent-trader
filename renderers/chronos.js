window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHRONOS = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safe = (v) => Number.isFinite(v) ? v : 0;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Monte Carlo Cone
    if (tel.cone && Array.isArray(tel.cone)) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
        tel.cone.forEach((p, i) => {
            const x = safe(p.x);
            const y_high = safe(p.y_high);
            if (i === 0) ctx.moveTo(x, y_high); else ctx.lineTo(x, y_high);
        });
        for (let i = tel.cone.length - 1; i >= 0; i--) {
            ctx.lineTo(safe(tel.cone[i].x), safe(tel.cone[i].y_low));
        }
        ctx.closePath();
        ctx.fill();
    }

    // 2. Draw Prediction Path
    if (tel.path && Array.isArray(tel.path)) {
        ctx.beginPath();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        tel.path.forEach((p, i) => {
            const x = safe(p.x);
            const y = safe(p.y);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // 3. Draw Open Trade Marker
    if (ot) {
        const tx = safe(ot.x);
        const ty = safe(ot.y);
        const r = 6;
        
        const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
        grad.addColorStop(0, "#ef4444");
        grad.addColorStop(1, "transparent");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, ty, r * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(ot.side === "BUY" ? "B" : "S", tx + 8, ty + 4);
    }

    // 4. Telemetry Labels (No raw JSON)
    if (tel.conf) {
        ctx.fillStyle = "#a855f7";
        ctx.font = "12px JetBrains Mono, monospace";
        ctx.fillText(`CONF: ${safe(tel.conf)}%`, 10, 20);
    }

    // 5. Linear Gradient Background (Safe check)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, safe(h));
    bgGrad.addColorStop(0, "rgba(15, 23, 42, 0)");
    bgGrad.addColorStop(1, "rgba(15, 23, 42, 0.2)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, safe(w), safe(h));
};