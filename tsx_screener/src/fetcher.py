"""Multi-source fundamental & market data fetcher with automatic fallback.

Provider priority:
  1. FinancialModelingPrep (if API key present)
  2. Finnhub               (if API key present)
  3. Alpha Vantage         (if API key present)
  4. yfinance              (always available, no key needed)
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import json

import requests

logger = logging.getLogger(__name__)

# ─── Data model ───────────────────────────────────────────────────────────────

@dataclass
class StockData:
    # Identity
    ticker: str = ""
    name: str = ""
    exchange: str = "TSX"
    sector: str = ""
    industry: str = ""

    # Price / market
    price: Optional[float] = None
    currency: str = "CAD"
    market_cap: Optional[float] = None        # in CAD
    shares_outstanding: Optional[float] = None
    avg_volume_30d: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    beta: Optional[float] = None

    # Returns
    return_1m: Optional[float] = None         # %
    return_3m: Optional[float] = None
    return_6m: Optional[float] = None
    return_1y: Optional[float] = None

    # Valuation
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    ev: Optional[float] = None

    # Profitability
    roe: Optional[float] = None               # %
    roa: Optional[float] = None
    gross_margin: Optional[float] = None      # %
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None

    # Growth (YoY)
    revenue_growth: Optional[float] = None    # %
    earnings_growth: Optional[float] = None

    # Balance sheet
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None

    # Income
    revenue_ttm: Optional[float] = None
    eps_ttm: Optional[float] = None
    eps_forward: Optional[float] = None

    # Dividend
    dividend_yield: Optional[float] = None    # %
    dividend_rate: Optional[float] = None
    payout_ratio: Optional[float] = None

    # Meta
    data_source: str = ""
    fetch_timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    error: str = ""

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: Dict) -> "StockData":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


# ─── Cache ────────────────────────────────────────────────────────────────────

_DATA_DIR = Path(__file__).parent.parent / "data" / "cache"


def _cache_path(ticker: str) -> Path:
    return _DATA_DIR / f"{ticker}.json"


def _load_from_cache(ticker: str, max_age_days: int) -> Optional[StockData]:
    path = _cache_path(ticker)
    if not path.exists():
        return None
    try:
        d = json.loads(path.read_text())
        ts = datetime.fromisoformat(d.get("fetch_timestamp", "2000-01-01"))
        if datetime.utcnow() - ts > timedelta(days=max_age_days):
            return None
        return StockData.from_dict(d)
    except Exception:
        return None


def _save_to_cache(data: StockData) -> None:
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _cache_path(data.ticker).write_text(json.dumps(data.to_dict(), indent=2))
    except Exception as exc:
        logger.debug("Cache write failed for %s: %s", data.ticker, exc)


# ─── yfinance provider ────────────────────────────────────────────────────────

def _fetch_yfinance(ticker: str, name: str = "") -> StockData:
    """Fetch stock data using yfinance (no API key required)."""
    try:
        import yfinance as yf
    except ImportError:
        raise ImportError("yfinance is not installed. Run: pip install yfinance")

    yt = f"{ticker}.TO"
    info: Dict[str, Any] = {}
    hist = None

    try:
        yobj = yf.Ticker(yt)
        info = yobj.info or {}
        # Fetch 1-year history for return calculations
        hist = yobj.history(period="1y", auto_adjust=True)
    except Exception as exc:
        logger.debug("yfinance history fetch failed for %s: %s", ticker, exc)

    def _g(key: str, default=None):
        val = info.get(key)
        return val if val not in (None, "None", "N/A", float("inf"), float("-inf")) else default

    # Price / market
    price = _g("currentPrice") or _g("regularMarketPrice") or _g("previousClose")
    market_cap = _g("marketCap")
    shares = _g("sharesOutstanding")

    # Historical returns from price history
    return_1m = return_3m = return_6m = return_1y = None
    if hist is not None and not hist.empty and price:
        closes = hist["Close"]
        now_price = price

        def _ret(days: int):
            if len(closes) < days:
                return None
            past = float(closes.iloc[-days])
            if past and past > 0:
                return round((now_price / past - 1) * 100, 2)
            return None

        return_1m = _ret(21)
        return_3m = _ret(63)
        return_6m = _ret(126)
        return_1y = _ret(252)

    # Valuation
    pe_ratio = _g("trailingPE")
    forward_pe = _g("forwardPE")
    pb_ratio = _g("priceToBook")
    ps_ratio = _g("priceToSalesTrailing12Months")
    ev_ebitda = _g("enterpriseToEbitda")
    ev = _g("enterpriseValue")

    # Profitability
    roe = _pct(_g("returnOnEquity"))
    roa = _pct(_g("returnOnAssets"))
    gross_margin = _pct(_g("grossMargins"))
    operating_margin = _pct(_g("operatingMargins"))
    net_margin = _pct(_g("profitMargins"))

    # Growth
    revenue_growth = _pct(_g("revenueGrowth"))
    earnings_growth = _pct(_g("earningsGrowth"))

    # Balance sheet
    debt_to_equity = _g("debtToEquity")
    if debt_to_equity is not None:
        debt_to_equity = debt_to_equity / 100.0  # yfinance gives it as %, convert to ratio
    current_ratio = _g("currentRatio")

    # Income
    revenue_ttm = _g("totalRevenue")
    eps_ttm = _g("trailingEps")
    eps_forward = _g("forwardEps")

    # Dividend
    div_yield = _pct(_g("dividendYield"))
    div_rate = _g("dividendRate")
    payout = _pct(_g("payoutRatio"))

    return StockData(
        ticker=ticker,
        name=name or (_g("longName") or _g("shortName") or ticker),
        exchange="TSX",
        sector=_g("sector") or "",
        industry=_g("industry") or "",
        price=_safe_float(price),
        currency="CAD",
        market_cap=_safe_float(market_cap),
        shares_outstanding=_safe_float(shares),
        avg_volume_30d=_safe_float(_g("averageVolume")),
        week_52_high=_safe_float(_g("fiftyTwoWeekHigh")),
        week_52_low=_safe_float(_g("fiftyTwoWeekLow")),
        beta=_safe_float(_g("beta")),
        return_1m=return_1m,
        return_3m=return_3m,
        return_6m=return_6m,
        return_1y=return_1y,
        pe_ratio=_safe_float(pe_ratio),
        forward_pe=_safe_float(forward_pe),
        pb_ratio=_safe_float(pb_ratio),
        ps_ratio=_safe_float(ps_ratio),
        ev_ebitda=_safe_float(ev_ebitda),
        ev=_safe_float(ev),
        roe=roe,
        roa=roa,
        gross_margin=gross_margin,
        operating_margin=operating_margin,
        net_margin=net_margin,
        revenue_growth=revenue_growth,
        earnings_growth=earnings_growth,
        debt_to_equity=_safe_float(debt_to_equity),
        current_ratio=_safe_float(current_ratio),
        revenue_ttm=_safe_float(revenue_ttm),
        eps_ttm=_safe_float(eps_ttm),
        eps_forward=_safe_float(eps_forward),
        dividend_yield=div_yield,
        dividend_rate=_safe_float(div_rate),
        payout_ratio=payout,
        data_source="yfinance",
    )


def _pct(val) -> Optional[float]:
    """Convert a fractional ratio (0.15) to a percentage (15.0)."""
    if val is None:
        return None
    try:
        f = float(val)
        if f in (float("inf"), float("-inf")):
            return None
        return round(f * 100, 2)
    except (TypeError, ValueError):
        return None


def _safe_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        f = float(val)
        if f in (float("inf"), float("-inf")):
            return None
        return f
    except (TypeError, ValueError):
        return None


# ─── FMP provider ─────────────────────────────────────────────────────────────

def _fetch_fmp(ticker: str, api_key: str, name: str = "") -> StockData:
    """Fetch via FinancialModelingPrep API."""
    base = "https://financialmodelingprep.com/api/v3"
    yt = f"{ticker}.TO"

    def _get(path: str, params: Optional[Dict] = None) -> Any:
        url = f"{base}{path}"
        p = {"apikey": api_key}
        if params:
            p.update(params)
        r = requests.get(url, params=p, timeout=20)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and "Error Message" in data:
            raise ValueError(data["Error Message"])
        return data

    # Quote
    quote_data = _get(f"/quote/{yt}")
    quote = quote_data[0] if quote_data else {}

    # Key metrics TTM
    metrics_data = _get(f"/key-metrics-ttm/{yt}")
    metrics = metrics_data[0] if metrics_data else {}

    # Financial ratios TTM
    ratios_data = _get(f"/ratios-ttm/{yt}")
    ratios = ratios_data[0] if ratios_data else {}

    # Company profile
    profile_data = _get(f"/profile/{yt}")
    profile = profile_data[0] if profile_data else {}

    def _q(key, default=None):
        return quote.get(key, default)

    def _m(key, default=None):
        return metrics.get(key, default)

    def _r(key, default=None):
        return ratios.get(key, default)

    def _p(key, default=None):
        return profile.get(key, default)

    price = _q("price") or _q("previousClose")
    market_cap = _q("marketCap")

    return StockData(
        ticker=ticker,
        name=name or _p("companyName") or ticker,
        exchange="TSX",
        sector=_p("sector") or "",
        industry=_p("industry") or "",
        price=_safe_float(price),
        currency="CAD",
        market_cap=_safe_float(market_cap),
        shares_outstanding=_safe_float(_q("sharesOutstanding")),
        avg_volume_30d=_safe_float(_q("avgVolume")),
        week_52_high=_safe_float(_q("yearHigh")),
        week_52_low=_safe_float(_q("yearLow")),
        beta=_safe_float(_p("beta")),
        pe_ratio=_safe_float(_q("pe") or _m("peRatioTTM")),
        forward_pe=_safe_float(_m("priceEarningsToGrowthRatioTTM")),
        pb_ratio=_safe_float(_m("pbRatioTTM")),
        ps_ratio=_safe_float(_m("priceToSalesRatioTTM")),
        ev_ebitda=_safe_float(_m("enterpriseValueOverEBITDATTM")),
        roe=_pct(_r("returnOnEquityTTM")),
        roa=_pct(_r("returnOnAssetsTTM")),
        gross_margin=_pct(_r("grossProfitMarginTTM")),
        operating_margin=_pct(_r("operatingProfitMarginTTM")),
        net_margin=_pct(_r("netProfitMarginTTM")),
        revenue_growth=_pct(_m("revenueGrowthTTM")),
        earnings_growth=_pct(_m("netIncomeGrowthTTM")),
        debt_to_equity=_safe_float(_r("debtEquityRatioTTM")),
        current_ratio=_safe_float(_r("currentRatioTTM")),
        eps_ttm=_safe_float(_q("eps")),
        dividend_yield=_pct(_p("lastDiv")) if price and price > 0 else None,
        data_source="fmp",
    )


# ─── Finnhub provider ─────────────────────────────────────────────────────────

def _fetch_finnhub(ticker: str, api_key: str, name: str = "") -> StockData:
    """Fetch via Finnhub API."""
    headers = {"X-Finnhub-Token": api_key}
    yt = f"{ticker}:TSX"

    def _get(path: str, params: Optional[Dict] = None) -> Any:
        url = f"https://finnhub.io/api/v1{path}"
        r = requests.get(url, params=params or {}, headers=headers, timeout=20)
        r.raise_for_status()
        return r.json()

    quote = _get("/quote", {"symbol": yt})
    metrics_raw = _get("/stock/metric", {"symbol": yt, "metric": "all"})
    metrics = metrics_raw.get("metric", {})
    profile = _get("/stock/profile2", {"symbol": yt})

    def _m(key, default=None):
        return metrics.get(key, default)

    price = quote.get("c") or quote.get("pc")

    return StockData(
        ticker=ticker,
        name=name or profile.get("name") or ticker,
        exchange="TSX",
        sector=profile.get("finnhubIndustry") or "",
        industry=profile.get("finnhubIndustry") or "",
        price=_safe_float(price),
        currency="CAD",
        market_cap=_safe_float(profile.get("marketCapitalization", 0) * 1e6)
            if profile.get("marketCapitalization") else None,
        shares_outstanding=_safe_float(profile.get("shareOutstanding", 0) * 1e6)
            if profile.get("shareOutstanding") else None,
        avg_volume_30d=_safe_float(_m("10DayAverageTradingVolume")),
        week_52_high=_safe_float(_m("52WeekHigh")),
        week_52_low=_safe_float(_m("52WeekLow")),
        beta=_safe_float(_m("beta")),
        return_1m=_safe_float(_m("1MonthPriceReturnDaily")),
        return_3m=_safe_float(_m("3MonthPriceReturnDaily")),
        return_6m=_safe_float(_m("6MonthPriceReturnDaily")),
        return_1y=_safe_float(_m("52WeekPriceReturnDaily")),
        pe_ratio=_safe_float(_m("peNormalizedAnnual")),
        pb_ratio=_safe_float(_m("pbAnnual")),
        ps_ratio=_safe_float(_m("psAnnual")),
        ev_ebitda=_safe_float(_m("currentEv/freeCashFlowAnnual")),
        roe=_safe_float(_m("roeRfy")),
        roa=_safe_float(_m("roaRfy")),
        gross_margin=_safe_float(_m("grossMarginAnnual")),
        operating_margin=_safe_float(_m("operatingMarginAnnual")),
        net_margin=_safe_float(_m("netProfitMarginAnnual")),
        revenue_growth=_safe_float(_m("revenueGrowthAnnualYoy")),
        debt_to_equity=_safe_float(_m("totalDebt/totalEquityAnnual")),
        current_ratio=_safe_float(_m("currentRatioAnnual")),
        eps_ttm=_safe_float(_m("epsNormalizedAnnual")),
        dividend_yield=_safe_float(_m("dividendYieldIndicatedAnnual")),
        data_source="finnhub",
    )


# ─── Orchestrator ─────────────────────────────────────────────────────────────

class DataFetcher:
    """Fetch stock data with automatic provider fallback and caching."""

    def __init__(self, config):
        self.config = config
        self._rate_limiter: Dict[str, float] = {}

    def _throttle(self, provider: str, min_interval: float = 0.12) -> None:
        """Ensure we don't hammer a single provider."""
        last = self._rate_limiter.get(provider, 0.0)
        elapsed = time.monotonic() - last
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        self._rate_limiter[provider] = time.monotonic()

    def fetch_one(self, ticker: str, name: str = "", use_cache: bool = True) -> StockData:
        """Fetch data for a single ticker, trying providers in priority order."""
        if use_cache:
            cached = _load_from_cache(ticker, self.config.settings.data_cache_days)
            if cached and cached.price:
                return cached

        keys = self.config.api_keys
        errors = []

        # 1. FMP
        if keys.financialmodelingprep:
            try:
                self._throttle("fmp", 0.25)
                data = _fetch_fmp(ticker, keys.financialmodelingprep, name)
                if data.price:
                    _save_to_cache(data)
                    return data
            except Exception as exc:
                errors.append(f"FMP: {exc}")
                logger.debug("FMP failed for %s: %s", ticker, exc)

        # 2. Finnhub
        if keys.finnhub:
            try:
                self._throttle("finnhub", 1.0)  # 60 req/min free tier
                data = _fetch_finnhub(ticker, keys.finnhub, name)
                if data.price:
                    _save_to_cache(data)
                    return data
            except Exception as exc:
                errors.append(f"Finnhub: {exc}")
                logger.debug("Finnhub failed for %s: %s", ticker, exc)

        # 3. yfinance (always available)
        try:
            self._throttle("yfinance", 0.5)
            data = _fetch_yfinance(ticker, name)
            if data.price is not None:
                _save_to_cache(data)
                return data
            # Even with no price, save the partial data
            data.error = "; ".join(errors) if errors else "No price available"
            _save_to_cache(data)
            return data
        except Exception as exc:
            errors.append(f"yfinance: {exc}")
            logger.warning("All providers failed for %s: %s", ticker, errors)

        stub = StockData(ticker=ticker, name=name, error="; ".join(errors), data_source="none")
        return stub

    def fetch_all(
        self,
        tickers: List[Dict],
        use_cache: bool = True,
        progress_callback=None,
    ) -> List[StockData]:
        """Fetch data for all tickers concurrently with a thread pool."""
        results: List[StockData] = []
        total = len(tickers)
        done = 0

        max_workers = max(1, min(self.config.settings.max_workers, 16))

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_ticker = {
                executor.submit(self.fetch_one, t["ticker"], t.get("name", ""), use_cache): t
                for t in tickers
            }
            for future in as_completed(future_to_ticker):
                t = future_to_ticker[future]
                try:
                    data = future.result(timeout=60)
                except Exception as exc:
                    data = StockData(ticker=t["ticker"], name=t.get("name", ""), error=str(exc))
                results.append(data)
                done += 1
                if progress_callback:
                    progress_callback(done, total, data.ticker)

        # Preserve original order
        order = {t["ticker"]: i for i, t in enumerate(tickers)}
        results.sort(key=lambda d: order.get(d.ticker, 9999))
        return results
