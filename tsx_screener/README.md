# TSX Stock Screener

A command-line application that scans every common share listed on the **Toronto Stock Exchange (TSX)**, fetches fundamental and market data from multiple free sources, calculates a multi-factor composite score, and ranks every stock.

---

## Features

- **Full TSX universe** — automatically fetches all TSX common shares and filters out ETFs, warrants, preferred shares, rights, funds, and debentures
- **Multi-source data with automatic fallback**: FinancialModelingPrep → Finnhub → yfinance
- **Multi-factor scoring (0–100)**:
  - **Value** (25%): P/E, P/B, EV/EBITDA
  - **Quality** (25%): ROE, gross margin, debt/equity, current ratio
  - **Growth** (25%): revenue growth YoY, earnings growth YoY
  - **Momentum** (15%): 1M, 3M, 6M price returns
  - **Dividend** (10%): dividend yield
- **Smart caching**: ticker list cached 7 days, stock data cached 1 day
- **Interactive terminal UI** with pagination, sorting, filtering by sector, and stock detail views
- **Zero required API keys** — yfinance works out of the box

---

## Setup

### 1. Install dependencies

```bash
cd tsx_screener
pip install -r requirements.txt
```

### 2. Configure API keys (optional but recommended)

Copy and edit the configuration file:

```bash
cp config.ini config.ini
```

Open `config.ini` and add your free API keys:

```ini
[api_keys]
financialmodelingprep = YOUR_FMP_KEY_HERE   # https://financialmodelingprep.com
finnhub               = YOUR_FH_KEY_HERE    # https://finnhub.io
alpha_vantage         = YOUR_AV_KEY_HERE    # https://www.alphavantage.co
```

All keys are **optional**. Without any key, the app uses `yfinance` (free, no registration).

---

## Usage

```
python main.py <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `scan` | Full scan: fetch data for all TSX tickers, score, rank |
| `scan --refresh` | Force-refresh ticker list before scanning |
| `scan --no-cache` | Bypass data cache, fetch fresh data for every stock |
| `scan --top 25 --no-interactive` | Show top 25 stocks and exit |
| `update` | Refresh the cached TSX ticker list only |
| `show` | Show previously cached scan results (no re-fetch) |
| `show --top 50` | Show top 50 from cache |
| `detail SHOP` | Show detailed data for a single ticker |

### Interactive mode commands

Once the scan is complete, you enter an interactive browser:

| Key | Action |
|-----|--------|
| `n` | Next page |
| `p` | Previous page |
| `g 3` | Go to page 3 |
| `s score` | Sort by composite score |
| `s roe` | Sort by ROE |
| `s pe` | Sort by P/E |
| `s div` | Sort by dividend yield |
| `s 3m` | Sort by 3-month return |
| `f Energy` | Filter by sector (partial match) |
| `fc` | Clear sector filter |
| `d SHOP` | Show detailed view for SHOP |
| `sec` | Show sector summary |
| `top 10` | Show top 10 |
| `h` | Help |
| `q` | Quit |

---

## Quick Start Examples

```bash
# Show the top 25 TSX stocks immediately (no interactive mode)
python main.py scan --top 25 --no-interactive

# Full interactive scan
python main.py scan

# Refresh everything and scan
python main.py scan --refresh --no-cache

# Show detail for Shopify
python main.py detail SHOP

# Browse cached results from last scan
python main.py show
```

---

## Configuration Reference

All settings live in `config.ini`:

```ini
[api_keys]
financialmodelingprep =     # FMP free: 250 req/day
finnhub               =     # Finnhub free: 60 req/min
alpha_vantage         =     # AV free: 25 req/day

[settings]
data_cache_days     = 1     # Re-fetch stock data after N days
ticker_cache_days   = 7     # Re-fetch ticker list after N days
max_workers         = 8     # Parallel fetch threads
min_market_cap_millions = 0 # Minimum market cap filter (CAD M)
results_per_page    = 50    # Rows per page in interactive mode

[scoring_weights]
value    = 0.25
quality  = 0.25
growth   = 0.25
momentum = 0.15
dividend = 0.10
```

Environment variables override `config.ini`:
- `FMP_API_KEY`
- `FINNHUB_API_KEY`
- `ALPHA_VANTAGE_API_KEY`

---

## Data Collected Per Stock

| Field | Description |
|-------|-------------|
| Ticker, Name | Identifier |
| Sector, Industry | Classification |
| Price (CAD) | Current market price |
| Market Cap | Total market capitalisation |
| 52W High / Low | 52-week price range |
| Beta | Market beta |
| P/E, Forward P/E | Price-to-earnings ratios |
| P/B, P/S | Price-to-book, price-to-sales |
| EV/EBITDA | Enterprise value multiple |
| ROE, ROA | Return on equity / assets |
| Gross / Op / Net Margin | Profitability margins |
| Revenue Growth YoY | Top-line growth |
| Earnings Growth YoY | Bottom-line growth |
| Debt/Equity | Leverage ratio |
| Current Ratio | Liquidity |
| EPS (TTM / Forward) | Earnings per share |
| Dividend Yield | Annual dividend / price |
| 1M, 3M, 6M, 1Y Returns | Price performance |

---

## File Structure

```
tsx_screener/
├── main.py              Entry point
├── requirements.txt
├── config.ini           API keys and settings (edit this)
├── README.md
├── src/
│   ├── config.py        Configuration loader
│   ├── universe.py      TSX ticker list management
│   ├── fetcher.py       Multi-source data fetcher
│   ├── scorer.py        Multi-factor scoring engine
│   └── display.py       Rich terminal UI
└── data/
    ├── tsx_tickers.json Cached ticker list
    ├── last_results.json Cached scan results
    └── cache/           Per-stock data cache (one JSON per ticker)
```

---

## Notes

- **Rate limits**: The free yfinance tier has no hard rate limit, but fetching 250+ stocks in parallel can occasionally trigger temporary blocks. The app uses 8 threads by default; reduce `max_workers` in `config.ini` if you see many failures.
- **Data quality**: yfinance data quality varies by stock. Large-cap stocks have complete data; small-caps may have gaps. The "Data Quality %" column shows how complete each stock's data is.
- **TSX vs TSX-V**: The seed list and FMP fetch focus on the main TSX board. TSX Venture Exchange stocks can be added manually to the seed list in `src/universe.py`.
