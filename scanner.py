"""Scanning engine for ranking TSX stocks."""

from __future__ import annotations

import concurrent.futures
from typing import Callable

from models import StockListing, StockSnapshot
from providers import ProviderRouter
from scoring import score_snapshot

ProgressCallback = Callable[[int, int, str], None]


class StockScanner:
    def __init__(self, provider_router: ProviderRouter, max_workers: int = 8) -> None:
        self.provider_router = provider_router
        self.max_workers = max_workers

    def _scan_one(self, listing: StockListing) -> StockSnapshot:
        snapshot = self.provider_router.get_snapshot(listing.symbol)
        if not snapshot.company_name:
            snapshot.company_name = listing.name
        return score_snapshot(snapshot)

    def scan(
        self,
        listings: list[StockListing],
        progress_callback: ProgressCallback | None = None,
    ) -> list[StockSnapshot]:
        total = len(listings)
        done = 0
        results: list[StockSnapshot] = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as pool:
            futures = {pool.submit(self._scan_one, listing): listing for listing in listings}
            for future in concurrent.futures.as_completed(futures):
                listing = futures[future]
                done += 1
                try:
                    snapshot = future.result()
                except Exception as exc:  # noqa: BLE001
                    snapshot = StockSnapshot(symbol=listing.symbol, company_name=listing.name)
                    snapshot.errors.append(str(exc))
                results.append(snapshot)
                if progress_callback:
                    progress_callback(done, total, listing.symbol)

        ranked = sorted(results, key=lambda row: row.score, reverse=True)
        return ranked
