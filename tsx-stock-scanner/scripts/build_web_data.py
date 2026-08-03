#!/usr/bin/env python3
"""Export scanner results to the public web app data folder."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from src.config import load_config
from src.scanner import TSXScanner


def build_web_data(limit: int | None = None, refresh_universe: bool = False) -> Path:
    config = load_config()
    scanner = TSXScanner(config)
    output_dir = PACKAGE_ROOT / "web" / "data"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "results.json"

    if refresh_universe:
        scanner.refresh_universe()

    tickers = scanner.load_universe()
    if limit:
        tickers = tickers[:limit]

    print(f"Scanning {len(tickers)} TSX stocks for web export...")

    def progress(done: int, total: int, ticker: str) -> None:
        if done % 25 == 0 or done == total:
            print(f"  {done}/{total} ({ticker})", flush=True)

    results = scanner.scan(tickers=tickers, progress_callback=progress, max_workers=8)
    payload = {
        "scanned_at": scanner.results_path.read_text(encoding="utf-8")
        if scanner.results_path.exists()
        else None,
    }

    if scanner.results_path.exists():
        payload = json.loads(scanner.results_path.read_text(encoding="utf-8"))

    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} stocks to {output_path}")
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Build web data for TSX Stock Scanner")
    parser.add_argument("--limit", type=int, help="Limit number of tickers to scan")
    parser.add_argument("--refresh-universe", action="store_true", help="Refresh ticker universe first")
    args = parser.parse_args()
    build_web_data(limit=args.limit, refresh_universe=args.refresh_universe)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
