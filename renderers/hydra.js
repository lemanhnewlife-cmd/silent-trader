export default function renderHydra(ctx, telemetry) {
    const w = Number.isFinite(ctx.canvas.width) && ctx.canvas.width > 0 ? ctx.canvas.width : 0;
    const h = Number.isFinite(ctx.canvas.height) && ctx.canvas.height > 0 ? ctx.canvas.height : 0;

    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const safeNum = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

    const data = telemetry || {};
    const score = safeNum(data.score, 0);
    const flow = safeNum(data.flow, 0);
    const pressure = safeNum(data.pressure, 0);
    const density = safeNum(data.density, 0);

    const centerX = safeNum(w / 2);
    const centerY = safeNum(h / 2);
    const baseRadius = safeNum(Math.min(w, h) * 0.35);

    // Background Gradient
    const bgGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, safeNum(baseRadius * 1.5)
    );
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Multi-headed Hydra Rings
    const heads = 7;
    for (let i = 0; i < heads; i++) {
        const angle = safeNum((i / heads) * Math.PI * 2);
        const offset = safeNum(Math.sin(Date.now() / 1000 + i) * 10);
        const r = safeNum(baseRadius + offset);
        
        const x = safeNum(centerX + Math.cos(angle) * (flow * 20));
        const y = safeNum(centerY + Math.sin(angle) * (flow * 20));

        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? `rgba(168, 85, 247, ${0.3 + pressure * 0.5})` : `rgba(56, 189, 248, ${0.3 + pressure * 0.5})`;
        ctx.lineWidth = safeNum(2 + density * 5);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Center Core
    const coreGrad = ctx.createLinearGradient(
        safeNum(centerX - 50), safeNum(centerY - 50),
        safeNum(centerX + 50), safeNum(centerY + 50)
    );
    coreGrad.addColorStop(0, '#a855f7');
    coreGrad.addColorStop(1, '#38bdf8');

    ctx.beginPath();
    ctx.fillStyle = coreGrad;
    ctx.shadowBlur = safeNum(15 + score * 10);
    ctx.shadowColor = '#a855f7';
    ctx.arc(centerX, centerY, safeNum(20 + score * 5), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD Text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HYDRA CORE: ${score.toFixed(2)}`, centerX, safeNum(centerY + baseRadius + 40));
    
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`F:${flow.toFixed(2)} P:${pressure.toFixed(2)} D:${density.toFixed(2)}`, centerX, safeNum(centerY + baseRadius + 60));
}