# TSX Stock Scanner

A desktop application that scans **every common share listed on the Toronto
Stock Exchange (TSX)**, retrieves fundamental and market data from several free
providers (with automatic fallback), computes a **custom composite score** for
each company, ranks them all, and shows the results in an interactive interface.

---

## Features

- **Full TSX universe** – automatically discovers every TSX listing and keeps
  only **common shares** (ETFs, warrants, preferred shares, rights, funds, trust
  units and debentures are filtered out). The ticker list is cached locally and
  can be refreshed on demand.
- **Multi-source data with fallback** – tries, in order:
  1. FinancialModelingPrep (free tier)
  2. Finnhub (free tier)
  3. Alpha Vantage (free tier)
  4. Yahoo Finance via `yfinance` (no key required)

  If one source fails or is missing a value, the next one is used. **You can run
  the whole app with no keys at all** – it falls back to Yahoo Finance.
- **Custom scoring** – a peer-relative, percentile-based composite across six
  categories: Value, Quality, Growth, Financial Health, Income and Momentum,
  with weights you control in `config.ini`.
- **Interactive GUI** (Tkinter) – sortable, searchable ranking table, per-company
  detail panel, live progress, stop button, and CSV export.
- **Command line mode** – run scans, refresh the universe and export CSVs from a
  plain terminal / Windows CMD.
- **Keys entered once** – all configuration lives in a single `config.ini`.

---

## Data collected per company

Company name, ticker, current price, currency, market cap, beta, 52-week
high/low, volume, P/E, P/B, P/S, PEG, ROE, ROA, profit & operating margins,
debt-to-equity, current ratio, free cash flow, revenue growth, earnings growth,
dividend yield, payout ratio, sector and industry.

---

## Installation

Requires **Python 3.10+**.

```bash
cd tsx-scanner
python -m pip install -r requirements.txt
```

Tkinter ships with the standard Python installer on **Windows and macOS**. On
Debian/Ubuntu Linux install it separately:

```bash
sudo apt install python3-tk
```

---

## Configuration (do this once)

```bash
python run.py init-config          # creates config.ini from the template
```

Then open `config.ini` and paste any free API keys you have. Every key is
optional – leave them blank to rely on Yahoo Finance.

- FinancialModelingPrep: https://site.financialmodelingprep.com/developer/docs
- Finnhub: https://finnhub.io/
- Alpha Vantage: https://www.alphavantage.co/support/#api-key

> **Full universe note:** discovering *every* TSX ticker requires a Finnhub or
> FMP key (their listing endpoints). With no key, the app uses a bundled seed
> list of ~100 major TSX common shares so it works out of the box; add a key and
> click **Refresh Universe** to pull the complete list.

---

## Usage

### GUI

```bash
python run.py           # or:  python -m tsx_scanner gui
```

- Click **Scan TSX** to fetch, score and rank.
- Type in the **Filter** box to search by ticker, company or sector.
- Click any column header to sort.
- Select a row to see the full breakdown in the detail panel.
- **Export CSV** saves the full ranking.

Tip: set a small **Limit** (e.g. `50`) for a quick first run.

### Command line (Windows CMD / terminal)

```bash
python -m tsx_scanner scan --top 25                 # print the top 25
python -m tsx_scanner scan --limit 50 --export out.csv
python -m tsx_scanner scan --refresh-universe       # refetch tickers first
python -m tsx_scanner update-universe               # refresh ticker list only
python -m tsx_scanner init-config                   # create config.ini
```

---

## How the score works

For every metric, each company is ranked against the whole scanned universe to
get a 0–100 percentile score (cheap valuations, high profitability, strong
growth, low leverage, healthy income and positive momentum all score higher).
Metric scores are averaged into six category scores, which are then combined
using the weights in `config.ini`:

| Category | Metrics | Default weight |
|----------|---------|----------------|
| Value | P/E, P/B, P/S (lower is better) | 0.20 |
| Quality | ROE, ROA, profit margin | 0.25 |
| Growth | revenue growth, EPS growth | 0.20 |
| Health | debt/equity (lower), current ratio | 0.15 |
| Income | dividend yield | 0.10 |
| Momentum | price position in 52-week range | 0.10 |

Companies with missing data are scored on the categories that *are* available
(the weights are renormalised per company), so partial data never zeroes a
company out unfairly.

---

## Project layout

```
tsx-scanner/
├── run.py                     # launcher (GUI by default, or CLI subcommands)
├── config.example.ini         # copy to config.ini and add keys
├── requirements.txt
└── tsx_scanner/
    ├── cli.py                 # command-line interface
    ├── gui.py                 # Tkinter interface
    ├── scanner.py             # orchestration, caching, CSV export
    ├── scoring.py             # percentile-based composite score
    ├── data_service.py        # provider fallback logic
    ├── universe.py            # TSX ticker discovery + common-share filter
    ├── config.py              # config.ini loading + paths
    ├── models.py              # Ticker / StockData data models
    ├── data/tsx_seed.json     # bundled fallback universe
    └── providers/             # fmp, finnhub, alpha_vantage, yfinance
```

Caches and exports are stored in a per-user directory
(`%LOCALAPPDATA%\TSXScanner` on Windows, `~/.tsx_scanner` elsewhere).

---

## Disclaimer

This tool is for research and educational purposes only. It is not investment
advice. Data from free APIs may be delayed, incomplete or inaccurate; always
verify figures before making any financial decision.
