#!/usr/bin/env python3
"""Convenience launcher.

Double-click this file (or run ``python run.py``) to open the GUI. Pass any of
the CLI subcommands to use it from the command line, e.g.::

    python run.py scan --top 25
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tsx_scanner.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
