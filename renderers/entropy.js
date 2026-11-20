function renderEntropy(canvas, telemetry) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = Number.isFinite(canvas.width) ? canvas.width : 0;
    const h = Number.isFinite(canvas.height) ? canvas.height : 0;

    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);

    const data = telemetry || {};
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.3;

    const grad = ctx.createLinearGradient(
        Number.isFinite(0) ? 0 : 0,
        Number.isFinite(0) ? 0 : 0,
        Number.isFinite(w) ? w : 0,
        Number.isFinite(h) ? h : 0
    );
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#a855f7');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(
        Number.isFinite(centerX) ? centerX : 0,
        Number.isFinite(centerY) ? centerY : 0,
        Number.isFinite(radius) ? radius : 0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    const val = Number.isFinite(data.value) ? data.value : 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(val.toFixed(2), Number.isFinite(centerX) ? centerX : 0, Number.isFinite(centerY) ? centerY : 0);

    const barWidth = Number.isFinite(data.barWidth) ? data.barWidth : 0;
    const barHeight = Number.isFinite(data.barHeight) ? data.barHeight : 0;
    if (barWidth > 0 && barHeight > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(
            Number.isFinite(centerX - barWidth / 2) ? centerX - barWidth / 2 : 0,
            Number.isFinite(centerY + radius + 10) ? centerY + radius + 10 : 0,
            Number.isFinite(barWidth) ? barWidth : 0,
            Number.isFinite(barHeight) ? barHeight : 0
        );
    }
}