# TSX Stock Scanner

A Python desktop application that retrieves the Toronto Stock Exchange common-share universe, collects market and fundamental data from free/freemium providers, calculates a custom score, ranks every stock, and displays results in an interactive table.

## Features

- Updates the TSX ticker universe from the public TSX company directory endpoint.
- Caches the ticker list locally in `data/tsx_universe.json`.
- Filters out ETFs, warrants, preferred shares, rights, funds, debentures, notes, and other non-common securities when the exchange metadata identifies them.
- Retrieves market and fundamental data with automatic provider fallback:
  1. FinancialModelingPrep
  2. Finnhub
  3. Alpha Vantage
  4. Yahoo Finance / yfinance
- Calculates a composite score from valuation, quality, growth, income, and market/risk factors.
- Shows ranked results in a sortable, filterable Tkinter desktop interface.
- Exports ranked results to CSV.
- Supports CMD/terminal usage with `--no-gui`.

## Setup

Python 3.10+ is recommended.

```bash
python -m pip install -r requirements.txt
cp config.example.ini config.ini
```

On minimal Linux installations, install Tkinter separately if you want the desktop UI:

```bash
sudo apt-get install python3-tk
```

On Windows CMD, you can also run:

```cmd
run_scanner.bat
```

The first application run creates `config.ini` automatically if it does not exist.

## API keys

Edit `config.ini` and enter any keys you have:

```ini
[api_keys]
financialmodelingprep = YOUR_FMP_KEY
finnhub = YOUR_FINNHUB_KEY
alpha_vantage = YOUR_ALPHA_VANTAGE_KEY
```

Keys are optional. If no key-backed provider succeeds, Yahoo Finance/yfinance is attempted last. Free tiers may rate-limit full TSX scans; increase `request_delay_seconds` in `config.ini` if needed.

## Run the desktop app

```bash
python -m tsx_scanner
```

Use the buttons to:

- **Scan TSX**: scan the cached universe, updating it first if no cache exists.
- **Update Universe + Scan**: refresh the TSX common-share list, then scan it.
- **Update Ticker List Only**: refresh the local universe cache without scanning.
- **Stop**: cancel after the current ticker completes.
- **Export CSV**: save the visible ranked data.
- **Open Config**: open `config.ini` to edit API keys and settings.

## Run from CMD/terminal

```bash
python -m tsx_scanner --no-gui --update-universe --export data/latest_results.csv
```

Useful options:

```bash
python -m tsx_scanner --no-gui --limit 25 --top 10
python -m tsx_scanner --no-gui --export ranked_tsx.csv
```

## Custom score

The score is bounded from 0 to 100 and combines:

- **Valuation (30%)**: lower P/E and price-to-book are better.
- **Quality (30%)**: higher ROE and profit margin, lower debt-to-equity.
- **Growth (18%)**: higher revenue growth.
- **Income (12%)**: higher dividend yield.
- **Market/risk (10%)**: lower beta, better 52-week change, higher trading volume.

Missing values receive neutral component scores. Stocks without a usable live price are heavily penalized and retain provider error details in the results table.

## Tests

```bash
python -m unittest discover
```

## Project structure

```text
tsx_scanner/
  app.py        Desktop UI and CLI entrypoint
  config.py     Config file handling
  models.py     Shared dataclasses
  providers.py  FMP, Finnhub, Alpha Vantage, Yahoo providers
  scanner.py    Scan orchestration and CSV output
  scoring.py    Custom ranking model
  universe.py   TSX universe retrieval and caching
```
