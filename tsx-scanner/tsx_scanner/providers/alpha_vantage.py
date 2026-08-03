"""Alpha Vantage provider (free tier).

Note: Alpha Vantage's free tier is heavily rate limited (a handful of requests
per minute) and its Canadian coverage is uneven, so it is best used as a
fallback rather than a primary source for a full-universe scan. Toronto tickers
are queried with the ``.TRT`` suffix.
"""

from __future__ import annotations

from typing import Optional

from ..models import StockData, Ticker
from .base import Provider, as_percent, to_float

BASE = "https://www.alphavantage.co/query"


class AlphaVantageProvider(Provider):
    name = "alpha_vantage"
    requires_key = True

    def _av_symbol(self, ticker: Ticker) -> str:
        base = ticker.symbol.replace(".", "-")
        return f"{base}.TRT"

    def fetch(self, ticker: Ticker) -> Optional[StockData]:
        key = self.config.key_for("alpha_vantage")
        if not key:
            return None

        symbol = self._av_symbol(ticker)
        data = self._blank(ticker)
        data.source = self.name

        try:
            overview = self._get_json(
                BASE, {"function": "OVERVIEW", "symbol": symbol, "apikey": key}
            ) or {}
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"alpha_vantage overview error: {exc}")
            overview = {}

        # Rate-limit / empty responses come back as {} or a "Note"/"Information".
        if not overview or "Symbol" not in overview:
            return None

        data.name = overview.get("Name") or ticker.name
        data.currency = overview.get("Currency", data.currency)
        data.sector = overview.get("Sector", "") or ""
        data.industry = overview.get("Industry", "") or ""
        data.market_cap = to_float(overview.get("MarketCapitalization"))
        data.beta = to_float(overview.get("Beta"))
        data.week52_high = to_float(overview.get("52WeekHigh"))
        data.week52_low = to_float(overview.get("52WeekLow"))
        data.pe_ratio = to_float(overview.get("PERatio"))
        data.pb_ratio = to_float(overview.get("PriceToBookRatio"))
        data.ps_ratio = to_float(overview.get("PriceToSalesRatioTTM"))
        data.peg_ratio = to_float(overview.get("PEGRatio"))
        data.roe = as_percent(overview.get("ReturnOnEquityTTM"))
        data.roa = as_percent(overview.get("ReturnOnAssetsTTM"))
        data.profit_margin = as_percent(overview.get("ProfitMargin"))
        data.operating_margin = as_percent(overview.get("OperatingMarginTTM"))
        data.dividend_yield = as_percent(overview.get("DividendYield"))
        data.payout_ratio = as_percent(overview.get("PayoutRatio"))
        data.revenue_growth = as_percent(overview.get("QuarterlyRevenueGrowthYOY"))
        data.earnings_growth = as_percent(overview.get("QuarterlyEarningsGrowthYOY"))

        try:
            quote = self._get_json(
                BASE, {"function": "GLOBAL_QUOTE", "symbol": symbol, "apikey": key}
            ) or {}
            g = quote.get("Global Quote", {}) or {}
            data.price = to_float(g.get("05. price"))
            data.volume = to_float(g.get("06. volume"))
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"alpha_vantage quote error: {exc}")

        return data if data.has_core_data() else None
