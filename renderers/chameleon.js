window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.CHAMELEON = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safeX = (val) => Number.isFinite(val) ? val : 0;
    const safeY = (val) => Number.isFinite(val) ? val : 0;
    const safeR = (val) => (Number.isFinite(val) && val > 0) ? val : 1;

    ctx.clearRect(0, 0, w, h);

    if (tel.cone && Array.isArray(tel.cone)) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1;
        tel.cone.forEach((p, i) => {
            const x = safeX(p.x);
            const y = safeY(p.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    if (tel.p10 && tel.p90 && tel.p10.length > 0) {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0, 0, safeX(w), 0);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
        ctx.fillStyle = grad;
        
        for (let i = 0; i < tel.p10.length; i++) {
            const x = safeX(tel.p10[i].x);
            const y = safeY(tel.p10[i].y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        for (let i = tel.p90.length - 1; i >= 0; i--) {
            ctx.lineTo(safeX(tel.p90[i].x), safeY(tel.p90[i].y));
        }
        ctx.closePath();
        ctx.fill();
    }

    if (ot) {
        const ox = safeX(ot.x || w / 2);
        const oy = safeY(ot.y || h / 2);
        ctx.beginPath();
        ctx.arc(ox, oy, safeR(5), 0, Math.PI * 2);
        ctx.fillStyle = ot.type === 'buy' ? '#22c55e' : '#ef4444';
        ctx.fill();
        
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffffff';
        const priceLabel = ot.price ? ot.price.toFixed(2) : '0.00';
        ctx.fillText(ot.type.toUpperCase() + ' ' + priceLabel, ox + 8, oy + 3);
    }

    if (tel.signals && Array.isArray(tel.signals)) {
        tel.signals.forEach(sig => {
            const sx = safeX(sig.x);
            const sy = safeY(sig.y);
            ctx.beginPath();
            ctx.arc(sx, sy, safeR(3), 0, Math.PI * 2);
            ctx.fillStyle = sig.conf > 70 ? '#38bdf8' : '#64748b';
            ctx.fill();
            
            if (sig.conf > 50) {
                ctx.font = '9px Arial';
                ctx.fillText(Math.round(sig.conf) + '%', sx - 10, sy - 8);
            }
        });
    }

    if (Number.isFinite(st.cursor_x) && Number.isFinite(st.cursor_y)) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(st.cursor_x, 0); ctx.lineTo(st.cursor_x, h);
        ctx.moveTo(0, st.cursor_y); ctx.lineTo(w, st.cursor_y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
};