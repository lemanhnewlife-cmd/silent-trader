window.renderChameleon = function(canvas, telemetry) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = Number.isFinite(canvas.width) && canvas.width > 0 ? canvas.width : 0;
    const H = Number.isFinite(canvas.height) && canvas.height > 0 ? canvas.height : 0;
    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

    const data = telemetry || {};
    const price = safeNum(data.price, 0);
    const change = safeNum(data.change_24h, 0);
    const volume = safeNum(data.volume_24h, 0);
    const sentiment = safeNum(data.sentiment, 50);
    const volatility = safeNum(data.volatility, 0);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, safeNum(H));
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Central Orb
    const centerX = safeNum(W / 2);
    const centerY = safeNum(H / 2);
    const radius = safeNum(Math.min(W, H) * 0.25);

    const orbGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    const color = change >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    orbGrad.addColorStop(0, color);
    orbGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Sentiment Ring
    const ringRadius = radius + 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    const angle = safeNum((sentiment / 100) * Math.PI * 2);
    ctx.strokeStyle = sentiment > 50 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, -Math.PI / 2, angle - Math.PI / 2);
    ctx.stroke();

    // Data Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(price.toFixed(2), centerX, centerY - 10);

    ctx.font = '14px monospace';
    ctx.fillStyle = change >= 0 ? '#4ade80' : '#f87171';
    ctx.fillText((change >= 0 ? '+' : '') + change.toFixed(2) + '%', centerX, centerY + 20);

    // Volatility Waves
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const waveCount = 50;
    for (let i = 0; i <= waveCount; i++) {
        const x = safeNum((W / waveCount) * i);
        const yOffset = Math.sin(i * 0.5 + Date.now() * 0.002) * volatility * 10;
        const y = safeNum(H * 0.85 + yOffset);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Bottom Info
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('VOL: ' + volume.toLocaleString(), centerX, H - 20);
};