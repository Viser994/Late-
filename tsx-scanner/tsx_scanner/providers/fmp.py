"""FinancialModelingPrep provider (free tier)."""

from __future__ import annotations

from typing import Any, Optional

from ..models import StockData, Ticker
from .base import Provider, as_percent, to_float

BASE = "https://financialmodelingprep.com/api/v3"


class FMPProvider(Provider):
    name = "fmp"
    requires_key = True

    def _fmp_symbol(self, ticker: Ticker) -> str:
        # FMP uses the Yahoo-style suffix for TSX, e.g. "RY.TO", "BBD-B.TO".
        return ticker.yahoo_symbol()

    def _first(self, payload: Any) -> dict[str, Any]:
        if isinstance(payload, list) and payload:
            return payload[0]
        if isinstance(payload, dict):
            return payload
        return {}

    def fetch(self, ticker: Ticker) -> Optional[StockData]:
        key = self.config.key_for("fmp")
        if not key:
            return None

        symbol = self._fmp_symbol(ticker)
        data = self._blank(ticker)
        data.source = self.name

        try:
            profile = self._first(
                self._get_json(f"{BASE}/profile/{symbol}", {"apikey": key})
            )
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"fmp profile error: {exc}")
            profile = {}

        if not profile:
            return None

        data.name = profile.get("companyName") or ticker.name
        data.currency = profile.get("currency", data.currency)
        data.sector = profile.get("sector", "") or ""
        data.industry = profile.get("industry", "") or ""
        data.price = to_float(profile.get("price"))
        data.market_cap = to_float(profile.get("mktCap"))
        data.beta = to_float(profile.get("beta"))
        data.volume = to_float(profile.get("volAvg"))
        data.avg_volume = to_float(profile.get("volAvg"))
        rng = profile.get("range") or ""
        if "-" in str(rng):
            lo, _, hi = str(rng).partition("-")
            data.week52_low = to_float(lo)
            data.week52_high = to_float(hi)

        try:
            ratios = self._first(
                self._get_json(f"{BASE}/ratios-ttm/{symbol}", {"apikey": key})
            )
        except Exception as exc:  # noqa: BLE001
            data.errors.append(f"fmp ratios error: {exc}")
            ratios = {}

        data.pe_ratio = to_float(ratios.get("peRatioTTM"))
        data.pb_ratio = to_float(ratios.get("priceToBookRatioTTM"))
        data.ps_ratio = to_float(ratios.get("priceToSalesRatioTTM"))
        data.peg_ratio = to_float(ratios.get("pegRatioTTM"))
        data.roe = as_percent(ratios.get("returnOnEquityTTM"))
        data.roa = as_percent(ratios.get("returnOnAssetsTTM"))
        data.profit_margin = as_percent(ratios.get("netProfitMarginTTM"))
        data.operating_margin = as_percent(ratios.get("operatingProfitMarginTTM"))
        data.debt_to_equity = to_float(ratios.get("debtEquityRatioTTM"))
        data.current_ratio = to_float(ratios.get("currentRatioTTM"))
        data.dividend_yield = as_percent(ratios.get("dividendYielTTM") or ratios.get("dividendYieldTTM"))
        data.payout_ratio = as_percent(ratios.get("payoutRatioTTM"))

        try:
            metrics = self._first(
                self._get_json(f"{BASE}/key-metrics-ttm/{symbol}", {"apikey": key})
            )
        except Exception as exc:  # noqa: BLE001
            metrics = {}

        if data.pe_ratio is None:
            data.pe_ratio = to_float(metrics.get("peRatioTTM"))
        data.free_cash_flow = to_float(metrics.get("freeCashFlowPerShareTTM"))

        try:
            growth = self._first(
                self._get_json(
                    f"{BASE}/financial-growth/{symbol}",
                    {"apikey": key, "period": "annual", "limit": 1},
                )
            )
        except Exception:  # noqa: BLE001
            growth = {}
        data.revenue_growth = as_percent(growth.get("revenueGrowth"))
        data.earnings_growth = as_percent(growth.get("epsgrowth") or growth.get("netIncomeGrowth"))

        return data if data.has_core_data() else None
