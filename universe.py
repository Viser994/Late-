"""TSX universe retrieval and filtering."""

from __future__ import annotations

import json
from pathlib import Path

from models import StockListing
from providers import ProviderRouter

EXCLUDED_TERMS = {
    " ETF",
    " ETFS",
    " FUND",
    " TRUST",
    " WARRANT",
    " WTS",
    " RIGHT",
    " RIGHTS",
    " DEBENTURE",
    " PREFERRED",
    " PREF",
    " UNIT",
    " INDEX",
    " SPLIT CORP",
}


def _looks_like_common_share(listing: StockListing) -> bool:
    haystack = f"{listing.name} {listing.type}".upper()
    for term in EXCLUDED_TERMS:
        if term in haystack:
            return False
    return True


class UniverseManager:
    def __init__(self, provider_router: ProviderRouter, universe_path: str) -> None:
        self.provider_router = provider_router
        self.universe_path = Path(universe_path)

    def load_cached(self) -> list[StockListing]:
        if not self.universe_path.exists():
            return []
        with self.universe_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        results: list[StockListing] = []
        for row in payload:
            results.append(
                StockListing(
                    symbol=row["symbol"],
                    name=row.get("name", ""),
                    exchange=row.get("exchange", "TSX"),
                    type=row.get("type", ""),
                )
            )
        return results

    def refresh(self) -> list[StockListing]:
        listings = self.provider_router.get_tsx_listings()
        common = [row for row in listings if _looks_like_common_share(row)]
        dedup: dict[str, StockListing] = {row.symbol: row for row in common}
        cleaned = sorted(dedup.values(), key=lambda item: item.symbol)
        self.universe_path.parent.mkdir(parents=True, exist_ok=True)
        with self.universe_path.open("w", encoding="utf-8") as handle:
            json.dump(
                [
                    {
                        "symbol": row.symbol,
                        "name": row.name,
                        "exchange": row.exchange,
                        "type": row.type,
                    }
                    for row in cleaned
                ],
                handle,
                indent=2,
            )
        return cleaned
