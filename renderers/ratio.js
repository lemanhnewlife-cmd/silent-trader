window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.RATIO = function(ctx, w, h, st) {
    const tel = st.snap.visual_telemetry;
    const ot = st.snap.open_trade;
    if (!tel) return;

    const safeX = (val) => Number.isFinite(val) ? val : 0;
    const safeY = (val) => Number.isFinite(val) ? val : 0;
    const safeR = (val) => (Number.isFinite(val) && val > 0) ? val : 1;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw Telemetry Data
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.35;

    // Ratio Circle
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.arc(safeX(centerX), safeY(centerY), safeR(radius), 0, Math.PI * 2);
    ctx.stroke();

    // Signal Strength Gradient
    const strength = tel.signal_strength || 0;
    const grad = ctx.createRadialGradient(safeX(centerX), safeY(centerY), 0, safeX(centerX), safeY(centerY), safeR(radius));
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(1, `rgba(56, 189, 248, ${Math.min(strength / 100, 0.3)})`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(safeX(centerX), safeY(centerY), safeR(radius), 0, Math.PI * 2);
    ctx.fill();

    // Text Info
    ctx.font = '14px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    
    const label = `STR: ${strength.toFixed(1)} | VOL: ${(tel.volume_ratio || 0).toFixed(2)}`;
    ctx.fillText(label, safeX(centerX), safeY(centerY + radius + 25));

    // Open Trade Indicator
    if (ot && ot.ticket) {
        ctx.fillStyle = ot.type === 'buy' ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(safeX(centerX), safeY(centerY), 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`#${ot.ticket} (${ot.profit > 0 ? '+' : ''}${ot.profit.toFixed(2)})`, safeX(centerX), safeY(centerY - 15));
    }

    // Visual Line to current price ratio
    const angle = ((tel.sentiment_pct || 50) / 100) * Math.PI * 2 - Math.PI / 2;
    const lx = centerX + Math.cos(angle) * radius;
    const ly = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.moveTo(safeX(centerX), safeY(centerY));
    ctx.lineTo(safeX(lx), safeY(ly));
    ctx.stroke();
};