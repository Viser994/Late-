"""Yahoo Finance provider (no API key required).

This is the universal fallback: it needs no key and covers essentially every
TSX-listed security. It relies on the ``yfinance`` package.
"""

from __future__ import annotations

import logging
from typing import Optional

from ..models import StockData, Ticker
from .base import Provider, as_percent, to_float

# yfinance logs a warning/error for every delisted or unknown symbol, which is
# noise during a full-universe scan (we handle missing data ourselves).
logging.getLogger("yfinance").setLevel(logging.CRITICAL)


class YFinanceProvider(Provider):
    name = "yfinance"
    requires_key = False

    def is_available(self) -> bool:
        try:
            import yfinance  # noqa: F401
        except Exception:  # noqa: BLE001
            return False
        return True

    def fetch(self, ticker: Ticker) -> Optional[StockData]:
        try:
            import yfinance as yf
        except Exception:  # noqa: BLE001
            return None

        data = self._blank(ticker)
        data.source = self.name

        yf_ticker = yf.Ticker(ticker.yahoo_symbol())
        try:
            info = yf_ticker.info or {}
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"yfinance info error: {exc}")
            info = {}

        if not info:
            return None

        data.name = info.get("longName") or info.get("shortName") or ticker.name
        data.currency = info.get("currency", data.currency)
        data.sector = info.get("sector", "") or ""
        data.industry = info.get("industry", "") or ""

        data.price = (
            to_float(info.get("currentPrice"))
            or to_float(info.get("regularMarketPrice"))
            or to_float(info.get("previousClose"))
        )
        data.market_cap = to_float(info.get("marketCap"))
        data.beta = to_float(info.get("beta"))
        data.week52_high = to_float(info.get("fiftyTwoWeekHigh"))
        data.week52_low = to_float(info.get("fiftyTwoWeekLow"))
        data.volume = to_float(info.get("volume"))
        data.avg_volume = to_float(info.get("averageVolume"))

        data.pe_ratio = to_float(info.get("trailingPE")) or to_float(info.get("forwardPE"))
        data.pb_ratio = to_float(info.get("priceToBook"))
        data.ps_ratio = to_float(info.get("priceToSalesTrailing12Months"))
        data.peg_ratio = to_float(info.get("pegRatio") or info.get("trailingPegRatio"))

        data.roe = as_percent(info.get("returnOnEquity"))
        data.roa = as_percent(info.get("returnOnAssets"))
        data.profit_margin = as_percent(info.get("profitMargins"))
        data.operating_margin = as_percent(info.get("operatingMargins"))

        # yfinance reports debtToEquity as a percentage (e.g. 120 == 1.2x).
        dte = to_float(info.get("debtToEquity"))
        data.debt_to_equity = dte / 100.0 if dte is not None else None
        data.current_ratio = to_float(info.get("currentRatio"))
        data.free_cash_flow = to_float(info.get("freeCashflow"))

        data.revenue_growth = as_percent(info.get("revenueGrowth"))
        data.earnings_growth = as_percent(
            info.get("earningsGrowth")
            if info.get("earningsGrowth") is not None
            else info.get("earningsQuarterlyGrowth")
        )

        # Dividend yield: derive from the annual rate and price when possible
        # (unambiguous). Recent yfinance already reports `dividendYield` as a
        # percentage, so use it as-is rather than the fraction heuristic.
        div_rate = to_float(info.get("dividendRate")) or to_float(info.get("trailingAnnualDividendRate"))
        if div_rate is not None and data.price:
            data.dividend_yield = div_rate / data.price * 100.0
        else:
            data.dividend_yield = to_float(info.get("dividendYield"))
        data.payout_ratio = as_percent(info.get("payoutRatio"))

        return data if data.has_core_data() else None
