from __future__ import annotations

import logging
import time
from typing import Any

import requests

from src.data_providers.base import DataProvider
from src.models import StockData
from src.utils import to_float

logger = logging.getLogger(__name__)


class AlphaVantageProvider(DataProvider):
    name = "Alpha Vantage"
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: str, delay: float = 1.0) -> None:
        self.api_key = api_key.strip()
        self.delay = delay
        self._last_request = 0.0

    def is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "YOUR_ALPHA_VANTAGE_API_KEY"

    def _throttle(self) -> None:
        elapsed = time.time() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.time()

    def _get(self, params: dict[str, Any]) -> Any:
        self._throttle()
        query = {"apikey": self.api_key, **params}
        response = requests.get(self.BASE_URL, params=query, timeout=30)
        response.raise_for_status()
        return response.json()

    def fetch_stock_data(self, ticker: str) -> StockData | None:
        if not self.is_available():
            return None

        symbol = ticker if ticker.endswith(".TO") else f"{ticker}.TO"
        try:
            overview = self._get({"function": "OVERVIEW", "symbol": symbol})
            if not overview or "Symbol" not in overview:
                return None

            quote = self._get({"function": "GLOBAL_QUOTE", "symbol": symbol})
            global_quote = quote.get("Global Quote", {})

            price = global_quote.get("05. price")
            pe = overview.get("PERatio")
            pb = overview.get("PriceToBookRatio")
            roe = overview.get("ReturnOnEquityTTM")
            debt = overview.get("DebtToEquity")
            rev_growth = overview.get("QuarterlyRevenueGrowthYOY")
            div_yield = overview.get("DividendYield")
            margin = overview.get("ProfitMargin")
            eps = overview.get("EPS")
            market_cap = overview.get("MarketCapitalization")

            return StockData(
                ticker=ticker.replace(".TO", ""),
                company_name=overview.get("Name", ticker),
                current_price=to_float(price),
                market_cap=to_float(market_cap),
                pe_ratio=to_float(pe),
                pb_ratio=to_float(pb),
                roe=to_float(roe),
                debt_to_equity=to_float(debt),
                revenue_growth=to_float(rev_growth),
                dividend_yield=to_float(div_yield),
                profit_margin=to_float(margin),
                eps=to_float(eps),
                sector=overview.get("Sector", ""),
                industry=overview.get("Industry", ""),
                data_source=self.name,
            )
        except Exception as exc:
            logger.debug("Alpha Vantage fetch failed for %s: %s", ticker, exc)
            return None
