window.StrategyHub = (() => {
  let _opts = {};
  let _snapshot = null;
  let _hasRedirected = false;
  let _filterType = 'ALL';
  let _sortType = 'PROFIT';
  let _searchTerm = '';

  const _qs = new URLSearchParams(window.location.search);
  const _isManual = _qs.get('manual') === '1';
  const _isAutoLead = _qs.get('auto_lead') === '1';

  const _esc = (str) =>
    String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const buildPageUrl = (page, extra = {}) => {
    const url = new URL('./' + page, window.location.href);
    url.search = '';
    const apiParam =
      _opts.paramApi ||
      (!_opts.isHostedOnBackend && _opts.getApiUrl ? _opts.getApiUrl() : '');
    if (apiParam) url.searchParams.set('api', apiParam);
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    return url.toString();
  };

  const _openModal = () => {
    const modal = document.getElementById('hubModal');
    if (modal) {
      modal.classList.add('open');
      _renderHubTableBody();
      const inp = modal.querySelector('.hub-search');
      if (inp) setTimeout(() => inp.focus(), 40);
    }
  };

  const _closeModal = () => {
    const modal = document.getElementById('hubModal');
    if (modal) modal.classList.remove('open');
  };

  const _navigate = (page, extra) => {
    window.location.href = buildPageUrl(page, extra);
  };

  const _triggerCopy = (page, isCur) => {
    if (isCur) {
      _closeModal();
      if (typeof _opts.onOpenCopyModal === 'function') _opts.onOpenCopyModal();
      return;
    }
    _navigate(page, { manual: '1', open_copy: '1' });
  };

  const _fmtPnl = (usd, pct) => {
    const u = Number(usd || 0);
    const p = Number(pct || 0);
    const s = u >= 0 ? '+' : '-';
    return `${s}$${Math.abs(u).toFixed(2)} (${u >= 0 ? '+' : ''}${p.toFixed(2)}%)`;
  };

  const _medal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const _renderStrategyHubBar = () => {
    const bar = document.getElementById(_opts.mountId || 'strategyHubBar');
    if (!bar || !_snapshot || !Array.isArray(_snapshot.dock_systems)) return;

    const dock = _snapshot.dock_systems;
    const leader = _snapshot.top_leader || dock[0];
    const curSid = _opts.currentSystemId;
    const curObj = dock.find((x) => x.system_id === curSid);
    const curRank = curObj ? curObj.rank : '-';

    const top3Html = dock
      .slice(0, 3)
      .map((s) => {
        const isAct = s.system_id === curSid ? 'active' : '';
        const u = Number(s.net_pnl_usd || 0);
        const sgn = u >= 0 ? '+' : '-';
        const pnlCol = u >= 0 ? '#4ade80' : '#f87171';
        return `
          <button type="button" class="hub-pill ${isAct}" style="--pill-col:${_esc(s.theme || '#38bdf8')};"
            onclick="window.StrategyHub._navigate('${_esc(s.page)}', { manual: '1' })"
            title="${_esc(s.name)} (WR ${Number(s.winrate || 0).toFixed(1)}%)">
            <span class="hub-pill-rank">${_medal(s.rank)}</span>
            <span class="hub-pill-name">${_esc(s.icon)} ${_esc(s.short_name)}</span>
            <span class="hub-pill-pnl" style="color:${pnlCol};">${sgn}$${Math.abs(u).toFixed(0)}</span>
          </button>
        `;
      })
      .join('');

    const leaderHtml = leader
      ? `<button type="button" class="hub-leader-btn"
          onclick="window.StrategyHub._navigate('${_esc(leader.page)}', { manual: '1' })"
          title="Mở chiến lược đang có Profit cao nhất">
          🥇 #1 LÃI NHẤT: ${_esc(leader.icon)} ${_esc(leader.short_name)} (${leader.net_pnl_usd >= 0 ? '+' : '-'}$${Math.abs(Number(leader.net_pnl_usd || 0)).toFixed(2)} • WR ${Number(leader.winrate || 0).toFixed(1)}%)
        </button>`
      : '';

    bar.innerHTML = `
      <span class="hub-brand-tag">⚡ SILENT HUB</span>
      ${leaderHtml}
      <div class="hub-podium">${top3Html}</div>
      <button type="button" class="hub-all-btn" onclick="window.StrategyHub._openModal()">
        🏆 BXH (${dock.length} chiến lược) • Đang xem #${curRank} ▾
      </button>
    `;
  };

  const _renderHubTableBody = () => {
    const tbody = document.getElementById('hubTableBody');
    if (!tbody || !_snapshot || !Array.isArray(_snapshot.dock_systems)) return;

    const q = _searchTerm.trim().toLowerCase();
    const list = _snapshot.dock_systems.filter((s) => {
      const hitSearch =
        !q ||
        [s.short_name, s.name, s.badge, s.ea_name, s.magic].some((f) =>
          String(f || '').toLowerCase().includes(q)
        );
      const hitFilter =
        _filterType === 'ALL' ||
        (_filterType === 'PROFIT' && Number(s.net_pnl_usd || 0) > 0) ||
        (_filterType === 'OPEN' && Boolean(s.open_side)) ||
        (_filterType === 'WR50' && Number(s.winrate || 0) >= 50);
      return hitSearch && hitFilter;
    });

    list.sort((a, b) => {
      if (_sortType === 'WINRATE') return Number(b.winrate || 0) - Number(a.winrate || 0);
      if (_sortType === 'PF') return Number(b.profit_factor || 0) - Number(a.profit_factor || 0);
      if (_sortType === 'DD') return Number(a.max_dd_pct || 0) - Number(b.max_dd_pct || 0);
      return Number(b.net_pnl_usd || 0) - Number(a.net_pnl_usd || 0);
    });

    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:18px;">Không tìm thấy chiến lược phù hợp bộ lọc.</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map((s) => {
        const isCur = s.system_id === _opts.currentSystemId;
        const u = Number(s.net_pnl_usd || 0);
        const pnlCol = u >= 0 ? '#4ade80' : '#f87171';
        const openBadge = s.open_side
          ? `<span style="padding:2px 6px;border-radius:4px;font-weight:700;background:${
              s.open_side === 'BUY' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'
            };color:${s.open_side === 'BUY' ? '#4ade80' : '#f87171'};">OPEN ${_esc(s.open_side)}</span>`
          : '<span style="color:#64748b;">Chờ lệnh</span>';

        return `
          <tr class="${isCur ? 'hub-row-active' : ''}">
            <td>
              <div style="display:flex;gap:5px;">
                <button type="button" class="hub-act-btn hub-act-view"
                  onclick="window.StrategyHub._navigate('${_esc(s.page)}', { manual: '1' })">👁 Xem</button>
                <button type="button" class="hub-act-btn hub-act-copy"
                  onclick="window.StrategyHub._triggerCopy('${_esc(s.page)}', ${isCur})">⚡ Tải .ex5</button>
              </div>
            </td>
            <td style="font-weight:800;">${_medal(s.rank)}</td>
            <td>
              <div style="font-weight:700;color:#f8fafc;">${_esc(s.icon)} ${_esc(s.short_name)} ${
                isCur ? '<span style="font-size:10px;color:#38bdf8;">(Đang xem)</span>' : ''
              }</div>
              <div style="font-size:10.5px;color:#94a3b8;">${_esc(s.badge)} • Magic #${_esc(s.magic)}</div>
            </td>
            <td style="font-family:ui-monospace,monospace;">$${Number(s.equity || 10000).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
            <td style="font-family:ui-monospace,monospace;font-weight:700;color:${pnlCol};">${_fmtPnl(
          s.net_pnl_usd,
          s.net_pnl_pct
        )}</td>
            <td style="font-family:ui-monospace,monospace;">${Number(s.winrate || 0).toFixed(1)}% (${Number(
          s.total_trades || 0
        )})</td>
            <td style="font-family:ui-monospace,monospace;">${Number(s.profit_factor || 0).toFixed(2)}</td>
            <td style="font-family:ui-monospace,monospace;color:#f87171;">${Number(s.max_dd_pct || 0).toFixed(2)}%</td>
            <td>${openBadge}</td>
          </tr>
        `;
      })
      .join('');
  };

  const init = (opts) => {
    _opts = opts || {};
    const bar = document.getElementById(_opts.mountId || 'strategyHubBar');
    if (bar && !bar.innerHTML.trim()) {
      bar.innerHTML = `
        <span class="hub-brand-tag">⚡ SILENT HUB</span>
        <span style="font-size:11.5px;color:#94a3b8;">Đang xếp hạng chiến lược theo Profit thực tế...</span>
        <button type="button" class="hub-all-btn" onclick="window.StrategyHub._openModal()">🏆 BXH Chiến Lược ▾</button>
      `;
    }

    if (!document.getElementById('hubModal')) {
      const modalHtml = `
        <div id="hubModal" class="hub-modal-backdrop">
          <div class="hub-modal-box">
            <div class="hub-modal-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <div>
                <div style="font-size:15.5px;font-weight:800;color:#f8fafc;">🏆 Bảng Xếp Hạng Chiến Lược Silent (Ưu Tiên Profit Cao Nhất)</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Hỗ trợ tìm kiếm &amp; lọc tức thời cho hàng trăm chiến lược độc lập — chỉ 100% lệnh thực tế</div>
              </div>
              <button type="button" onclick="window.StrategyHub._closeModal()"
                style="background:#162033;border:1px solid #283852;color:#cbd5e1;border-radius:7px;padding:4px 10px;font-size:13px;cursor:pointer;">✕</button>
            </div>
            <div class="hub-toolbar">
              <input type="text" class="hub-search" placeholder="Tìm tên chiến lược, công nghệ, EA hoặc Magic #..." />
              <div class="hub-filters">
                <button type="button" class="hub-filter-chip active" data-filter="ALL">Tất cả</button>
                <button type="button" class="hub-filter-chip" data-filter="PROFIT">Đang có lãi (&gt; $0)</button>
                <button type="button" class="hub-filter-chip" data-filter="OPEN">Đang mở lệnh</button>
                <button type="button" class="hub-filter-chip" data-filter="WR50">Winrate ≥ 50%</button>
              </div>
              <select class="hub-sort" title="Sắp xếp theo">
                <option value="PROFIT">Xếp theo: Profit cao nhất</option>
                <option value="WINRATE">Xếp theo: Winrate cao nhất</option>
                <option value="PF">Xếp theo: Profit Factor</option>
                <option value="DD">Xếp theo: MaxDD thấp nhất</option>
              </select>
            </div>
            <div class="hub-table-scroll">
              <table class="hub-table">
                <thead>
                  <tr>
                    <th>Thao tác</th>
                    <th>Hạng</th>
                    <th>Chiến lược &amp; Công nghệ</th>
                    <th>Equity ($10k)</th>
                    <th>Profit Ròng</th>
                    <th>Winrate</th>
                    <th>PF</th>
                    <th>MaxDD</th>
                    <th>Vị thế</th>
                  </tr>
                </thead>
                <tbody id="hubTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = document.getElementById('hubModal');
      modal.addEventListener('click', (e) => {
        if (e.target === modal) _closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') _closeModal();
      });
      modal.querySelector('.hub-search').addEventListener('input', (e) => {
        _searchTerm = e.target.value || '';
        _renderHubTableBody();
      });
      modal.querySelectorAll('.hub-filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          modal.querySelectorAll('.hub-filter-chip').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          _filterType = chip.getAttribute('data-filter') || 'ALL';
          _renderHubTableBody();
        });
      });
      modal.querySelector('.hub-sort').addEventListener('change', (e) => {
        _sortType = e.target.value || 'PROFIT';
        _renderHubTableBody();
      });
    }

    if (_qs.get('open_copy') === '1' && typeof _opts.onOpenCopyModal === 'function') {
      setTimeout(() => _opts.onOpenCopyModal(), 150);
    }
  };

  const update = (snapshot) => {
    if (!snapshot || !snapshot.ok) return;
    _snapshot = snapshot;

    if (
      !_hasRedirected &&
      !_isManual &&
      !_isAutoLead &&
      _opts.currentSystemId === 'SILENT_EYES' &&
      snapshot.top_leader &&
      snapshot.top_leader.system_id !== _opts.currentSystemId
    ) {
      _hasRedirected = true;
      window.location.replace(buildPageUrl(snapshot.top_leader.page, { auto_lead: '1' }));
      return;
    }

    _renderStrategyHubBar();
    const modal = document.getElementById('hubModal');
    if (modal && modal.classList.contains('open')) {
      _renderHubTableBody();
    }
  };

  return {
    init,
    update,
    buildPageUrl,
    _openModal,
    _closeModal,
    _navigate,
    _triggerCopy,
  };
})();
