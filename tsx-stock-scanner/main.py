#!/usr/bin/env python3
"""TSX Stock Scanner - entry point for GUI and CLI."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Ensure package root is on sys.path when run as script.
PACKAGE_ROOT = Path(__file__).resolve().parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="TSX Stock Scanner - scan, score, and rank Toronto Stock Exchange equities.",
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Launch the desktop GUI (default when no subcommand is given)",
    )
    parser.add_argument("--config", help="Path to config.json")

    # If extra args look like CLI subcommands, delegate to CLI module.
    if len(sys.argv) > 1 and sys.argv[1] in {
        "scan", "universe", "lookup", "-h", "--help", "-v", "--verbose",
    }:
        from src.cli import main as cli_main

        return cli_main()

    args, _ = parser.parse_known_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    from src.gui.app import run_gui

    config_path = Path(args.config) if args.config else None
    run_gui(config_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
