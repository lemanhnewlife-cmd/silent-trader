(function () {
  'use strict';

  const GIST_ID = '2bf53bd09bbb0594b5f9440c059b0a88';
  const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
  const GIST_RAW_URL = `https://gist.githubusercontent.com/lemanhnewlife-cmd/${GIST_ID}/raw/silent_trader_endpoint.json`;

  const boot = window.SILENT_STRATEGY_BOOT || {};
  const qs = new URLSearchParams(window.location.search);
  const SYSTEM_ID = String(qs.get('system') || boot.system_id || 'SEISMOGRAPH').toUpperCase();
  const EA_NAME = boot.ea_name || ('Silent' + SYSTEM_ID + '_Bot');
  const DEFAULT_TF = boot.default_tf || 'M1';
  const ORDER_STORAGE_KEY = `silent_order_${SYSTEM_ID}`;

  const isHostedOnBackend =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname.endsWith('.trycloudflare.com');
  const paramApi = qs.get('api') || '';

  const esc = (v) =>
    String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const fmtNum = (n, d = 2) => {
    const x = Number(n);
    return Number.isFinite(x) ? x.toFixed(d) : '--';
  };

  const fmtSignedUsd = (n) => {
    const x = Number(n || 0);
    return `${x >= 0 ? '+' : '-'}$${Math.abs(x).toFixed(2)}`;
  };

  const fmtShortTime = (ts) => {
    if (!ts) return '--';
    const ms = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
    if (!Number.isFinite(ms) || ms <= 0) return String(ts);
    const d = new Date(ms);
    return d.toLocaleTimeString('vi-VN', { hour12: false });
  };

  const fmtCountdown = (sec) => {
    const sTot = Math.max(0, Math.floor(Number(sec || 0)));
    if (sTot <= 0) return 'Đã hết hạn';
    const h = Math.floor(sTot / 3600);
    const m = Math.floor((sTot % 3600) / 60);
    const s = sTot % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const mount = document.getElementById('shellApp');
  if (!mount) return;

  const legendHtml = (Array.isArray(boot.legend) ? boot.legend : [])
    .map(([col, lbl]) => `<span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${esc(col)};margin-right:4px;"></span>${esc(lbl)}</span>`)
    .join('');

  const tagsHtml = (Array.isArray(boot.usp_tags) ? boot.usp_tags : [])
    .map((t) => `<span class="usp-tag">${esc(t)}</span>`)
    .join('');

  mount.innerHTML = `
    <div id="strategyHubBar" class="hub-topbar"></div>
    <div class="shell-wrap">
      <div class="shell-head">
        <div class="brand-row">
          <div class="brand-title">${esc(boot.icon || '⚡')} ${esc(boot.short_name || SYSTEM_ID)}</div>
          <span class="badge-pill">${esc(boot.badge || 'QUANT ENGINE')}</span>
          <span class="live-pill" id="liveBadge">● ĐANG KẾT NỐI • ${esc(DEFAULT_TF)}</span>
        </div>
        <div class="head-actions">
          <input id="apiUrlInput" type="text" placeholder="URL Server / Tunnel" style="display:none;background:#0f172a;color:#e2e8f0;border:1px solid var(--border);border-radius:7px;padding:5px 8px;font-size:12px;width:220px;" />
          <button type="button" class="btn-sub" id="btnSettings" title="Cấu hình Server API">⚙ API</button>
          <button type="button" class="btn-sub" id="btnScrollHist">📜 Lịch sử ($10k)</button>
          <button type="button" class="btn-cta" id="btnOpenPay">⚡ TẢI ${esc(EA_NAME.toUpperCase())}.EX5</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-lbl">XAUUSD BID / ASK</div>
          <div class="kpi-val" id="kpiBidAsk">-- / --</div>
          <div class="kpi-sub" id="kpiSpread">Spread -- • ${esc(DEFAULT_TF)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">${esc(boot.short_name || SYSTEM_ID)} TÍN HIỆU</div>
          <div class="kpi-val" id="kpiSignal">WAIT</div>
          <div class="kpi-sub" id="kpiConf">Độ tin cậy --%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">VÙNG SL / TP HIỆN TẠI</div>
          <div class="kpi-val" id="kpiSlTp">-- / --</div>
          <div class="kpi-sub" id="kpiRr">Magic #${esc(boot.magic || '')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">TK $10K (REAL TRADES) • RISK 1%</div>
          <div class="kpi-val" id="kpiEquity">$10,000.00</div>
          <div class="kpi-sub" id="kpiStats">+$0.00 (0.00%) • WR 0.0% • 0 lệnh</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">VỊ THẾ & HIỆU SUẤT</div>
          <div class="kpi-val" id="kpiPos">ĐANG RÌNH LỆNH</div>
          <div class="kpi-sub" id="kpiPerf">PF 0.00 • MaxDD 0.00%</div>
        </div>
      </div>

      <div class="usp-box">
        <div class="usp-top">
          <div class="usp-title">${esc(boot.usp_title || boot.name || SYSTEM_ID)}</div>
          <button type="button" class="btn-sub" id="btnToggleUsp" style="padding:3px 9px;font-size:11px;">Thu gọn ▴</button>
        </div>
        <div id="uspBody">
          <div class="usp-desc">${esc(boot.usp_desc || '')}</div>
          <div class="usp-tags">${tagsHtml}</div>
        </div>
        <div class="proof-bar" id="proofBar">⚡ Đang chờ tín hiệu vi cấu trúc từ máy chủ...</div>
      </div>

      <div class="stage-card">
        <div class="stage-bar">
          <span id="stageLeft">[${esc(boot.short_name || SYSTEM_ID)} • ${esc(DEFAULT_TF)}] Đang đồng bộ telemetry...</span>
          <span id="stageRight">--</span>
        </div>
        <canvas id="strategyCanvas"></canvas>
        <div class="stage-legend">${legendHtml}</div>
      </div>

      <div class="hist-card" id="histSection">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <strong style="font-size:13px;">📜 Lịch sử lệnh thật 100% ($10,000 Virtual Engine — Không lệnh ảo)</strong>
          <span style="font-size:11.5px;color:#94a3b8;" id="histSummary">0 lệnh đã đóng</span>
        </div>
        <div class="hist-scroll">
          <table class="hist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thời gian</th>
                <th>Loại</th>
                <th>Lot</th>
                <th>Giá vào → Ra</th>
                <th>SL / TP</th>
                <th>Trạng thái</th>
                <th>Lãi/Lỗ ($)</th>
                <th>Số dư sau</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody id="histTableBody">
              <tr><td colspan="10" style="text-align:center;color:#64748b;padding:16px;">Đang tải dữ liệu thật...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="pay-backdrop" id="payModal">
      <div class="pay-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:15px;">⚡ Tải ${esc(EA_NAME)}.ex5 (Bản quyền 24h)</strong>
          <button type="button" class="btn-sub" id="btnClosePay" style="padding:3px 9px;">✕</button>
        </div>

        <div id="payStepIntro">
          <p style="font-size:12.5px;color:#cbd5e1;line-height:1.5;margin:6px 0 12px;">
            Mở khóa tệp EA MT5 <strong>${esc(EA_NAME)}.ex5</strong> (Magic <strong>#${esc(boot.magic || '')}</strong>) chạy song song không xung đột với các bot khác.
          </p>
          <div id="payIntroErr" style="color:#f87171;font-size:12px;margin-bottom:8px;"></div>
          <button type="button" class="btn-cta" id="btnCreateOrder" style="width:100%;padding:10px;">
            💳 Thanh toán 10.000đ qua MoMo để tải ${esc(EA_NAME)}.ex5
          </button>
        </div>

        <div id="payStepQr" style="display:none;">
          <img id="momoQrImg" class="pay-qr-img" alt="MoMo QR" />
          <div class="pay-code-box">
            <span>Nội dung CK: <strong id="orderCodeText">--</strong></span>
            <button type="button" class="btn-sub" id="btnCopyCode" style="padding:3px 8px;">Copy</button>
          </div>
          <div class="pay-status" id="payStatusBanner">⏳ Đang chờ xác nhận thanh toán MoMo...</div>
          <button type="button" class="btn-sub" id="btnNewOrderQr" style="width:100%;margin-top:6px;">🔄 Tạo mã đơn mới</button>
        </div>

        <div id="payStepPaid" style="display:none;">
          <div class="pay-status" style="color:#4ade80;">✅ Đã kích hoạt bản quyền 24h! Mã: <strong id="paidCodeText">--</strong> (<span id="paidCountdown">--</span>)</div>
          <div class="pay-code-box" style="font-size:11.5px;">
            <span id="eaApiUrlText" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;">--</span>
            <button type="button" class="btn-sub" id="btnCopyApiUrl" style="padding:3px 8px;">Copy URL</button>
          </div>
          <button type="button" class="btn-cta" id="btnDownloadEx5" style="width:100%;padding:10px;margin-top:6px;">
            ⬇ Tải xuống ${esc(EA_NAME)}.ex5
          </button>
          <button type="button" class="btn-sub" id="btnNewOrderPaid" style="width:100%;margin-top:8px;">Gia hạn / Tạo mã mới</button>
        </div>
      </div>
    </div>
  `;

  const apiUrlInput = document.getElementById('apiUrlInput');
  const canvas = document.getElementById('strategyCanvas');
  const ctx = canvas.getContext('2d');
  let customApiOverride = false;
  let lastSnap = null;
  let activeOrderCode = localStorage.getItem(ORDER_STORAGE_KEY) || '';
  let activeDownloadUrl = '';
  let payPollTimer = null;
  const startedAt = performance.now();

  apiUrlInput.value = paramApi ? paramApi : (isHostedOnBackend ? window.location.origin : '');
  document.getElementById('btnSettings').onclick = () => {
    apiUrlInput.style.display = apiUrlInput.style.display === 'none' ? 'inline-block' : 'none';
  };
  apiUrlInput.addEventListener('input', () => {
    customApiOverride = apiUrlInput.value.trim().length > 0;
  });
  document.getElementById('btnScrollHist').onclick = () => {
    document.getElementById('histSection').scrollIntoView({ behavior: 'smooth' });
  };
  document.getElementById('btnToggleUsp').onclick = (e) => {
    const body = document.getElementById('uspBody');
    const hidden = body.style.display === 'none';
    body.style.display = hidden ? 'block' : 'none';
    e.currentTarget.textContent = hidden ? 'Thu gọn ▴' : 'Mở rộng ▾';
  };

  async function resolveDefaultTunnel(forceRefresh = false) {
    if (isHostedOnBackend || paramApi || (customApiOverride && !forceRefresh)) return;
    try {
      const r1 = await fetch(GIST_RAW_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (r1.ok) {
        const j = await r1.json();
        if (j && j.public_url) { apiUrlInput.value = j.public_url; return; }
      }
    } catch (_) {}
    try {
      const r2 = await fetch(GIST_API_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (r2.ok) {
        const g = await r2.json();
        const raw = g && g.files && g.files['silent_trader_endpoint.json'] && g.files['silent_trader_endpoint.json'].content;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.public_url) { apiUrlInput.value = parsed.public_url; return; }
        }
      }
    } catch (_) {}
    try {
      const r3 = await fetch('./tunnel_info.json?t=' + Date.now(), { cache: 'no-store' });
      if (r3.ok) {
        const info = await r3.json();
        if (info && info.public_url) { apiUrlInput.value = info.public_url; }
      }
    } catch (_) {}
  }

  async function getApiBase() {
    let base = apiUrlInput.value.trim().replace(/\/+$/, '');
    if (!base) {
      await resolveDefaultTunnel(true);
      base = apiUrlInput.value.trim().replace(/\/+$/, '');
    }
    return base;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width * dpr));
    const h = Math.max(200, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function renderSnapshot(v) {
    if (!v || !v.ok) return;
    lastSnap = v;

    if (window.StrategyHub) window.StrategyHub.update(v);

    const sig = v.live_signal || {};
    const acc = v.account || {};
    const stats = v.stats || {};
    const ot = v.open_trade || null;
    const tel = v.visual_telemetry || sig.visual_telemetry || {};

    const bid = Number(sig.bid || tel.bid || 0);
    const ask = Number(sig.ask || tel.ask || 0);
    document.getElementById('liveBadge').textContent = `● LIVE • ${DEFAULT_TF}`;
    document.getElementById('kpiBidAsk').textContent = bid > 0 ? `${bid.toFixed(2)} / ${ask.toFixed(2)}` : 'LIVE MARKET';
    const spreadVal = bid > 0 && ask > 0 ? Math.max(0, ask - bid).toFixed(2) : (tel.spread_usd != null ? Number(tel.spread_usd).toFixed(2) : '--');
    document.getElementById('kpiSpread').textContent = `Spread $${spreadVal} • ${DEFAULT_TF}`;

    const act = String(sig.action || 'WAIT').toUpperCase();
    const sigEl = document.getElementById('kpiSignal');
    sigEl.textContent = act;
    sigEl.style.color = act === 'BUY' ? '#4ade80' : (act === 'SELL' ? '#f87171' : '#fde047');
    document.getElementById('kpiConf').textContent = `Độ tin cậy ${sig.confidence != null ? sig.confidence : '--'}%`;

    const slVal = ot ? ot.sl : sig.sl;
    const tpVal = ot ? ot.tp : sig.tp;
    document.getElementById('kpiSlTp').textContent = `${fmtNum(slVal)} / ${fmtNum(tpVal)}`;

    const eq = Number(acc.equity != null ? acc.equity : 10000);
    const netUsd = Number(acc.net_pnl_usd || 0);
    const netPct = Number(acc.net_pnl_pct || 0);
    const eqEl = document.getElementById('kpiEquity');
    eqEl.textContent = `$${eq.toFixed(2)}`;
    eqEl.style.color = netUsd >= 0 ? '#4ade80' : '#f87171';
    document.getElementById('kpiStats').textContent = `${fmtSignedUsd(netUsd)} (${netUsd >= 0 ? '+' : ''}${netPct.toFixed(2)}%) • WR ${fmtNum(stats.winrate, 1)}% • ${stats.total_trades || 0} lệnh`;

    const posEl = document.getElementById('kpiPos');
    if (ot) {
      posEl.textContent = `${ot.side} ${fmtNum(ot.lot)} (${fmtSignedUsd(ot.floating_usd)})`;
      posEl.style.color = Number(ot.floating_usd || 0) >= 0 ? '#4ade80' : '#f87171';
    } else {
      posEl.textContent = 'ĐANG RÌNH LỆNH';
      posEl.style.color = '#e2e8f0';
    }
    document.getElementById('kpiPerf').textContent = `PF ${fmtNum(stats.profit_factor)} • MaxDD ${fmtNum(acc.max_dd_pct)}%`;

    const proofNote = sig.trigger_note || sig.note || '';
    document.getElementById('proofBar').textContent = `⚡ Bằng chứng tín hiệu sống: ${proofNote || tel.mode || 'Đang quét vi cấu trúc nến'}`;
    document.getElementById('stageLeft').textContent = `[${boot.short_name || SYSTEM_ID} • ${DEFAULT_TF}] ${proofNote}`;
    document.getElementById('stageRight').textContent = `Cập nhật: ${fmtShortTime(v.updated_at)}`;

    const rows = [];
    if (ot) {
      rows.push(`
        <tr style="background:rgba(56,189,248,0.08);">
          <td>#${esc(ot.id)}</td>
          <td>${esc(fmtShortTime(ot.open_time))} → Đang chạy</td>
          <td class="${ot.side === 'BUY' ? 'pos' : 'neg'}">${esc(ot.side)}</td>
          <td>${fmtNum(ot.lot)}</td>
          <td>${fmtNum(ot.open_price)} → ${fmtNum(ot.mark_price)}</td>
          <td>${fmtNum(ot.sl)} / ${fmtNum(ot.tp)}</td>
          <td><span class="badge-open">OPEN</span></td>
          <td class="${Number(ot.floating_usd) >= 0 ? 'pos' : 'neg'}">${fmtSignedUsd(ot.floating_usd)}</td>
          <td>$${eq.toFixed(2)}</td>
          <td>${esc(ot.trigger_note || '-')}</td>
        </tr>
      `);
    }
    const closed = Array.isArray(v.recent_trades) ? v.recent_trades : [];
    for (const tr of closed) {
      const cls = Number(tr.pnl_usd) >= 0 ? 'pos' : 'neg';
      const bCls = tr.close_reason === 'TP' ? 'badge-tp' : 'badge-sl';
      rows.push(`
        <tr>
          <td>#${esc(tr.id)}</td>
          <td>${esc(fmtShortTime(tr.open_time))} → ${esc(fmtShortTime(tr.close_time))}</td>
          <td class="${tr.side === 'BUY' ? 'pos' : 'neg'}">${esc(tr.side)}</td>
          <td>${fmtNum(tr.lot)}</td>
          <td>${fmtNum(tr.open_price)} → ${fmtNum(tr.close_price)}</td>
          <td>${fmtNum(tr.sl)} / ${fmtNum(tr.tp)}</td>
          <td><span class="${bCls}">${esc(tr.close_reason)}</span></td>
          <td class="${cls}">${fmtSignedUsd(tr.pnl_usd)}</td>
          <td>$${fmtNum(tr.balance_after)}</td>
          <td>${esc(tr.trigger_note || '-')}</td>
        </tr>
      `);
    }
    document.getElementById('histSummary').textContent = `${stats.total_trades || closed.length} lệnh đã đóng`;
    document.getElementById('histTableBody').innerHTML = rows.length
      ? rows.join('')
      : '<tr><td colspan="10" style="text-align:center;color:#64748b;padding:16px;">Chưa có lệnh đóng — Tài khoản $10,000.00 đang chờ tín hiệu thật từ thị trường.</td></tr>';
  }

  async function pollVirtual() {
    const base = await getApiBase();
    if (!base) {
      document.getElementById('liveBadge').textContent = '● CHỜ KẾT NỐI TUNNEL...';
      return;
    }
    try {
      const res = await fetch(`${base}/api/silenteyes/virtual?system=${encodeURIComponent(SYSTEM_ID)}`, { cache: 'no-store' });
      if (res.ok) renderSnapshot(await res.json());
    } catch (_) {}
  }

  function renderLoop(now) {
    resizeCanvas();
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fn = window.SilentRenderers && window.SilentRenderers[SYSTEM_ID];
    if (typeof fn === 'function') {
      try {
        fn(ctx, w, h, { snap: lastSnap, t: (now - startedAt) / 1000, boot });
      } catch (err) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px monospace';
        ctx.fillText('Renderer error: ' + err.message, 20, 36);
      }
    } else {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(`Đang nạp bộ dựng hình ${SYSTEM_ID}...`, 20, 36);
    }
    ctx.restore();
    requestAnimationFrame(renderLoop);
  }

  // MoMo Paywall Modal
  const payModal = document.getElementById('payModal');
  const payStepIntro = document.getElementById('payStepIntro');
  const payStepQr = document.getElementById('payStepQr');
  const payStepPaid = document.getElementById('payStepPaid');
  const stopPayPoll = () => { if (payPollTimer) { clearInterval(payPollTimer); payPollTimer = null; } };
  const showPayView = (v) => {
    payStepIntro.style.display = v === 'intro' ? 'block' : 'none';
    payStepQr.style.display = v === 'qr' ? 'block' : 'none';
    payStepPaid.style.display = v === 'paid' ? 'block' : 'none';
  };
  const copyFeedback = (btn, text) => {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      const old = btn.textContent;
      btn.textContent = 'Đã copy ✓';
      setTimeout(() => { btn.textContent = old; }, 1300);
    }).catch(() => {});
  };

  function renderOrderState(data, base) {
    if (!data || !data.order_code) return;
    activeOrderCode = data.order_code;
    localStorage.setItem(ORDER_STORAGE_KEY, activeOrderCode);
    if (data.status === 'PAID') {
      stopPayPoll();
      document.getElementById('paidCodeText').textContent = activeOrderCode;
      document.getElementById('paidCountdown').textContent = fmtCountdown(data.remaining_sec);
      const eaBase = data.api_base_url || base;
      document.getElementById('eaApiUrlText').textContent = eaBase;
      document.getElementById('btnCopyApiUrl').onclick = (e) => copyFeedback(e.currentTarget, eaBase);
      activeDownloadUrl = `${base}/api/silenteyes/download-ex5?code=${encodeURIComponent(activeOrderCode)}`;
      showPayView('paid');
      return;
    }
    if (data.status === 'EXPIRED') {
      stopPayPoll();
      localStorage.removeItem(ORDER_STORAGE_KEY);
      activeOrderCode = '';
      document.getElementById('payIntroErr').textContent = 'Mã bản quyền 24h trước đã hết hạn. Vui lòng tạo đơn mới.';
      showPayView('intro');
      return;
    }
    document.getElementById('orderCodeText').textContent = activeOrderCode;
    document.getElementById('momoQrImg').src = data.qr_url;
    document.getElementById('btnCopyCode').onclick = (e) => copyFeedback(e.currentTarget, activeOrderCode);
    document.getElementById('payStatusBanner').textContent = `⏳ Đang chờ MoMo 0977098166 xác nhận 10.000đ (${EA_NAME})...`;
    showPayView('qr');
  }

  async function pollOrderStatus() {
    if (!activeOrderCode) return;
    const base = await getApiBase();
    if (!base) return;
    try {
      const res = await fetch(`${base}/api/silenteyes/order-status?code=${encodeURIComponent(activeOrderCode)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.found) renderOrderState(data, base);
      else { stopPayPoll(); localStorage.removeItem(ORDER_STORAGE_KEY); activeOrderCode = ''; showPayView('intro'); }
    } catch (_) {}
  }

  async function createNewOrder() {
    const errEl = document.getElementById('payIntroErr');
    const btn = document.getElementById('btnCreateOrder');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      const base = await getApiBase();
      if (!base) throw new Error('Chưa kết nối được máy chủ.');
      const res = await fetch(`${base}/api/silenteyes/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_id: SYSTEM_ID }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không tạo được đơn.');
      renderOrderState(data, base);
      stopPayPoll();
      payPollTimer = setInterval(pollOrderStatus, 3000);
    } catch (err) {
      errEl.textContent = 'Lỗi: ' + (err.message || err);
      showPayView('intro');
    } finally {
      btn.disabled = false;
    }
  }

  const openPayModal = async () => {
    payModal.classList.add('open');
    document.getElementById('payIntroErr').textContent = '';
    if (activeOrderCode) {
      await pollOrderStatus();
      if (activeOrderCode && payStepQr.style.display === 'block') {
        stopPayPoll();
        payPollTimer = setInterval(pollOrderStatus, 3000);
      }
    } else {
      showPayView('intro');
    }
  };

  document.getElementById('btnOpenPay').onclick = openPayModal;
  document.getElementById('btnClosePay').onclick = () => { payModal.classList.remove('open'); stopPayPoll(); };
  payModal.addEventListener('click', (e) => { if (e.target === payModal) { payModal.classList.remove('open'); stopPayPoll(); } });
  document.getElementById('btnCreateOrder').onclick = createNewOrder;
  document.getElementById('btnNewOrderQr').onclick = () => { stopPayPoll(); localStorage.removeItem(ORDER_STORAGE_KEY); activeOrderCode = ''; createNewOrder(); };
  document.getElementById('btnNewOrderPaid').onclick = () => { stopPayPoll(); localStorage.removeItem(ORDER_STORAGE_KEY); activeOrderCode = ''; createNewOrder(); };
  document.getElementById('btnDownloadEx5').onclick = () => { if (activeDownloadUrl) window.location.href = activeDownloadUrl; };

  if (window.StrategyHub) {
    window.StrategyHub.init({
      mountId: 'strategyHubBar',
      currentSystemId: SYSTEM_ID,
      getApiUrl: () => apiUrlInput.value.trim(),
      isHostedOnBackend,
      paramApi,
      onOpenCopyModal: openPayModal,
    });
  }

  pollVirtual();
  setInterval(pollVirtual, 2500);
  requestAnimationFrame(renderLoop);
})();
