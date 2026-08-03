# TSX Stock Scanner

A desktop application that scans every common share listed on the Toronto Stock Exchange (TSX), retrieves fundamental and market data, calculates a custom composite score, ranks all stocks, and displays results in an interactive GUI or command-line interface.

## Features

- **Full TSX universe** — Automatically retrieves all TSX common shares, filters out ETFs, warrants, preferred shares, rights, funds, and debentures
- **Multi-source data** — FinancialModelingPrep → Finnhub → Alpha Vantage → Yahoo Finance fallback chain
- **One-time API setup** — Enter keys once in `config.json`
- **Custom scoring** — Composite score across Value, Quality, Growth, and Financial Health
- **Interactive GUI** — Sortable table, search, score breakdown, CSV/Excel export
- **CLI mode** — Run scans from the command line for automation
- **Local caching** — Ticker list and scan results stored locally

## Quick Start

```bash
cd tsx-stock-scanner
pip install -r requirements.txt
cp config.example.json config.json
# Edit config.json with your API keys (at least one recommended)
python main.py
```

## API Keys

Edit `config.json` and add your free-tier API keys:

| Provider | Sign up |
|----------|---------|
| FinancialModelingPrep | https://financialmodelingprep.com/developer/docs/ |
| Finnhub | https://finnhub.io/register |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key |

Yahoo Finance (via `yfinance`) requires no API key and is used as the final fallback.

You can also enter keys via **Settings** in the GUI.

## Usage

### Public Web App

Once deployed to GitHub Pages, anyone can access the scanner at:

**https://viser994.github.io/Late-/tsx-stock-scanner/**

The site is rebuilt automatically on pushes to `main` and weekly via GitHub Actions.

### Desktop GUI

```bash
python main.py
```

- **Scan All** — Fetch data and rank all TSX common shares
- **Refresh Universe** — Update the local ticker list
- **Export** — Save results to CSV or Excel

### Command Line

```bash
# Scan and show top 25 ranked stocks
python main.py scan

# Refresh ticker universe, scan first 50, export to CSV
python main.py scan --refresh-universe --limit 50 --export results.csv

# Output results as JSON (for scripting)
python main.py scan --limit 10 --format json

# Look up a single ticker
python main.py lookup RY

# Show or refresh the ticker universe
python main.py universe --refresh --show
```

**Windows CMD:** use `scan.bat` instead of `python main.py`:

```cmd
scan.bat scan --limit 50 --export results.csv
scan.bat lookup SHOP
```

## Scoring Model

Each stock receives a 0–100 composite score based on percentile rankings within the scanned universe:

| Category | Weight | Metrics |
|----------|--------|---------|
| Value | 25% | P/E ratio, P/B ratio (lower is better) |
| Quality | 30% | ROE, profit margin |
| Growth | 25% | Revenue growth |
| Financial Health | 20% | Debt/equity (lower is better), dividend yield |

Weights are configurable in `config.json` under `scoring_weights`.

## Data Collected

For every company:

- Company Name
- Ticker
- Current Price
- Market Cap
- P/E Ratio
- P/B Ratio
- ROE
- Debt/Equity
- Revenue Growth
- Dividend Yield
- Profit Margin
- EPS
- Sector / Industry

## Project Structure

```
tsx-stock-scanner/
├── main.py              # Entry point (GUI + CLI)
├── config.example.json  # API key template
├── requirements.txt
└── src/
    ├── config.py        # Config loading
    ├── models.py        # Data models
    ├── universe.py      # TSX ticker management
    ├── scorer.py        # Scoring engine
    ├── scanner.py       # Scan orchestration
    ├── cli.py           # Command-line interface
    ├── gui/app.py       # Desktop GUI
    └── data_providers/  # FMP, Finnhub, Alpha Vantage, yfinance
```

## License

MIT
