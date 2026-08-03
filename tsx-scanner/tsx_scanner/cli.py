"""Command-line interface. Runs from a plain terminal / Windows CMD.

Examples
--------
    python -m tsx_scanner                 # launch the interactive GUI
    python -m tsx_scanner scan            # scan and print the ranking
    python -m tsx_scanner scan --top 25 --export results.csv
    python -m tsx_scanner scan --limit 50 --refresh-universe
    python -m tsx_scanner update-universe # refresh the local TSX ticker list
    python -m tsx_scanner init-config     # create config.ini from the template
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from . import __version__
from . import config as cfg
from . import scanner as scanner_mod
from .models import StockData


def _log(msg: str) -> None:
    print(f"  {msg}", file=sys.stderr)


def _fmt(value, spec: str = "", dash: str = "-") -> str:
    if value is None or value == "":
        return dash
    try:
        return format(value, spec) if spec else str(value)
    except (ValueError, TypeError):
        return str(value)


def _print_table(results: list[StockData], top: int) -> None:
    rows = results[:top]
    header = f"{'#':>3}  {'TICKER':<10} {'COMPANY':<32} {'PRICE':>9} {'SCORE':>6}  {'SECTOR':<22}"
    print(header)
    print("-" * len(header))
    for r in rows:
        name = (r.name or "")[:32]
        sector = (r.sector or "")[:22]
        print(
            f"{_fmt(r.rank, '>3')}  {r.ticker:<10} {name:<32} "
            f"{_fmt(r.price, '>9,.2f')} {_fmt(r.score, '>6.2f')}  {sector:<22}"
        )
    print(f"\nShowing {len(rows)} of {len(results)} ranked companies.")


def cmd_scan(args: argparse.Namespace) -> int:
    config = cfg.load_config()
    scanner = scanner_mod.Scanner(config)

    last = {"done": 0}

    def progress(done: int, total: int, ticker: str) -> None:
        if done == total or done - last["done"] >= max(1, total // 20):
            last["done"] = done
            pct = (done / total * 100) if total else 0
            print(f"\r  Progress: {done}/{total} ({pct:4.0f}%)  ", end="", file=sys.stderr)

    results = scanner.run(
        limit=args.limit,
        force_universe_refresh=args.refresh_universe,
        progress=progress,
        log=_log,
    )
    print("", file=sys.stderr)

    if not results:
        print("No results. Add an API key to config.ini or check your connection.")
        return 1

    scanner_mod.save_scan(results)
    _print_table(results, args.top)

    if args.export:
        path = scanner_mod.export_csv(results, Path(args.export))
        print(f"\nExported full ranking to: {path}")
    return 0


def cmd_update_universe(args: argparse.Namespace) -> int:
    config = cfg.load_config()
    scanner = scanner_mod.Scanner(config)
    tickers = scanner.refresh_universe(log=_log)
    print(f"Universe updated: {len(tickers)} common shares stored at {cfg.UNIVERSE_CACHE}")
    return 0 if tickers else 1


def cmd_init_config(args: argparse.Namespace) -> int:
    target = cfg.PROJECT_DIR / "config.ini"
    template = cfg.PROJECT_DIR / "config.example.ini"
    if target.exists() and not args.force:
        print(f"{target} already exists. Use --force to overwrite.")
        return 1
    if not template.exists():
        print("config.example.ini not found next to the project.")
        return 1
    shutil.copyfile(template, target)
    print(f"Created {target}. Open it and paste your API keys (optional).")
    return 0


def cmd_gui(args: argparse.Namespace) -> int:
    try:
        from .gui import launch
    except Exception as exc:  # noqa: BLE001
        print(f"Could not start the GUI: {exc}")
        print("On Debian/Ubuntu install Tkinter with:  sudo apt install python3-tk")
        return 1
    launch()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tsx_scanner",
        description="Scan, score and rank every common share on the TSX.",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command")

    p_scan = sub.add_parser("scan", help="Run a scan and print the ranking.")
    p_scan.add_argument("--limit", type=int, default=None, help="Only scan the first N tickers (useful for a quick test).")
    p_scan.add_argument("--top", type=int, default=25, help="How many ranked rows to print (default 25).")
    p_scan.add_argument("--export", type=str, default=None, help="Write the full ranking to this CSV file.")
    p_scan.add_argument("--refresh-universe", action="store_true", help="Refetch the TSX ticker list before scanning.")
    p_scan.set_defaults(func=cmd_scan)

    p_uni = sub.add_parser("update-universe", help="Refresh the local TSX ticker list.")
    p_uni.set_defaults(func=cmd_update_universe)

    p_cfg = sub.add_parser("init-config", help="Create config.ini from the template.")
    p_cfg.add_argument("--force", action="store_true", help="Overwrite an existing config.ini.")
    p_cfg.set_defaults(func=cmd_init_config)

    p_gui = sub.add_parser("gui", help="Launch the interactive desktop GUI.")
    p_gui.set_defaults(func=cmd_gui)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "command", None):
        # No subcommand -> launch the GUI (double-click friendly).
        return cmd_gui(args)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
