"""High-level scan orchestration: universe -> data -> score -> results."""

from __future__ import annotations

import csv
import json
import time
from pathlib import Path
from typing import Callable, Optional

from . import config as cfg
from . import universe as universe_mod
from .config import AppConfig
from .data_service import DataService
from .models import StockData, Ticker
from .scoring import score_stocks

ProgressCb = Callable[[int, int, str], None]
LogCb = Callable[[str], None]


class Scanner:
    """Runs a full TSX scan and produces a ranked list of companies."""

    def __init__(self, config: Optional[AppConfig] = None):
        self.config = config or cfg.load_config()
        self.data_service = DataService(self.config)

    # ------------------------------------------------------------------ #
    def run(
        self,
        limit: Optional[int] = None,
        force_universe_refresh: bool = False,
        progress: Optional[ProgressCb] = None,
        log: Optional[LogCb] = None,
        should_stop: Optional[Callable[[], bool]] = None,
    ) -> list[StockData]:
        log = log or (lambda _m: None)
        progress = progress or (lambda _d, _t, _s: None)

        log(f"Active data providers: {', '.join(self.data_service.active_provider_names) or 'none'}")

        tickers = universe_mod.get_universe(
            self.config, force_refresh=force_universe_refresh, log=log
        )
        if limit:
            tickers = tickers[:limit]
        if not tickers:
            log("No tickers to scan.")
            return []

        log(f"Scanning {len(tickers)} companies…")

        def _progress(done: int, total: int, data: StockData) -> None:
            progress(done, total, data.ticker)

        results = self.data_service.fetch_many(
            tickers, progress=_progress, should_stop=should_stop
        )
        usable = [r for r in results if r.has_core_data()]
        log(f"Collected data for {len(usable)}/{len(results)} companies.")

        ranked = score_stocks(usable, self.config.weights)
        log(f"Scored and ranked {len(ranked)} companies.")
        return ranked

    # ------------------------------------------------------------------ #
    def refresh_universe(self, log: Optional[LogCb] = None) -> list[Ticker]:
        return universe_mod.get_universe(self.config, force_refresh=True, log=log)


# --------------------------------------------------------------------------- #
# Persistence / export
# --------------------------------------------------------------------------- #
EXPORT_COLUMNS = [
    "rank", "ticker", "name", "sector", "price", "currency", "market_cap",
    "score", "pe_ratio", "pb_ratio", "ps_ratio", "dividend_yield", "roe",
    "roa", "profit_margin", "debt_to_equity", "current_ratio",
    "revenue_growth", "earnings_growth", "beta", "week52_high", "week52_low",
    "source",
]


def save_scan(results: list[StockData], path: Path | None = None) -> Path:
    path = path or cfg.SCAN_CACHE
    cfg.ensure_data_dir()
    payload = {
        "created": time.time(),
        "count": len(results),
        "results": [r.to_dict() for r in results],
    }
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return path


def load_scan(path: Path | None = None) -> tuple[list[StockData], float]:
    path = path or cfg.SCAN_CACHE
    if not path.is_file():
        return [], 0.0
    data = json.loads(path.read_text(encoding="utf-8"))
    results = []
    for row in data.get("results", []):
        row = {k: v for k, v in row.items() if k in StockData.__dataclass_fields__}
        results.append(StockData(**row))
    return results, float(data.get("created", 0.0))


def export_csv(results: list[StockData], path: Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for r in results:
            row = r.to_dict()
            writer.writerow({col: row.get(col, "") for col in EXPORT_COLUMNS})
    return path
