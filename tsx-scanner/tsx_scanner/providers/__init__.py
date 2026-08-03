"""Data providers with a common interface.

Each provider knows how to turn a :class:`~tsx_scanner.models.Ticker` into a
:class:`~tsx_scanner.models.StockData`. The :class:`DataService` orchestrates
them with automatic fallback.
"""

from .base import Provider
from .fmp import FMPProvider
from .finnhub import FinnhubProvider
from .alpha_vantage import AlphaVantageProvider
from .yfinance_provider import YFinanceProvider

PROVIDER_REGISTRY = {
    "fmp": FMPProvider,
    "finnhub": FinnhubProvider,
    "alpha_vantage": AlphaVantageProvider,
    "yfinance": YFinanceProvider,
}

__all__ = [
    "Provider",
    "FMPProvider",
    "FinnhubProvider",
    "AlphaVantageProvider",
    "YFinanceProvider",
    "PROVIDER_REGISTRY",
]
