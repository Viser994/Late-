from __future__ import annotations

import logging

import yfinance as yf

from src.data_providers.base import DataProvider
from src.models import StockData
from src.utils import normalize_ratio, to_float

logger = logging.getLogger(__name__)


class YFinanceProvider(DataProvider):
    name = "Yahoo Finance"

    def is_available(self) -> bool:
        return True

    def fetch_universe(self) -> list[str]:
        # yfinance does not expose a TSX listing endpoint; universe comes from other sources.
        return []

    def fetch_stock_data(self, ticker: str) -> StockData | None:
        symbol = ticker if ticker.endswith(".TO") else f"{ticker}.TO"
        try:
            stock = yf.Ticker(symbol)
            info = stock.info or {}
            if not info or info.get("regularMarketPrice") is None and info.get("currentPrice") is None:
                fast_info = getattr(stock, "fast_info", None)
                if fast_info:
                    price = getattr(fast_info, "last_price", None)
                    if price is None:
                        return None
                    return StockData(
                        ticker=ticker.replace(".TO", ""),
                        company_name=info.get("longName") or info.get("shortName") or ticker,
                        current_price=to_float(price),
                        data_source=self.name,
                    )
                return None

            return StockData(
                ticker=ticker.replace(".TO", ""),
                company_name=info.get("longName") or info.get("shortName") or ticker,
                current_price=to_float(info.get("currentPrice") or info.get("regularMarketPrice")),
                market_cap=to_float(info.get("marketCap")),
                pe_ratio=to_float(info.get("trailingPE") or info.get("forwardPE")),
                pb_ratio=to_float(info.get("priceToBook")),
                roe=normalize_ratio(info.get("returnOnEquity")),
                debt_to_equity=to_float(info.get("debtToEquity")),
                revenue_growth=normalize_ratio(info.get("revenueGrowth")),
                dividend_yield=normalize_ratio(info.get("dividendYield"), as_percent=True),
                profit_margin=normalize_ratio(info.get("profitMargins")),
                eps=to_float(info.get("trailingEps")),
                sector=info.get("sector", ""),
                industry=info.get("industry", ""),
                data_source=self.name,
            )
        except Exception as exc:
            logger.debug("yfinance fetch failed for %s: %s", ticker, exc)
            return None
