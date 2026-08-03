"""Command-line interface for the TSX scanner."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
from pathlib import Path

from config import DEFAULT_CONFIG_PATH, load_config
from providers import ProviderRouter
from scanner import StockScanner
from universe import UniverseManager


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="TSX common-share scanner and ranking tool.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH), help="Path to config JSON file")
    sub = parser.add_subparsers(dest="command", required=True)

    update = sub.add_parser("update-universe", help="Refresh TSX listings and save cache")
    update.add_argument("--show", action="store_true", help="Print symbols after update")

    scan = sub.add_parser("scan", help="Scan and rank TSX stocks")
    scan.add_argument("--refresh-universe", action="store_true", help="Refresh listings before scan")
    scan.add_argument("--limit", type=int, default=0, help="Limit number of symbols")
    scan.add_argument("--output", default="", help="CSV output path")
    scan.add_argument("--top", type=int, default=30, help="How many rows to print in terminal")
    return parser


def run_update_universe(config_path: str, show: bool) -> int:
    config = load_config(config_path)
    router = ProviderRouter(config)
    manager = UniverseManager(router, config.universe_path)
    listings = manager.refresh()
    print(f"Universe updated: {len(listings)} TSX common shares saved to {config.universe_path}")
    if show:
        for listing in listings:
            print(f"{listing.symbol:10} {listing.name}")
    return 0


def run_scan(
    config_path: str, refresh_universe: bool, limit: int, output: str, top: int
) -> int:
    config = load_config(config_path)
    router = ProviderRouter(config)
    manager = UniverseManager(router, config.universe_path)
    scanner = StockScanner(router, max_workers=config.max_workers)

    listings = manager.refresh() if refresh_universe else manager.load_cached()
    if not listings:
        listings = manager.refresh()

    effective_limit = limit if limit > 0 else config.max_symbols
    if effective_limit > 0:
        listings = listings[:effective_limit]

    print(f"Scanning {len(listings)} symbols...")
    rows = scanner.scan(
        listings,
        progress_callback=lambda done, total, symbol: print(
            f"\r{done}/{total} {symbol:10}", end="", flush=True
        ),
    )
    print()
    print(f"Completed scan. Results: {len(rows)}")

    for idx, row in enumerate(rows[:top], start=1):
        print(
            f"{idx:4} {row.symbol:10} {row.score:6.2f} "
            f"{(row.company_name or '')[:45]:45} src={row.source}"
        )

    output_path = output.strip()
    if not output_path:
        output_path = f"tsx_rankings_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    with Path(output_path).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "rank",
                "symbol",
                "company_name",
                "score",
                "price",
                "market_cap",
                "pe_ratio",
                "pb_ratio",
                "roe",
                "profit_margin",
                "debt_to_equity",
                "revenue_growth",
                "source",
                "errors",
            ]
        )
        for idx, row in enumerate(rows, start=1):
            writer.writerow(
                [
                    idx,
                    row.symbol,
                    row.company_name,
                    row.score,
                    row.price,
                    row.market_cap,
                    row.pe_ratio,
                    row.pb_ratio,
                    row.roe,
                    row.profit_margin,
                    row.debt_to_equity,
                    row.revenue_growth,
                    row.source,
                    "; ".join(row.errors),
                ]
            )
    print(f"CSV saved: {output_path}")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "update-universe":
        return run_update_universe(args.config, args.show)
    if args.command == "scan":
        return run_scan(args.config, args.refresh_universe, args.limit, args.output, args.top)
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
