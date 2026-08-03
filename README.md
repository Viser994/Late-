# TSX Stock Scanner Desktop App

Desktop + command-line Python application that:

- Automatically retrieves TSX-listed securities
- Filters for **common shares** only
- Pulls market/fundamental data
- Applies a custom quantitative score
- Ranks all scanned stocks
- Displays results in an interactive desktop interface

## Features

- **Provider fallback order**
  1. FinancialModelingPrep
  2. Finnhub
  3. Alpha Vantage
  4. Yahoo Finance (yfinance)
- TSX universe cache in `data/tsx_universe.json`
- Excludes ETFs, warrants, preferred shares, funds, rights, and debentures
- Multi-threaded scanner for faster full-universe scans
- CSV export from both GUI and CLI

## Setup

1. Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

2. Create config file:

```bash
cp config.example.json config.json
```

3. Add your keys to `config.json` one time.

## Desktop App

Run:

```bash
python3 app.py
```

Workflow:

1. Click **Load Config**
2. Click **Update TSX Universe**
3. Click **Run Full Scan**
4. Sort columns, filter symbols, and export CSV

## CMD / CLI Usage

Update universe:

```bash
python3 cli.py --config config.json update-universe
```

Scan and export rankings:

```bash
python3 cli.py --config config.json scan --refresh-universe --output tsx_rankings.csv
```

Scan only first 100 symbols (quick test):

```bash
python3 cli.py --config config.json scan --limit 100 --top 20
```

## Scoring Model

Current weighted score (0-100):

- Value (P/E lower is better)
- Value (P/B lower is better)
- Quality (ROE higher is better)
- Profitability (net margin higher is better)
- Growth (revenue growth higher is better)
- Balance sheet strength (debt/equity lower is better)
- Momentum proxy (price vs. 52-week high)

You can tune weights and ranges in `scoring.py`.

## Notes

- Some providers have strict free-tier limits. The fallback router automatically tries the next source.
- If one provider fails for a symbol, the scanner still continues.
- TSX symbol suffix is normalized to `.TO`.
