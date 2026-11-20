window.SilentRenderers = window.SilentRenderers || {};
window.SilentRenderers.DARWIN = function(ctx, w, h, st) {
    if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10) return;
    const snap = (st && st.snap) || {};
    const tel = snap.visual_telemetry || (snap.live_signal && snap.live_signal.visual_telemetry) || {};
    const ot = snap.open_trade || null;
    const t = Number.isFinite(st && st.t) ? st.t : 0;

    const num = (v, fb = 0) => (Number.isFinite(v) ? v : fb);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, num(v)));
    const safeLinGrad = (x0, y0, x1, y1) => ctx.createLinearGradient(num(x0), num(y0), num(x1), num(y1));

    // Background
    ctx.fillStyle = '#050f0c';
    ctx.fillRect(0, 0, w, h);

    const pad = 15;
    const leftW = w * 0.58;
    const rightW = w - leftW;

    // 1. LEFT AREA: 2x2 Clusters
    const clusters = Array.isArray(tel.clusters) ? tel.clusters : [];
    const cellW = (leftW - pad * 3) / 2;
    const cellH = (h - pad * 3) / 2;

    clusters.slice(0, 4).forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad + col * (cellW + pad);
        const y = pad + row * (cellH + pad);

        ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, cellW, cellH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(String(c.name || 'Cluster'), x + 10, y + 22);

        const buy = num(c.buy);
        const sell = num(c.sell);
        const wait = num(c.wait);
        const total = Math.max(1, buy + sell + wait);
        
        const barY = y + 35;
        const barH = 8;
        const barMaxW = cellW - 20;
        
        // Buy bar
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + 10, barY, (buy / total) * barMaxW, barH);
        // Sell bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 10 + (buy / total) * barMaxW, barY, (sell / total) * barMaxW, barH);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter';
        ctx.fillText('PF: ' + num(c.avg_pf).toFixed(2), x + 10, y + cellH - 10);
    });

    // 2. RIGHT AREA: Strategy & Elite Bots
    const rx = leftW + pad;
    
    // Strategy Badge
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 14px Inter';
    ctx.fillText(String(tel.strategy_mode || 'DARWIN_CORE'), rx, pad + 15);

    // Bias Comparison
    ctx.font = '12px Inter';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Elite: ', rx, pad + 45);
    ctx.fillStyle = tel.elite_bias === 'BUY' ? '#22c55e' : '#ef4444';
    ctx.fillText(String(tel.elite_bias || 'N/A'), rx + 40, pad + 45);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Herd: ', rx + 90, pad + 45);
    ctx.fillStyle = tel.herd_bias === 'SELL' ? '#ef4444' : '#22c55e';
    ctx.fillText(String(tel.herd_bias || 'N/A'), rx + 130, pad + 45);

    // Crowding Bar
    const crowd = clamp(tel.crowding_pct, 0, 100);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx, pad + 60, rightW - pad * 2, 6);
    const grad = safeLinGrad(rx, 0, rx + (crowd/100)*(rightW-pad*2), 0);
    grad.addColorStop(0, '#22c55e');
    grad.addColorStop(1, '#f472b6');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, pad + 60, (crowd / 100) * (rightW - pad * 2), 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Crowding: ' + crowd.toFixed(1) + '%', rx, pad + 80);

    // Elite Bots Table
    const bots = Array.isArray(tel.elite_bots) ? tel.elite_bots : [];
    let botY = pad + 105;
    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('BOT ID', rx, botY);
    ctx.fillText('ACT', rx + 70, botY);
    ctx.fillText('PF', rx + 110, botY);
    ctx.fillText('PNL', rx + 145, botY);

    bots.slice(0, 5).forEach((b, idx) => {
        const y = botY + 18 + idx * 20;
        ctx.font = '11px Inter';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(String(b.sid).substring(0, 10), rx, y);
        ctx.fillStyle = b.action === 'BUY' ? '#22c55e' : '#ef4444';
        ctx.fillText(String(b.action), rx + 70, y);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(num(b.pf).toFixed(1), rx + 110, y);
        ctx.fillStyle = num(b.pnl) >= 0 ? '#22c55e' : '#ef4444';
        ctx.fillText('$' + num(b.pnl).toFixed(0), rx + 145, y);
    });

    // Open Trade Badge
    if (ot && ot.side) {
        const bx = rx;
        const by = h - pad - 30;
        const bw = rightW - pad * 2;
        ctx.fillStyle = 'rgba(244, 114, 182, 0.1)';
        ctx.fillRect(bx, by, bw, 25);
        ctx.strokeStyle = '#f472b6';
        ctx.strokeRect(bx, by, bw, 25);
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 11px Inter';
        const txt = `${ot.side} ${num(ot.lot).toFixed(2)} @ ${num(ot.open_price).toFixed(2)} | ${num(ot.floating_usd) >= 0 ? '+' : ''}$${num(ot.floating_usd).toFixed(2)}`;
        ctx.fillText(txt, bx + 8, by + 17);
    }
};