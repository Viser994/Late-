#!/usr/bin/env python3
"""TSX Screener — main entry point.

Usage
-----
  python main.py scan              # Full scan (cached tickers + data)
  python main.py scan --refresh    # Force-refresh ticker list + data
  python main.py scan --no-cache   # Skip data cache, fetch fresh data
  python main.py scan --top 25     # Scan and show only top 25 results
  python main.py update            # Refresh ticker list only
  python main.py show              # Show previously cached results
  python main.py detail <TICKER>   # Show detail for one ticker
  python main.py --help            # Show this help
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import List, Optional

# ── Ensure src/ is on the path when run directly ──────────────────────────────
_ROOT = Path(__file__).parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from rich.console import Console
from rich.panel import Panel

from src.config import load_config
from src.universe import get_tsx_tickers
from src.fetcher import DataFetcher, StockData
from src.scorer import score_universe, ScoredStock
from src.display import (
    build_results_table,
    build_detail_panel,
    build_sector_summary,
    interactive_session,
    make_progress,
    console,
)

logger = logging.getLogger(__name__)


# ─── Result persistence ───────────────────────────────────────────────────────

_RESULTS_FILE = _ROOT / "data" / "last_results.json"


def _save_results(stocks: List[ScoredStock]) -> None:
    import json
    _RESULTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = [
        {
            "rank": s.rank,
            "score_total": s.score_total,
            "score_value": s.score_value,
            "score_quality": s.score_quality,
            "score_growth": s.score_growth,
            "score_momentum": s.score_momentum,
            "score_dividend": s.score_dividend,
            "data_quality": s.data_quality,
            "data": s.data.to_dict(),
        }
        for s in stocks
    ]
    _RESULTS_FILE.write_text(json.dumps(payload, indent=2))


def _load_results() -> Optional[List[ScoredStock]]:
    import json
    if not _RESULTS_FILE.exists():
        return None
    try:
        payload = json.loads(_RESULTS_FILE.read_text())
        results = []
        for item in payload:
            sc = ScoredStock(
                data=StockData.from_dict(item["data"]),
                rank=item["rank"],
                score_total=item["score_total"],
                score_value=item["score_value"],
                score_quality=item["score_quality"],
                score_growth=item["score_growth"],
                score_momentum=item["score_momentum"],
                score_dividend=item["score_dividend"],
                data_quality=item.get("data_quality", 0),
            )
            results.append(sc)
        return results
    except Exception as exc:
        console.print(f"[yellow]Warning:[/yellow] Could not load cached results: {exc}")
        return None


# ─── Commands ─────────────────────────────────────────────────────────────────

def cmd_update(config) -> None:
    """Refresh the TSX ticker list."""
    console.print("[cyan]Refreshing TSX ticker list…[/cyan]")
    tickers = get_tsx_tickers(config, force_refresh=True)
    console.print(f"[green]✓[/green] Retrieved [bold]{len(tickers)}[/bold] TSX common-share tickers.")


def cmd_scan(
    config,
    force_refresh: bool = False,
    no_cache: bool = False,
    non_interactive: bool = False,
    top_n: Optional[int] = None,
) -> None:
    """Full scan: fetch data for all TSX tickers, score, rank, display."""
    # 1. Get ticker universe
    console.print()
    console.print(
        Panel.fit(
            "[bold cyan]TSX Stock Screener[/bold cyan]\n"
            "[dim]Fetching fundamental & market data for every TSX common share[/dim]",
            border_style="cyan",
        )
    )

    console.print("\n[cyan]Step 1/3:[/cyan] Loading TSX ticker universe…")
    tickers = get_tsx_tickers(config, force_refresh=force_refresh)
    console.print(f"  → [bold]{len(tickers)}[/bold] tickers in universe\n")

    # 2. Fetch data
    console.print("[cyan]Step 2/3:[/cyan] Fetching stock data…")
    console.print(
        "  [dim]Primary source: yfinance. "
        + ("FMP active. " if config.api_keys.financialmodelingprep else "")
        + ("Finnhub active. " if config.api_keys.finnhub else "")
        + "This may take several minutes for large universes.[/dim]\n"
    )

    fetcher = DataFetcher(config)
    use_cache = not no_cache

    results: List[StockData] = []
    failed = 0

    with make_progress() as progress:
        task = progress.add_task("Fetching data", total=len(tickers))

        def _on_progress(done: int, total: int, ticker: str):
            progress.update(task, completed=done, description=f"Fetching {ticker:<8}")

        results = fetcher.fetch_all(tickers, use_cache=use_cache, progress_callback=_on_progress)

    priced = sum(1 for r in results if r.price is not None)
    failed = len(results) - priced
    console.print(
        f"\n  → [bold]{priced}[/bold] stocks with price data"
        + (f", [dim]{failed} without data[/dim]" if failed else "")
    )

    # 3. Score & rank
    console.print("\n[cyan]Step 3/3:[/cyan] Scoring and ranking…")
    scored = score_universe(results, config.weights)
    console.print(f"  → Ranked [bold]{len(scored)}[/bold] stocks\n")

    # Save results
    _save_results(scored)

    if top_n:
        scored = scored[:top_n]

    if non_interactive:
        table = build_results_table(scored, page=1, per_page=min(len(scored), 100))
        console.print(table)
    else:
        interactive_session(scored, per_page=config.settings.results_per_page)


def cmd_show(config, non_interactive: bool = False, top_n: Optional[int] = None) -> None:
    """Show previously cached scan results."""
    scored = _load_results()
    if not scored:
        console.print(
            "[yellow]No cached results found.[/yellow] Run [bold]python main.py scan[/bold] first."
        )
        return

    console.print(f"[green]✓[/green] Loaded [bold]{len(scored)}[/bold] cached results.")
    if top_n:
        scored = scored[:top_n]
    if non_interactive:
        console.print(build_results_table(scored, page=1, per_page=min(len(scored), 100)))
    else:
        interactive_session(scored, per_page=config.settings.results_per_page)


def cmd_detail(config, ticker: str) -> None:
    """Show detailed data for a single ticker."""
    scored = _load_results()
    if scored:
        match = next((s for s in scored if s.data.ticker.upper() == ticker.upper()), None)
        if match:
            console.print(build_detail_panel(match))
            return

    # Not in cache — fetch fresh
    console.print(f"[cyan]Fetching fresh data for {ticker}…[/cyan]")
    fetcher = DataFetcher(config)
    data = fetcher.fetch_one(ticker.upper(), use_cache=True)
    sc = ScoredStock(data=data, rank=0)
    console.print(build_detail_panel(sc))
    console.print("[dim](Score/rank not available — run a full scan first)[/dim]")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tsx-screener",
        description="TSX Stock Screener — ranks every TSX common share by a multi-factor score.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Path to config.ini (default: auto-detected)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="WARNING",
        help="Logging verbosity (default: WARNING)",
    )

    sub = parser.add_subparsers(dest="command")

    # scan
    scan_p = sub.add_parser("scan", help="Run a full scan of all TSX stocks")
    scan_p.add_argument(
        "--refresh",
        action="store_true",
        help="Force-refresh the TSX ticker list before scanning",
    )
    scan_p.add_argument(
        "--no-cache",
        action="store_true",
        dest="no_cache",
        help="Bypass the data cache and fetch fresh data for every stock",
    )
    scan_p.add_argument(
        "--no-interactive",
        action="store_true",
        dest="non_interactive",
        help="Print results and exit (no interactive pager)",
    )
    scan_p.add_argument(
        "--top",
        type=int,
        default=None,
        metavar="N",
        help="Show only the top N results",
    )

    # update
    sub.add_parser("update", help="Refresh the cached TSX ticker list")

    # show
    show_p = sub.add_parser("show", help="Show previously cached scan results")
    show_p.add_argument(
        "--no-interactive",
        action="store_true",
        dest="non_interactive",
        help="Print results and exit (no interactive pager)",
    )
    show_p.add_argument(
        "--top",
        type=int,
        default=None,
        metavar="N",
        help="Show only the top N results",
    )

    # detail
    detail_p = sub.add_parser("detail", help="Show detailed data for one ticker")
    detail_p.add_argument("ticker", help="TSX ticker symbol (e.g. SHOP)")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(levelname)s  %(name)s  %(message)s",
    )

    # Load config
    try:
        config = load_config(args.config)
    except Exception as exc:
        console.print(f"[red]Config error:[/red] {exc}")
        sys.exit(1)

    # Dispatch
    if args.command == "scan":
        cmd_scan(
            config,
            force_refresh=args.refresh,
            no_cache=args.no_cache,
            non_interactive=args.non_interactive,
            top_n=args.top,
        )
    elif args.command == "update":
        cmd_update(config)
    elif args.command == "show":
        cmd_show(config, non_interactive=args.non_interactive, top_n=args.top)
    elif args.command == "detail":
        cmd_detail(config, args.ticker)
    else:
        parser.print_help()
        console.print(
            "\n[dim]Quick start:[/dim]\n"
            "  [cyan]python main.py scan --top 25 --no-interactive[/cyan]   "
            "— Show top 25 stocks immediately\n"
            "  [cyan]python main.py scan[/cyan]                              "
            "— Full interactive scan\n"
            "  [cyan]python main.py detail SHOP[/cyan]                       "
            "— Detail view for Shopify\n"
        )


if __name__ == "__main__":
    main()
