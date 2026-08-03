from __future__ import annotations

import logging
import time
from typing import Any

import requests

from src.data_providers.base import DataProvider
from src.models import StockData
from src.utils import to_float

logger = logging.getLogger(__name__)


class FinnhubProvider(DataProvider):
    name = "Finnhub"
    BASE_URL = "https://finnhub.io/api/v1"

    def __init__(self, api_key: str, delay: float = 0.25) -> None:
        self.api_key = api_key.strip()
        self.delay = delay
        self._last_request = 0.0

    def is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "YOUR_FINNHUB_API_KEY"

    def _throttle(self) -> None:
        elapsed = time.time() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.time()

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        self._throttle()
        query = {"token": self.api_key}
        if params:
            query.update(params)
        response = requests.get(f"{self.BASE_URL}/{endpoint}", params=query, timeout=30)
        response.raise_for_status()
        return response.json()

    def fetch_universe(self) -> list[str]:
        if not self.is_available():
            return []
        try:
            data = self._get("stock/symbol", {"exchange": "TSX"})
            tickers = [item["symbol"] for item in data if item.get("symbol")]
            logger.info("Finnhub returned %d TSX symbols", len(tickers))
            return tickers
        except Exception as exc:
            logger.warning("Finnhub universe fetch failed: %s", exc)
            return []

    def fetch_stock_data(self, ticker: str) -> StockData | None:
        if not self.is_available():
            return None

        symbol = ticker if ticker.endswith(".TO") else f"{ticker}.TO"
        try:
            profile = self._get("stock/profile2", {"symbol": symbol})
            if not profile or not profile.get("name"):
                return None

            quote = self._get("quote", {"symbol": symbol})
            metrics = self._get("stock/metric", {"symbol": symbol, "metric": "all"})
            metric_data = metrics.get("metric", {}) if metrics else {}

            return StockData(
                ticker=ticker.replace(".TO", ""),
                company_name=profile.get("name", ticker),
                current_price=to_float(quote.get("c")),
                market_cap=to_float(profile.get("marketCapitalization")),
                pe_ratio=to_float(metric_data.get("peBasicExclExtraTTM") or metric_data.get("peTTM")),
                pb_ratio=to_float(metric_data.get("pbAnnual")),
                roe=to_float(metric_data.get("roeTTM")),
                debt_to_equity=to_float(metric_data.get("totalDebt/totalEquityAnnual")),
                revenue_growth=to_float(metric_data.get("revenueGrowthTTMYoy")),
                dividend_yield=to_float(metric_data.get("dividendYieldIndicatedAnnual")),
                profit_margin=to_float(metric_data.get("netProfitMarginTTM")),
                eps=to_float(metric_data.get("epsBasicExclExtraItemsTTM")),
                sector=profile.get("finnhubIndustry", ""),
                industry=profile.get("finnhubIndustry", ""),
                data_source=self.name,
            )
        except Exception as exc:
            logger.debug("Finnhub fetch failed for %s: %s", ticker, exc)
            return None
