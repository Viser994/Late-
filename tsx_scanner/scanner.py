from __future__ import annotations

import csv
import time
from collections.abc import Callable
from pathlib import Path

from .config import Settings
from .models import ScoredStock, Stock, StockMetrics
from .providers import ProviderManager
from .scoring import rank_stocks
from .universe import get_universe


ProgressCallback = Callable[[int, int, Stock, StockMetrics], None]


CSV_FIELDS = [
    "rank",
    "score",
    "symbol",
    "name",
    "price",
    "market_cap",
    "volume",
    "pe_ratio",
    "forward_pe",
    "price_to_book",
    "eps",
    "revenue_growth",
    "profit_margin",
    "return_on_equity",
    "debt_to_equity",
    "dividend_yield",
    "beta",
    "fifty_two_week_change",
    "sector",
    "industry",
    "valuation_score",
    "quality_score",
    "growth_score",
    "income_score",
    "market_score",
    "provider",
    "error",
]


class Scanner:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.providers = ProviderManager(settings.api_keys, settings.request_timeout_seconds)
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    def scan(
        self,
        refresh_universe: bool = False,
        limit: int | None = None,
        progress: ProgressCallback | None = None,
    ) -> list[ScoredStock]:
        self._cancelled = False
        universe = get_universe(
            self.settings.universe_cache,
            timeout=self.settings.request_timeout_seconds,
            refresh=refresh_universe,
        )
        if limit is not None:
            universe = universe[:limit]

        collected: list[StockMetrics] = []
        total = len(universe)
        for index, stock in enumerate(universe, start=1):
            if self._cancelled:
                break
            metrics = self.providers.fetch_metrics(stock)
            collected.append(metrics)
            if progress:
                progress(index, total, stock, metrics)
            if self.settings.request_delay_seconds > 0 and index < total:
                time.sleep(self.settings.request_delay_seconds)

        ranked = rank_stocks(collected)
        write_results_csv(ranked, self.settings.results_cache)
        return ranked


def write_results_csv(results: list[ScoredStock], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for item in results:
            writer.writerow(item.to_row())


def read_results_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))
