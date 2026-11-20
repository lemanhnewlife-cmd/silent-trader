window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.SPECTRUM = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry || {};
    const ot = st.snap.open_trade || null;
    const safeX = (val) => Number.isFinite(val) ? val : 0;
    const safeY = (val) => Number.isFinite(val) ? val : 0;
    const safeR = (val) => (Number.isFinite(val) && val > 0) ? val : 1;

    ctx.clearRect(0, 0, w, h);

    if (tel.spectrum_data && Array.isArray(tel.spectrum_data)) {
        const data = tel.spectrum_data;
        const step = w / Math.max(1, data.length - 1);
        
        const grad = ctx.createLinearGradient(0, 0, safeX(w), 0);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
        
        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        for (let i = 0; i < data.length; i++) {
            const x = safeX(i * step);
            const y = safeY(h - (data[i] * h));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (ot) {
            const otX = safeX(w * 0.5);
            const otY = safeY(h * 0.5);
            const otR = safeR(20);
            
            const radial = ctx.createRadialGradient(otX, otY, 0, otX, otY, otR);
            radial.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            radial.addColorStop(1, 'rgba(239, 68, 68, 0)');
            
            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(otX, otY, otR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText(`ID:${ot.ticket || 'N/A'} P:${ot.profit || 0}`, otX + 25, otY);
        }
    }

    if (tel.signal_strength) {
        const barW = safeX(w * 0.1);
        const barH = safeY(h * (tel.signal_strength / 100));
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(10, h - barH - 10, barW, barH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.round(tel.signal_strength)}%`, 10, h - barH - 15);
    }
};