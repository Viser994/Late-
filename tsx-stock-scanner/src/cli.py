from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from src.config import DEFAULT_CONFIG_PATH, load_config
from src.scanner import TSXScanner

logger = logging.getLogger(__name__)


def _format_price(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.2f}"


def _format_number(value: float | None, decimals: int = 2) -> str:
    if value is None:
        return "N/A"
    return f"{value:,.{decimals}f}"


def _format_percent(value: float | None) -> str:
    if value is None:
        return "N/A"
    # Ratios are stored as decimals (0.05 = 5%).
    display = value * 100 if abs(value) <= 1 else value
    return f"{display:.2f}%"


def _print_table(results: list, top: int) -> None:
    print(f"\n{'Rank':<6}{'Ticker':<8}{'Score':<8}{'Price':<12}{'P/E':<10}{'ROE':<10}{'Company':<36}{'Source'}")
    print("-" * 110)
    for stock in results[:top]:
        print(
            f"{stock.rank:<6}"
            f"{stock.ticker:<8}"
            f"{_format_number(stock.score):<8}"
            f"{_format_price(stock.current_price):<12}"
            f"{_format_number(stock.pe_ratio):<10}"
            f"{_format_percent(stock.roe):<10}"
            f"{(stock.company_name or '')[:34]:<36}"
            f"{stock.data_source}"
        )


def _print_json(results: list) -> None:
    payload = {
        "count": len(results),
        "stocks": [stock.to_dict() for stock in results],
    }
    print(json.dumps(payload, indent=2))


def run_scan(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config) if args.config else None)
    scanner = TSXScanner(config)

    if args.refresh_universe:
        tickers = scanner.refresh_universe()
        if args.format != "json":
            print(f"Refreshed universe: {len(tickers)} common shares")
    else:
        tickers = scanner.load_universe()

    if args.limit:
        tickers = tickers[: args.limit]

    if args.format != "json":
        print(f"Scanning {len(tickers)} TSX stocks...")

    def progress(done: int, total: int, ticker: str) -> None:
        if args.verbose or (done % 25 == 0 or done == total):
            if args.format != "json":
                print(f"  Progress: {done}/{total} ({ticker})", flush=True)

    results = scanner.scan(tickers=tickers, progress_callback=progress)

    if args.format == "json":
        _print_json(results)
    else:
        print(f"\nScanned {len(results)} stocks with data.")
        _print_table(results, args.top or 25)

    if args.export:
        export_path = Path(args.export)
        if export_path.suffix.lower() == ".xlsx":
            scanner.export_excel(results, export_path)
        else:
            scanner.export_csv(results, export_path)
        if args.format != "json":
            print(f"\nExported results to {export_path}")

    return 0


def run_universe(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config) if args.config else None)
    scanner = TSXScanner(config)
    tickers = scanner.refresh_universe() if args.refresh else scanner.load_universe()

    if args.format == "json":
        cached = scanner.universe.load_cached() or {}
        print(
            json.dumps(
                {
                    "count": len(tickers),
                    "updated_at": cached.get("updated_at"),
                    "source": cached.get("source"),
                    "tickers": tickers if args.show else None,
                },
                indent=2,
            )
        )
        return 0

    print(f"TSX universe: {len(tickers)} common shares")
    if args.show:
        for ticker in tickers:
            print(ticker)
    return 0


def run_lookup(args: argparse.Namespace) -> int:
    """Fetch and display data for a single ticker."""
    config = load_config(Path(args.config) if args.config else None)
    scanner = TSXScanner(config)
    ticker = args.ticker.upper().replace(".TO", "")

    data = scanner.aggregator.fetch_stock_data(ticker)
    if not data:
        print(f"No data found for {ticker}", file=sys.stderr)
        return 1

    ranked = scanner.scorer.score([data])
    stock = ranked[0]

    if args.format == "json":
        print(json.dumps(stock.to_dict(), indent=2))
        return 0

    print(f"\n{stock.company_name} ({stock.ticker})")
    print(f"  Price:         {_format_price(stock.current_price)}")
    print(f"  Market Cap:    {_format_number(stock.market_cap, 0)}")
    print(f"  P/E:           {_format_number(stock.pe_ratio)}")
    print(f"  P/B:           {_format_number(stock.pb_ratio)}")
    print(f"  ROE:           {_format_percent(stock.roe)}")
    print(f"  Debt/Equity:   {_format_number(stock.debt_to_equity)}")
    print(f"  Rev Growth:    {_format_percent(stock.revenue_growth)}")
    print(f"  Div Yield:     {_format_percent(stock.dividend_yield)}")
    print(f"  Profit Margin: {_format_percent(stock.profit_margin)}")
    print(f"  EPS:           {_format_number(stock.eps)}")
    print(f"  Sector:        {stock.sector or 'N/A'}")
    print(f"  Industry:      {stock.industry or 'N/A'}")
    print(f"  Data Source:   {stock.data_source}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="TSX Stock Scanner - scan, score, and rank Toronto Stock Exchange equities.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py scan                          Scan all TSX stocks, show top 25
  python main.py scan --limit 50 --top 10      Scan 50 stocks, show top 10
  python main.py scan --export results.csv     Export full rankings to CSV
  python main.py scan --format json            Output results as JSON
  python main.py universe --refresh --show     Refresh and list all tickers
  python main.py lookup RY                     Look up Royal Bank data
  python main.py --gui                         Launch desktop GUI
        """,
    )
    parser.add_argument(
        "--config",
        help=f"Path to config file (default: {DEFAULT_CONFIG_PATH})",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose progress output",
    )
    parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="table",
        help="Output format (default: table)",
    )

    subparsers = parser.add_subparsers(dest="command")

    scan_parser = subparsers.add_parser("scan", help="Scan and rank TSX stocks")
    scan_parser.add_argument("--refresh-universe", action="store_true", help="Refresh ticker list before scan")
    scan_parser.add_argument("--limit", type=int, help="Limit number of tickers to scan")
    scan_parser.add_argument("--top", type=int, default=25, help="Show top N ranked stocks (table mode)")
    scan_parser.add_argument("--export", help="Export results to CSV or XLSX file")
    scan_parser.set_defaults(func=run_scan)

    universe_parser = subparsers.add_parser("universe", help="Show or refresh TSX ticker universe")
    universe_parser.add_argument("--refresh", action="store_true", help="Force refresh ticker list")
    universe_parser.add_argument("--show", action="store_true", help="Print all tickers")
    universe_parser.set_defaults(func=run_universe)

    lookup_parser = subparsers.add_parser("lookup", help="Look up a single ticker")
    lookup_parser.add_argument("ticker", help="TSX ticker symbol (e.g. RY or SHOP)")
    lookup_parser.set_defaults(func=run_lookup)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    log_level = logging.DEBUG if getattr(args, "verbose", False) else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    if not args.command:
        parser.print_help()
        return 1

    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
