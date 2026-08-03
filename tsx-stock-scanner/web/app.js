const state = {
  stocks: [],
  filtered: [],
  sortKey: "rank",
  sortAsc: true,
  selectedTicker: null,
};

const fmt = {
  money(value) {
    if (value == null || Number.isNaN(value)) return "—";
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  number(value, digits = 2) {
    if (value == null || Number.isNaN(value)) return "—";
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  },
  percent(value) {
    if (value == null || Number.isNaN(value)) return "—";
    const display = Math.abs(value) <= 1 ? value * 100 : value;
    return `${display.toFixed(2)}%`;
  },
  cap(value) {
    if (value == null || Number.isNaN(value)) return "—";
    const n = Number(value);
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toLocaleString();
  },
};

function scoreClass(score) {
  if (score >= 70) return "score-high";
  if (score >= 45) return "score-mid";
  return "score-low";
}

async function loadData() {
  const response = await fetch("data/results.json");
  if (!response.ok) {
    throw new Error("Could not load scan results.");
  }
  const payload = await response.json();
  state.stocks = payload.stocks || [];
  state.filtered = [...state.stocks];
  renderMeta(payload);
  renderStats();
  populateSectors();
  renderTable();
}

function renderMeta(payload) {
  const scannedAt = payload.scanned_at
    ? new Date(payload.scanned_at).toLocaleString()
    : "Unknown";
  document.getElementById("meta").innerHTML = `
    <span class="badge">${payload.count || state.stocks.length} stocks</span>
    <span class="badge">Updated ${scannedAt}</span>
  `;
}

function renderStats() {
  const scores = state.stocks.map((s) => s.score).filter((v) => v != null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const sectors = new Set(state.stocks.map((s) => s.sector).filter(Boolean));
  document.getElementById("stats").innerHTML = `
    <div class="stat-card"><div class="stat-label">Stocks Ranked</div><div class="stat-value">${state.stocks.length}</div></div>
    <div class="stat-card"><div class="stat-label">Average Score</div><div class="stat-value">${avg.toFixed(1)}</div></div>
    <div class="stat-card"><div class="stat-label">Top Score</div><div class="stat-value">${scores.length ? Math.max(...scores).toFixed(1) : "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Sectors</div><div class="stat-value">${sectors.size}</div></div>
  `;
}

function populateSectors() {
  const select = document.getElementById("sector-filter");
  const sectors = [...new Set(state.stocks.map((s) => s.sector).filter(Boolean))].sort();
  sectors.forEach((sector) => {
    const option = document.createElement("option");
    option.value = sector;
    option.textContent = sector;
    select.appendChild(option);
  });
}

function applyFilters() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const sector = document.getElementById("sector-filter").value;
  state.filtered = state.stocks.filter((stock) => {
    const matchesQuery =
      !query ||
      stock.ticker.toLowerCase().includes(query) ||
      (stock.company_name || "").toLowerCase().includes(query);
    const matchesSector = !sector || stock.sector === sector;
    return matchesQuery && matchesSector;
  });
  sortStocks();
  renderTable();
}

function sortStocks() {
  const { sortKey, sortAsc } = state;
  state.filtered.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string") {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortAsc ? av - bv : bv - av;
  });
}

function renderTable() {
  const body = document.getElementById("results-body");
  if (!state.filtered.length) {
    body.innerHTML = `<tr><td colspan="10" class="loading">No stocks match your filters.</td></tr>`;
    return;
  }

  body.innerHTML = state.filtered
    .map(
      (stock) => `
      <tr data-ticker="${stock.ticker}" class="${state.selectedTicker === stock.ticker ? "selected" : ""}">
        <td>${stock.rank ?? "—"}</td>
        <td><strong>${stock.ticker}</strong></td>
        <td>${stock.company_name || "—"}</td>
        <td>${fmt.money(stock.current_price)}</td>
        <td><span class="score-pill ${scoreClass(stock.score || 0)}">${fmt.number(stock.score)}</span></td>
        <td>${fmt.number(stock.pe_ratio)}</td>
        <td>${fmt.percent(stock.roe)}</td>
        <td>${fmt.percent(stock.revenue_growth)}</td>
        <td>${fmt.percent(stock.dividend_yield)}</td>
        <td>${stock.sector || "—"}</td>
      </tr>`
    )
    .join("");

  body.querySelectorAll("tr[data-ticker]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedTicker = row.dataset.ticker;
      renderTable();
      renderDetail(state.stocks.find((s) => s.ticker === state.selectedTicker));
    });
  });
}

function renderDetail(stock) {
  const detail = document.getElementById("detail");
  if (!stock) {
    detail.innerHTML = `<h2>Stock Detail</h2><p class="placeholder">Select a row to view score breakdown and fundamentals.</p>`;
    return;
  }

  const breakdown = [
    ["Value", stock.value_score || 0],
    ["Quality", stock.quality_score || 0],
    ["Growth", stock.growth_score || 0],
    ["Health", stock.health_score || 0],
  ];

  detail.innerHTML = `
    <h2>${stock.company_name} (${stock.ticker})</h2>
    <div class="detail-grid">
      <div class="detail-item"><span>Composite Score</span><strong>${fmt.number(stock.score)}</strong></div>
      <div class="detail-item"><span>Price</span><strong>${fmt.money(stock.current_price)}</strong></div>
      <div class="detail-item"><span>Market Cap</span><strong>${fmt.cap(stock.market_cap)}</strong></div>
      <div class="detail-item"><span>P/E</span><strong>${fmt.number(stock.pe_ratio)}</strong></div>
      <div class="detail-item"><span>P/B</span><strong>${fmt.number(stock.pb_ratio)}</strong></div>
      <div class="detail-item"><span>ROE</span><strong>${fmt.percent(stock.roe)}</strong></div>
      <div class="detail-item"><span>Debt / Equity</span><strong>${fmt.number(stock.debt_to_equity)}</strong></div>
      <div class="detail-item"><span>Revenue Growth</span><strong>${fmt.percent(stock.revenue_growth)}</strong></div>
      <div class="detail-item"><span>Dividend Yield</span><strong>${fmt.percent(stock.dividend_yield)}</strong></div>
      <div class="detail-item"><span>Profit Margin</span><strong>${fmt.percent(stock.profit_margin)}</strong></div>
      <div class="detail-item"><span>EPS</span><strong>${fmt.number(stock.eps)}</strong></div>
      <div class="detail-item"><span>Source</span><strong>${stock.data_source || "—"}</strong></div>
    </div>
    <div class="breakdown">
      ${breakdown
        .map(
          ([label, value]) => `
          <div class="detail-item">
            <span>${label}</span>
            <strong>${fmt.number(value)}</strong>
            <div class="bar"><span style="width:${Math.min(100, value)}%"></span></div>
          </div>`
        )
        .join("")}
    </div>
  `;
}

function exportCsv() {
  const rows = state.filtered.length ? state.filtered : state.stocks;
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row[key] ?? "";
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tsx-rankings.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("sector-filter").addEventListener("change", applyFilters);
  document.getElementById("export-btn").addEventListener("click", exportCsv);

  document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const key = header.dataset.sort;
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = key === "rank" || key === "ticker" || key === "company_name";
      }
      sortStocks();
      renderTable();
    });
  });
}

bindEvents();
loadData().catch((error) => {
  document.getElementById("results-body").innerHTML =
    `<tr><td colspan="10" class="loading">${error.message}</td></tr>`;
});
