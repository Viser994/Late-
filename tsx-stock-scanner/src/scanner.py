from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from src.config import get_cache_dir
from src.data_providers import DataAggregator
from src.models import StockData
from src.scorer import StockScorer
from src.universe import UniverseManager, create_universe_manager

logger = logging.getLogger(__name__)

RESULTS_CACHE_FILE = "scan_results.json"


class TSXScanner:
    """Orchestrate universe loading, data fetching, scoring, and caching."""

    def __init__(self, config: dict) -> None:
        self.config = config
        self.cache_dir = get_cache_dir(config)
        self.aggregator = DataAggregator(config)
        self.universe = UniverseManager(self.cache_dir, self.aggregator)
        self.scorer = StockScorer(config.get("scoring_weights"))
        self.results_path = self.cache_dir / RESULTS_CACHE_FILE

    def refresh_universe(self) -> list[str]:
        return self.universe.refresh()

    def load_universe(self, force_refresh: bool = False) -> list[str]:
        return self.universe.get_tickers(force_refresh=force_refresh)

    def scan(
        self,
        tickers: list[str] | None = None,
        progress_callback: Callable[[int, int, str], None] | None = None,
        max_workers: int = 4,
    ) -> list[StockData]:
        universe = tickers or self.load_universe()
        total = len(universe)
        results: list[StockData] = []

        def fetch_one(ticker: str) -> StockData | None:
            return self.aggregator.fetch_stock_data(ticker)

        completed = 0
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(fetch_one, t): t for t in universe}
            for future in as_completed(futures):
                ticker = futures[future]
                completed += 1
                try:
                    data = future.result()
                    if data:
                        results.append(data)
                except Exception as exc:
                    logger.warning("Error fetching %s: %s", ticker, exc)
                if progress_callback:
                    progress_callback(completed, total, ticker)

        ranked = self.scorer.score(results)
        self._save_results(ranked)
        return ranked

    def _save_results(self, results: list[StockData]) -> None:
        payload = {
            "scanned_at": datetime.now(timezone.utc).isoformat(),
            "count": len(results),
            "stocks": [s.to_dict() for s in results],
        }
        self.results_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def load_cached_results(self) -> list[StockData] | None:
        if not self.results_path.exists():
            return None
        payload = json.loads(self.results_path.read_text(encoding="utf-8"))
        stocks = []
        for item in payload.get("stocks", []):
            stock = StockData(
                ticker=item["ticker"],
                company_name=item.get("company_name", ""),
                current_price=item.get("current_price"),
                market_cap=item.get("market_cap"),
                pe_ratio=item.get("pe_ratio"),
                pb_ratio=item.get("pb_ratio"),
                roe=item.get("roe"),
                debt_to_equity=item.get("debt_to_equity"),
                revenue_growth=item.get("revenue_growth"),
                dividend_yield=item.get("dividend_yield"),
                profit_margin=item.get("profit_margin"),
                eps=item.get("eps"),
                sector=item.get("sector", ""),
                industry=item.get("industry", ""),
                score=item.get("score"),
                rank=item.get("rank"),
                data_source=item.get("data_source", ""),
                score_breakdown={
                    "value": item.get("value_score", 0) or 0,
                    "quality": item.get("quality_score", 0) or 0,
                    "growth": item.get("growth_score", 0) or 0,
                    "financial_health": item.get("health_score", 0) or 0,
                },
            )
            stocks.append(stock)
        return stocks

    def export_csv(self, results: list[StockData], path: Path) -> Path:
        import csv

        rows = [s.to_dict() for s in results]
        if not rows:
            raise ValueError("No results to export")

        fieldnames = list(rows[0].keys())
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def export_excel(self, results: list[StockData], path: Path) -> Path:
        import pandas as pd

        df = pd.DataFrame([s.to_dict() for s in results])
        df.to_excel(path, index=False, sheet_name="TSX Rankings")
        return path
