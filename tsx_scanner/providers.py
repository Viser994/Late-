from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Iterable

import requests

from .config import ApiKeys
from .models import Stock, StockMetrics


def _to_float(value: Any) -> float | None:
    if value in (None, "", "None", "N/A"):
        return None
    try:
        return float(str(value).replace(",", "").replace("%", ""))
    except (TypeError, ValueError):
        return None


def _first_float(*values: Any) -> float | None:
    for value in values:
        parsed = _to_float(value)
        if parsed is not None:
            return parsed
    return None


def _ratio(value: Any) -> float | None:
    parsed = _to_float(value)
    if parsed is None:
        return None
    return parsed / 100 if abs(parsed) > 1.5 else parsed


class DataProvider(ABC):
    name: str

    def __init__(self, timeout: float) -> None:
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "tsx-scanner/0.1"})

    @abstractmethod
    def fetch_metrics(self, stock: Stock) -> StockMetrics | None:
        raise NotImplementedError

    def _get_json(self, url: str, params: dict[str, Any] | None = None) -> Any:
        response = self.session.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()


class FinancialModelingPrepProvider(DataProvider):
    name = "FinancialModelingPrep"

    def __init__(self, api_key: str, timeout: float) -> None:
        super().__init__(timeout)
        self.api_key = api_key

    def fetch_metrics(self, stock: Stock) -> StockMetrics | None:
        if not self.api_key:
            return None
        symbol = stock.yahoo_symbol
        quote = self._get_first(f"https://financialmodelingprep.com/api/v3/quote/{symbol}")
        profile = self._get_first(f"https://financialmodelingprep.com/api/v3/profile/{symbol}")
        key_metrics = self._get_first(f"https://financialmodelingprep.com/api/v3/key-metrics-ttm/{symbol}")
        growth = self._get_first(f"https://financialmodelingprep.com/api/v3/income-statement-growth/{symbol}")
        if not any((quote, profile, key_metrics, growth)):
            return None

        metrics = StockMetrics(symbol=stock.symbol, name=stock.name, provider=self.name)
        metrics.price = _first_float(quote.get("price"), profile.get("price"))
        metrics.market_cap = _first_float(quote.get("marketCap"), profile.get("mktCap"))
        metrics.volume = _first_float(quote.get("volume"), profile.get("volAvg"))
        metrics.pe_ratio = _first_float(quote.get("pe"), key_metrics.get("peRatioTTM"))
        metrics.forward_pe = _first_float(key_metrics.get("forwardPERatioTTM"))
        metrics.price_to_book = _first_float(key_metrics.get("pbRatioTTM"), key_metrics.get("priceToBookRatioTTM"))
        metrics.eps = _first_float(quote.get("eps"), key_metrics.get("netIncomePerShareTTM"))
        metrics.revenue_growth = _ratio(growth.get("growthRevenue"))
        metrics.profit_margin = _ratio(key_metrics.get("netProfitMarginTTM"))
        metrics.return_on_equity = _ratio(key_metrics.get("roeTTM"), key_metrics.get("returnOnEquityTTM"))
        metrics.debt_to_equity = _first_float(key_metrics.get("debtToEquityTTM"))
        metrics.dividend_yield = _ratio(key_metrics.get("dividendYieldTTM"))
        metrics.beta = _first_float(profile.get("beta"))
        metrics.sector = profile.get("sector")
        metrics.industry = profile.get("industry")
        return metrics

    def _get_first(self, url: str) -> dict[str, Any]:
        payload = self._get_json(url, {"apikey": self.api_key})
        if isinstance(payload, list) and payload:
            return payload[0] if isinstance(payload[0], dict) else {}
        if isinstance(payload, dict):
            return payload
        return {}


class FinnhubProvider(DataProvider):
    name = "Finnhub"

    def __init__(self, api_key: str, timeout: float) -> None:
        super().__init__(timeout)
        self.api_key = api_key

    def fetch_metrics(self, stock: Stock) -> StockMetrics | None:
        if not self.api_key:
            return None
        symbol = stock.yahoo_symbol
        params = {"symbol": symbol, "token": self.api_key}
        quote = self._get_json("https://finnhub.io/api/v1/quote", params)
        metric = self._get_json("https://finnhub.io/api/v1/stock/metric", {**params, "metric": "all"})
        profile = self._get_json("https://finnhub.io/api/v1/stock/profile2", params)
        metric_values = metric.get("metric", {}) if isinstance(metric, dict) else {}
        if not any((quote.get("c"), metric_values, profile.get("name"))):
            return None

        metrics = StockMetrics(symbol=stock.symbol, name=profile.get("name") or stock.name, provider=self.name)
        metrics.price = _first_float(quote.get("c"))
        metrics.market_cap = _first_float(profile.get("marketCapitalization"))
        if metrics.market_cap is not None:
            metrics.market_cap *= 1_000_000
        metrics.volume = _first_float(metric_values.get("10DayAverageTradingVolume"))
        metrics.pe_ratio = _first_float(metric_values.get("peBasicExclExtraTTM"), metric_values.get("peTTM"))
        metrics.forward_pe = _first_float(metric_values.get("forwardPE"))
        metrics.price_to_book = _first_float(metric_values.get("pbQuarterly"), metric_values.get("ptbvQuarterly"))
        metrics.eps = _first_float(metric_values.get("epsBasicExclExtraItemsTTM"))
        metrics.revenue_growth = _ratio(metric_values.get("revenueGrowthTTMYoy"))
        metrics.profit_margin = _ratio(metric_values.get("netProfitMarginTTM"))
        metrics.return_on_equity = _ratio(metric_values.get("roeTTM"))
        metrics.debt_to_equity = _first_float(metric_values.get("totalDebt/totalEquityQuarterly"))
        metrics.dividend_yield = _ratio(metric_values.get("currentDividendYieldTTM"))
        metrics.beta = _first_float(metric_values.get("beta"))
        metrics.fifty_two_week_change = _ratio(metric_values.get("52WeekPriceReturnDaily"))
        return metrics


class AlphaVantageProvider(DataProvider):
    name = "Alpha Vantage"

    def __init__(self, api_key: str, timeout: float) -> None:
        super().__init__(timeout)
        self.api_key = api_key

    def fetch_metrics(self, stock: Stock) -> StockMetrics | None:
        if not self.api_key:
            return None
        for symbol in self._candidate_symbols(stock):
            overview = self._get_json(
                "https://www.alphavantage.co/query",
                {"function": "OVERVIEW", "symbol": symbol, "apikey": self.api_key},
            )
            if not isinstance(overview, dict) or not overview.get("Symbol"):
                continue
            quote = self._get_json(
                "https://www.alphavantage.co/query",
                {"function": "GLOBAL_QUOTE", "symbol": symbol, "apikey": self.api_key},
            ).get("Global Quote", {})
            metrics = StockMetrics(symbol=stock.symbol, name=overview.get("Name") or stock.name, provider=self.name)
            metrics.price = _first_float(quote.get("05. price"), overview.get("AnalystTargetPrice"))
            metrics.market_cap = _first_float(overview.get("MarketCapitalization"))
            metrics.volume = _first_float(quote.get("06. volume"))
            metrics.pe_ratio = _first_float(overview.get("PERatio"), overview.get("TrailingPE"))
            metrics.forward_pe = _first_float(overview.get("ForwardPE"))
            metrics.price_to_book = _first_float(overview.get("PriceToBookRatio"))
            metrics.eps = _first_float(overview.get("EPS"))
            metrics.revenue_growth = _ratio(overview.get("QuarterlyRevenueGrowthYOY"))
            metrics.profit_margin = _ratio(overview.get("ProfitMargin"))
            metrics.return_on_equity = _ratio(overview.get("ReturnOnEquityTTM"))
            metrics.debt_to_equity = _first_float(overview.get("DebtToEquity"))
            metrics.dividend_yield = _ratio(overview.get("DividendYield"))
            metrics.beta = _first_float(overview.get("Beta"))
            metrics.sector = overview.get("Sector")
            metrics.industry = overview.get("Industry")
            return metrics
        return None

    @staticmethod
    def _candidate_symbols(stock: Stock) -> Iterable[str]:
        yield stock.yahoo_symbol
        yield f"{stock.symbol}.TRT"
        yield stock.symbol


class YahooFinanceProvider(DataProvider):
    name = "Yahoo Finance"

    def fetch_metrics(self, stock: Stock) -> StockMetrics | None:
        metrics = self._fetch_with_yfinance(stock)
        if metrics:
            return metrics
        return self._fetch_with_chart_api(stock)

    def _fetch_with_yfinance(self, stock: Stock) -> StockMetrics | None:
        try:
            import yfinance as yf
        except ImportError:
            return None

        ticker = yf.Ticker(stock.yahoo_symbol)
        info = ticker.get_info()
        if not isinstance(info, dict) or not info:
            return None
        metrics = StockMetrics(symbol=stock.symbol, name=info.get("longName") or stock.name, provider=self.name)
        fast_info = getattr(ticker, "fast_info", {}) or {}
        metrics.price = _first_float(info.get("currentPrice"), info.get("regularMarketPrice"), fast_info.get("last_price"))
        metrics.market_cap = _first_float(info.get("marketCap"))
        metrics.volume = _first_float(info.get("volume"), info.get("averageVolume"))
        metrics.pe_ratio = _first_float(info.get("trailingPE"))
        metrics.forward_pe = _first_float(info.get("forwardPE"))
        metrics.price_to_book = _first_float(info.get("priceToBook"))
        metrics.eps = _first_float(info.get("trailingEps"), info.get("forwardEps"))
        metrics.revenue_growth = _ratio(info.get("revenueGrowth"))
        metrics.profit_margin = _ratio(info.get("profitMargins"))
        metrics.return_on_equity = _ratio(info.get("returnOnEquity"))
        metrics.debt_to_equity = _first_float(info.get("debtToEquity"))
        metrics.dividend_yield = _ratio(info.get("dividendYield"))
        metrics.beta = _first_float(info.get("beta"))
        metrics.fifty_two_week_change = _ratio(info.get("52WeekChange"))
        metrics.sector = info.get("sector")
        metrics.industry = info.get("industry")
        return metrics

    def _fetch_with_chart_api(self, stock: Stock) -> StockMetrics | None:
        payload = self._get_json(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{stock.yahoo_symbol}",
            {"range": "1d", "interval": "1d"},
        )
        result = ((payload.get("chart") or {}).get("result") or [None])[0]
        if not result:
            return None
        meta = result.get("meta", {})
        metrics = StockMetrics(symbol=stock.symbol, name=stock.name, provider=self.name)
        metrics.price = _first_float(meta.get("regularMarketPrice"), meta.get("previousClose"))
        metrics.volume = _first_float(meta.get("regularMarketVolume"))
        return metrics if metrics.price is not None else None


class ProviderManager:
    def __init__(self, api_keys: ApiKeys, timeout: float) -> None:
        self.providers: list[DataProvider] = [
            FinancialModelingPrepProvider(api_keys.financialmodelingprep, timeout),
            FinnhubProvider(api_keys.finnhub, timeout),
            AlphaVantageProvider(api_keys.alpha_vantage, timeout),
            YahooFinanceProvider(timeout),
        ]

    def fetch_metrics(self, stock: Stock) -> StockMetrics:
        failures: list[str] = []
        for provider in self.providers:
            try:
                metrics = provider.fetch_metrics(stock)
            except Exception as exc:  # Network/API providers fail independently.
                failures.append(f"{provider.name}: {exc}")
                continue
            if metrics is not None and metrics.price is not None:
                return metrics
            failures.append(f"{provider.name}: no usable data")
        return StockMetrics(
            symbol=stock.symbol,
            name=stock.name,
            provider="; ".join(provider.name for provider in self.providers),
            error=" | ".join(failures),
        )
