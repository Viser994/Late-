"""Data providers with automatic fallback support."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import requests

from config import AppConfig
from models import StockListing, StockSnapshot


class ProviderError(RuntimeError):
    """Raised when a provider call cannot be completed."""


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    if value != value:  # NaN check
        return None
    return value


@dataclass(slots=True)
class BaseProvider:
    config: AppConfig
    name: str

    def get_tsx_listings(self) -> list[StockListing]:
        raise NotImplementedError

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        raise NotImplementedError


class FMPProvider(BaseProvider):
    def __init__(self, config: AppConfig) -> None:
        super().__init__(config=config, name="FinancialModelingPrep")
        self.base_url = "https://financialmodelingprep.com/api/v3"

    def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        if not self.config.fmp_api_key:
            raise ProviderError("FMP API key missing")
        full_params = {"apikey": self.config.fmp_api_key}
        if params:
            full_params.update(params)
        response = requests.get(
            f"{self.base_url}/{endpoint}",
            params=full_params,
            timeout=self.config.request_timeout_seconds,
        )
        if response.status_code >= 400:
            raise ProviderError(f"FMP HTTP {response.status_code}")
        return response.json()

    def get_tsx_listings(self) -> list[StockListing]:
        records = self._request("stock/list")
        listings: list[StockListing] = []
        for row in records:
            exchange = str(row.get("exchangeShortName", "")).strip()
            if exchange not in {"TSX", "TORONTO"}:
                continue
            symbol = str(row.get("symbol", "")).strip().upper()
            if not symbol or not symbol.endswith(".TO"):
                continue
            listings.append(
                StockListing(
                    symbol=symbol,
                    name=str(row.get("name", "")).strip(),
                    exchange=exchange,
                    type=str(row.get("type", "")).strip(),
                )
            )
        if not listings:
            raise ProviderError("No TSX listings returned by FMP")
        return listings

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        profile = self._request(f"profile/{symbol}")
        quote = self._request(f"quote/{symbol}")
        ratios = self._request(f"ratios-ttm/{symbol}")
        metrics = self._request(f"key-metrics-ttm/{symbol}")
        growth = self._request(f"income-statement-growth/{symbol}", {"limit": 1})

        profile_row = profile[0] if profile else {}
        quote_row = quote[0] if quote else {}
        ratio_row = ratios[0] if ratios else {}
        metric_row = metrics[0] if metrics else {}
        growth_row = growth[0] if growth else {}

        return StockSnapshot(
            symbol=symbol,
            company_name=str(profile_row.get("companyName", "")).strip(),
            price=_safe_float(quote_row.get("price")),
            market_cap=_safe_float(quote_row.get("marketCap")),
            pe_ratio=_safe_float(ratio_row.get("peRatioTTM")),
            pb_ratio=_safe_float(ratio_row.get("priceToBookRatioTTM")),
            roe=_safe_float(ratio_row.get("returnOnEquityTTM")),
            profit_margin=_safe_float(ratio_row.get("netProfitMarginTTM")),
            debt_to_equity=_safe_float(metric_row.get("debtToEquityTTM")),
            revenue_growth=_safe_float(growth_row.get("growthRevenue")),
            year_high=_safe_float(quote_row.get("yearHigh")),
            year_low=_safe_float(quote_row.get("yearLow")),
            source=self.name,
        )


class FinnhubProvider(BaseProvider):
    def __init__(self, config: AppConfig) -> None:
        super().__init__(config=config, name="Finnhub")
        self.base_url = "https://finnhub.io/api/v1"

    def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        if not self.config.finnhub_api_key:
            raise ProviderError("Finnhub API key missing")
        full_params = {"token": self.config.finnhub_api_key}
        if params:
            full_params.update(params)
        response = requests.get(
            f"{self.base_url}/{endpoint}",
            params=full_params,
            timeout=self.config.request_timeout_seconds,
        )
        if response.status_code >= 400:
            raise ProviderError(f"Finnhub HTTP {response.status_code}")
        return response.json()

    def get_tsx_listings(self) -> list[StockListing]:
        records = self._request("stock/symbol", {"exchange": "TO"})
        listings: list[StockListing] = []
        for row in records:
            symbol = str(row.get("symbol", "")).strip().upper()
            if not symbol:
                continue
            if not symbol.endswith(".TO"):
                symbol = f"{symbol}.TO"
            listings.append(
                StockListing(
                    symbol=symbol,
                    name=str(row.get("description", "")).strip(),
                    exchange="TSX",
                    type=str(row.get("type", "")).strip(),
                )
            )
        if not listings:
            raise ProviderError("No TSX listings returned by Finnhub")
        return listings

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        base_symbol = symbol.replace(".TO", "")
        profile = self._request("stock/profile2", {"symbol": base_symbol})
        quote = self._request("quote", {"symbol": base_symbol})
        metrics = self._request("stock/metric", {"symbol": base_symbol, "metric": "all"})
        metric_row = metrics.get("metric", {}) if isinstance(metrics, dict) else {}

        return StockSnapshot(
            symbol=symbol,
            company_name=str(profile.get("name", "")).strip(),
            price=_safe_float(quote.get("c")),
            market_cap=_safe_float(profile.get("marketCapitalization")),
            pe_ratio=_safe_float(metric_row.get("peTTM")),
            pb_ratio=_safe_float(metric_row.get("pbQuarterly")),
            roe=_safe_float(metric_row.get("roeTTM")),
            profit_margin=_safe_float(metric_row.get("netMargin")),
            debt_to_equity=_safe_float(metric_row.get("totalDebt/totalEquityQuarterly")),
            revenue_growth=_safe_float(metric_row.get("revenueGrowthTTMYoy")),
            year_high=_safe_float(quote.get("h")),
            year_low=_safe_float(quote.get("l")),
            source=self.name,
        )


class AlphaVantageProvider(BaseProvider):
    def __init__(self, config: AppConfig) -> None:
        super().__init__(config=config, name="Alpha Vantage")
        self.base_url = "https://www.alphavantage.co/query"

    def _request(self, params: dict[str, Any]) -> Any:
        if not self.config.alpha_vantage_api_key:
            raise ProviderError("Alpha Vantage API key missing")
        full_params = {"apikey": self.config.alpha_vantage_api_key}
        full_params.update(params)
        response = requests.get(
            self.base_url,
            params=full_params,
            timeout=self.config.request_timeout_seconds,
        )
        if response.status_code >= 400:
            raise ProviderError(f"Alpha Vantage HTTP {response.status_code}")
        payload = response.json()
        if "Note" in payload:
            raise ProviderError("Alpha Vantage rate limit hit")
        if "Error Message" in payload:
            raise ProviderError(payload["Error Message"])
        return payload

    def get_tsx_listings(self) -> list[StockListing]:
        payload = self._request({"function": "LISTING_STATUS"})
        if isinstance(payload, dict):
            raise ProviderError("Alpha Vantage returned unexpected listing payload")
        raise ProviderError("Alpha Vantage listing fallback unavailable in JSON mode")

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        overview = self._request({"function": "OVERVIEW", "symbol": symbol})
        quote = self._request({"function": "GLOBAL_QUOTE", "symbol": symbol})
        quote_row = quote.get("Global Quote", {}) if isinstance(quote, dict) else {}
        return StockSnapshot(
            symbol=symbol,
            company_name=str(overview.get("Name", "")).strip(),
            price=_safe_float(quote_row.get("05. price")),
            market_cap=_safe_float(overview.get("MarketCapitalization")),
            pe_ratio=_safe_float(overview.get("PERatio")),
            pb_ratio=_safe_float(overview.get("PriceToBookRatio")),
            roe=_safe_float(overview.get("ReturnOnEquityTTM")),
            profit_margin=_safe_float(overview.get("ProfitMargin")),
            debt_to_equity=_safe_float(overview.get("DebtToEquity")),
            revenue_growth=_safe_float(overview.get("QuarterlyRevenueGrowthYOY")),
            year_high=_safe_float(overview.get("52WeekHigh")),
            year_low=_safe_float(overview.get("52WeekLow")),
            source=self.name,
        )


class YFinanceProvider(BaseProvider):
    def __init__(self, config: AppConfig) -> None:
        super().__init__(config=config, name="Yahoo Finance")
        try:
            import yfinance as yf
        except ImportError as exc:  # pragma: no cover
            raise ProviderError("yfinance dependency missing") from exc
        self.yf = yf

    def get_tsx_listings(self) -> list[StockListing]:
        raise ProviderError("Yahoo Finance does not provide full TSX listing endpoint")

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        ticker = self.yf.Ticker(symbol)
        info = ticker.info or {}
        fast_info = getattr(ticker, "fast_info", {}) or {}
        return StockSnapshot(
            symbol=symbol,
            company_name=str(info.get("longName") or info.get("shortName") or "").strip(),
            price=_safe_float(fast_info.get("lastPrice") or info.get("currentPrice")),
            market_cap=_safe_float(info.get("marketCap")),
            pe_ratio=_safe_float(info.get("trailingPE")),
            pb_ratio=_safe_float(info.get("priceToBook")),
            roe=_safe_float(info.get("returnOnEquity")),
            profit_margin=_safe_float(info.get("profitMargins")),
            debt_to_equity=_safe_float(info.get("debtToEquity")),
            revenue_growth=_safe_float(info.get("revenueGrowth")),
            year_high=_safe_float(info.get("fiftyTwoWeekHigh")),
            year_low=_safe_float(info.get("fiftyTwoWeekLow")),
            source=self.name,
        )


class ProviderRouter:
    """Route each call through providers in required fallback order."""

    def __init__(self, config: AppConfig) -> None:
        self.providers: list[BaseProvider] = [
            FMPProvider(config),
            FinnhubProvider(config),
            AlphaVantageProvider(config),
        ]
        try:
            self.providers.append(YFinanceProvider(config))
        except ProviderError:
            pass

    def get_tsx_listings(self) -> list[StockListing]:
        errors: list[str] = []
        for provider in self.providers:
            try:
                listings = provider.get_tsx_listings()
                return listings
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{provider.name}: {exc}")
                time.sleep(0.1)
        raise ProviderError("Unable to load TSX listings. " + " | ".join(errors))

    def get_snapshot(self, symbol: str) -> StockSnapshot:
        errors: list[str] = []
        for provider in self.providers:
            try:
                return provider.get_snapshot(symbol)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{provider.name}: {exc}")
                time.sleep(0.1)
        failed = StockSnapshot(symbol=symbol, source="none")
        failed.errors.extend(errors)
        return failed
