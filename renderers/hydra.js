window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.HYDRA = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const f = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;

    ctx.clearRect(0, 0, w, h);

    if (tel.zones) {
        tel.zones.forEach(z => {
            const x = f(z.x), y = f(z.y), rw = f(z.w), rh = f(z.h);
            const grad = ctx.createLinearGradient(x, y, x, y + rh);
            grad.addColorStop(0, z.color || 'rgba(255,0,0,0.2)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, rw, rh);
            
            ctx.fillStyle = 'white';
            ctx.font = '10px monospace';
            ctx.fillText(f(z.val).toFixed(1), x + 2, y + 10);
        });
    }

    if (tel.paths) {
        tel.paths.forEach(p => {
            ctx.beginPath();
            ctx.strokeStyle = p.color || '#38bdf8';
            ctx.lineWidth = f(p.width, 1);
            p.points.forEach((pt, i) => {
                const px = f(pt.x), py = f(pt.y);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();
        });
    }

    if (ot) {
        const ox = f(ot.x), oy = f(ot.y);
        ctx.beginPath();
        ctx.arc(ox, oy, f(ot.r, 5), 0, Math.PI * 2);
        ctx.fillStyle = ot.side === 'buy' ? '#22c55e' : '#ef4444';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(f(ot.price).toFixed(2), ox + 8, oy + 4);
    }

    if (tel.nodes) {
        tel.nodes.forEach(n => {
            const nx = f(n.x), ny = f(n.y), nr = f(n.r, 3);
            ctx.beginPath();
            ctx.arc(nx, ny, nr, 0, Math.PI * 2);
            ctx.fillStyle = n.color || '#a855f7';
            ctx.fill();
            if (n.label) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '9px Arial';
                ctx.fillText(n.label, nx + 5, ny);
            }
        });
    }
};