"""Base class and helpers shared by all data providers."""

from __future__ import annotations

from typing import Any, Optional

import requests

from ..config import AppConfig
from ..models import StockData, Ticker


def to_float(value: Any) -> Optional[float]:
    """Best-effort conversion to float. Returns None on failure/None/blank."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        f = float(value)
        return None if (f != f) else f  # drop NaN
    text = str(value).strip().replace(",", "")
    if text in ("", "-", "N/A", "None", "null", "nan", "NaN"):
        return None
    text = text.rstrip("%")
    try:
        return float(text)
    except ValueError:
        return None


def as_percent(value: Any) -> Optional[float]:
    """Normalise a ratio to percent.

    Providers are inconsistent: some return 0.15 for 15%, others return 15.
    Heuristic: values with absolute magnitude <= 1.5 are treated as fractions
    and multiplied by 100.
    """
    f = to_float(value)
    if f is None:
        return None
    return f * 100.0 if abs(f) <= 1.5 else f


class Provider:
    """Abstract data provider."""

    name = "base"
    requires_key = False

    def __init__(self, config: AppConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "TSX-Scanner/1.0"})

    # -- capability -------------------------------------------------------- #
    def is_available(self) -> bool:
        """Whether this provider can be used given the current configuration."""
        if self.requires_key:
            return self.config.has_key(self.name)
        return True

    # -- fetching ---------------------------------------------------------- #
    def fetch(self, ticker: Ticker) -> Optional[StockData]:
        """Return populated StockData for ticker, or None if unavailable."""
        raise NotImplementedError

    # -- helpers ----------------------------------------------------------- #
    def _get_json(self, url: str, params: dict[str, Any] | None = None) -> Any:
        resp = self.session.get(
            url, params=params, timeout=self.config.request_timeout
        )
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def _blank(ticker: Ticker) -> StockData:
        return StockData(
            ticker=ticker.symbol,
            name=ticker.name,
            exchange=ticker.exchange,
        )
