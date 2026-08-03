"""Finnhub provider (free tier)."""

from __future__ import annotations

from typing import Any, Optional

from ..models import StockData, Ticker
from .base import Provider, as_percent, to_float

BASE = "https://finnhub.io/api/v1"


class FinnhubProvider(Provider):
    name = "finnhub"
    requires_key = True

    def _fh_symbol(self, ticker: Ticker) -> str:
        # Finnhub expects Toronto symbols with a ".TO" suffix.
        return ticker.yahoo_symbol()

    def fetch(self, ticker: Ticker) -> Optional[StockData]:
        key = self.config.key_for("finnhub")
        if not key:
            return None

        symbol = self._fh_symbol(ticker)
        data = self._blank(ticker)
        data.source = self.name

        try:
            profile = self._get_json(
                f"{BASE}/stock/profile2", {"symbol": symbol, "token": key}
            ) or {}
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"finnhub profile error: {exc}")
            profile = {}

        try:
            quote = self._get_json(
                f"{BASE}/quote", {"symbol": symbol, "token": key}
            ) or {}
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"finnhub quote error: {exc}")
            quote = {}

        data.name = profile.get("name") or ticker.name
        data.currency = profile.get("currency", data.currency)
        data.industry = profile.get("finnhubIndustry", "") or ""
        data.price = to_float(quote.get("c"))
        # Finnhub market cap is reported in millions of the listing currency.
        mcap = to_float(profile.get("marketCapitalization"))
        data.market_cap = mcap * 1_000_000 if mcap is not None else None

        try:
            metric_resp = self._get_json(
                f"{BASE}/stock/metric",
                {"symbol": symbol, "metric": "all", "token": key},
            ) or {}
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"finnhub metric error: {exc}")
            metric_resp = {}

        m: dict[str, Any] = metric_resp.get("metric", {}) or {}
        data.beta = to_float(m.get("beta"))
        data.week52_high = to_float(m.get("52WeekHigh"))
        data.week52_low = to_float(m.get("52WeekLow"))
        data.pe_ratio = to_float(m.get("peTTM") or m.get("peBasicExclExtraTTM"))
        data.pb_ratio = to_float(m.get("pbQuarterly") or m.get("pbAnnual"))
        data.ps_ratio = to_float(m.get("psTTM") or m.get("psAnnual"))
        data.roe = as_percent(m.get("roeTTM"))
        data.roa = as_percent(m.get("roaTTM"))
        data.profit_margin = as_percent(m.get("netProfitMarginTTM"))
        data.operating_margin = as_percent(m.get("operatingMarginTTM"))
        data.debt_to_equity = to_float(
            m.get("totalDebt/totalEquityQuarterly")
            or m.get("totalDebt/totalEquityAnnual")
            or m.get("longTermDebt/equityQuarterly")
        )
        data.current_ratio = to_float(
            m.get("currentRatioQuarterly") or m.get("currentRatioAnnual")
        )
        data.dividend_yield = as_percent(
            m.get("dividendYieldIndicatedAnnual") or m.get("currentDividendYieldTTM")
        )
        data.payout_ratio = as_percent(m.get("payoutRatioTTM"))
        data.revenue_growth = as_percent(
            m.get("revenueGrowthTTMYoy") or m.get("revenueGrowth5Y")
        )
        data.earnings_growth = as_percent(
            m.get("epsGrowthTTMYoy") or m.get("epsGrowth5Y")
        )

        return data if data.has_core_data() else None
