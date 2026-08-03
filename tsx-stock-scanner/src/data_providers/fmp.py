from __future__ import annotations

import logging
import time
from typing import Any

import requests

from src.data_providers.base import DataProvider
from src.models import StockData
from src.utils import to_float

logger = logging.getLogger(__name__)


class FMPProvider(DataProvider):
    name = "FinancialModelingPrep"
    BASE_URL = "https://financialmodelingprep.com/api/v3"

    def __init__(self, api_key: str, delay: float = 0.25) -> None:
        self.api_key = api_key.strip()
        self.delay = delay
        self._last_request = 0.0

    def is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "YOUR_FMP_API_KEY"

    def _throttle(self) -> None:
        elapsed = time.time() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.time()

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        self._throttle()
        query = {"apikey": self.api_key}
        if params:
            query.update(params)
        response = requests.get(f"{self.BASE_URL}/{endpoint}", params=query, timeout=30)
        response.raise_for_status()
        return response.json()

    def fetch_universe(self) -> list[str]:
        if not self.is_available():
            return []
        try:
            data = self._get("symbol/TSX")
            tickers = [item["symbol"] for item in data if item.get("symbol")]
            logger.info("FMP returned %d TSX symbols", len(tickers))
            return tickers
        except Exception as exc:
            logger.warning("FMP universe fetch failed: %s", exc)
            return []

    def fetch_stock_data(self, ticker: str) -> StockData | None:
        if not self.is_available():
            return None

        symbol = ticker if ticker.endswith(".TO") else f"{ticker}.TO"
        try:
            profile = self._get(f"profile/{symbol}")
            if not profile:
                return None
            info = profile[0] if isinstance(profile, list) else profile

            quote_data = self._get(f"quote/{symbol}")
            quote = quote_data[0] if quote_data else {}

            ratios_data = self._get(f"ratios-ttm/{symbol}")
            ratios = ratios_data[0] if ratios_data else {}

            metrics_data = self._get(f"key-metrics-ttm/{symbol}")
            metrics = metrics_data[0] if metrics_data else {}

            growth_data = self._get(f"financial-growth/{symbol}", {"limit": 1})
            growth = growth_data[0] if growth_data else {}

            price = quote.get("price") or info.get("price")
            return StockData(
                ticker=ticker.replace(".TO", ""),
                company_name=info.get("companyName", ticker),
                current_price=to_float(price),
                market_cap=to_float(info.get("mktCap") or metrics.get("marketCap")),
                pe_ratio=to_float(ratios.get("priceEarningsRatioTTM") or quote.get("pe")),
                pb_ratio=to_float(ratios.get("priceToBookRatioTTM")),
                roe=to_float(ratios.get("returnOnEquityTTM")),
                debt_to_equity=to_float(ratios.get("debtEquityRatioTTM")),
                revenue_growth=to_float(growth.get("revenueGrowth")),
                dividend_yield=to_float(ratios.get("dividendYieldTTM") or info.get("lastDiv")),
                profit_margin=to_float(ratios.get("netProfitMarginTTM")),
                eps=to_float(quote.get("eps") or metrics.get("netIncomePerShareTTM")),
                sector=info.get("sector", ""),
                industry=info.get("industry", ""),
                data_source=self.name,
            )
        except Exception as exc:
            logger.debug("FMP fetch failed for %s: %s", ticker, exc)
            return None
