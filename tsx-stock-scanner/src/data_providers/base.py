from __future__ import annotations

from abc import ABC, abstractmethod

from src.models import StockData


class DataProvider(ABC):
    """Abstract base for market data providers."""

    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Return True when the provider is configured and usable."""

    @abstractmethod
    def fetch_stock_data(self, ticker: str) -> StockData | None:
        """Fetch fundamental and market data for a TSX ticker."""

    def fetch_universe(self) -> list[str]:
        """Optional: return TSX tickers from this provider."""
        return []
