from __future__ import annotations

import logging

from src.config import load_config
from src.data_providers.alpha_vantage import AlphaVantageProvider
from src.data_providers.base import DataProvider
from src.data_providers.finnhub import FinnhubProvider
from src.data_providers.fmp import FMPProvider
from src.data_providers.yfinance_provider import YFinanceProvider
from src.models import StockData

logger = logging.getLogger(__name__)


def build_providers(config: dict | None = None) -> list[DataProvider]:
    cfg = config or load_config()
    keys = cfg.get("api_keys", {})
    delay = float(cfg.get("request_delay_seconds", 0.25))

    return [
        FMPProvider(keys.get("financialmodelingprep", ""), delay=delay),
        FinnhubProvider(keys.get("finnhub", ""), delay=delay),
        AlphaVantageProvider(keys.get("alpha_vantage", ""), delay=max(delay, 1.0)),
        YFinanceProvider(),
    ]


class DataAggregator:
    """Fetch stock data with automatic provider fallback."""

    def __init__(
        self,
        providers: list[DataProvider] | dict | None = None,
        config: dict | None = None,
    ) -> None:
        if isinstance(providers, dict) and config is None:
            config = providers
            providers = None
        self.providers = providers or build_providers(config)

    def fetch_stock_data(self, ticker: str) -> StockData | None:
        for provider in self.providers:
            if not provider.is_available():
                continue
            data = provider.fetch_stock_data(ticker)
            if data and data.current_price is not None:
                logger.debug("Fetched %s from %s", ticker, provider.name)
                return data
        logger.warning("All providers failed for %s", ticker)
        return None

    def fetch_universe(self) -> list[str]:
        for provider in self.providers:
            if not provider.is_available():
                continue
            tickers = provider.fetch_universe()
            if tickers:
                logger.info("Universe loaded from %s", provider.name)
                return tickers
        return []
