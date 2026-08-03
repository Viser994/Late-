"""Orchestrates data providers with automatic fallback."""

from __future__ import annotations

from typing import Callable, Optional

from .config import AppConfig
from .models import StockData, Ticker
from .providers import PROVIDER_REGISTRY, Provider


class DataService:
    """Fetch data for a ticker, trying providers in the configured order.

    The first provider that returns usable data wins. Missing individual fields
    are then back-filled from data that was *already* fetched (no extra network
    calls) so a partial primary result is completed where possible.
    """

    def __init__(self, config: AppConfig):
        self.config = config
        self.providers: list[Provider] = self._build_providers()

    def _build_providers(self) -> list[Provider]:
        providers: list[Provider] = []
        for name in self.config.provider_order:
            cls = PROVIDER_REGISTRY.get(name)
            if cls is None:
                continue
            provider = cls(self.config)
            if provider.is_available():
                providers.append(provider)
        # yfinance is always a safe last resort even if not listed explicitly.
        if not any(p.name == "yfinance" for p in providers):
            yf = PROVIDER_REGISTRY["yfinance"](self.config)
            if yf.is_available():
                providers.append(yf)
        return providers

    @property
    def active_provider_names(self) -> list[str]:
        return [p.name for p in self.providers]

    def fetch(self, ticker: Ticker) -> StockData:
        """Return the best available StockData for a ticker."""
        primary: Optional[StockData] = None
        collected: list[StockData] = []
        errors: list[str] = []

        for provider in self.providers:
            try:
                result = provider.fetch(ticker)
            except Exception as exc:  # noqa: BLE001 - keep falling back
                errors.append(f"{provider.name}: {exc}")
                continue
            if result is None:
                continue
            collected.append(result)
            if primary is None:
                primary = result
            # Once we have a reasonably complete primary result, stop early.
            if primary is not None and _completeness(primary) >= 0.6:
                break

        if primary is None:
            blank = StockData(ticker=ticker.symbol, name=ticker.name, exchange=ticker.exchange)
            blank.errors = errors or ["no provider returned data"]
            return blank

        _backfill(primary, collected)
        return primary

    def fetch_many(
        self,
        tickers: list[Ticker],
        progress: Optional[Callable[[int, int, StockData], None]] = None,
        should_stop: Optional[Callable[[], bool]] = None,
    ) -> list[StockData]:
        """Fetch many tickers in parallel, reporting progress as we go."""
        from concurrent.futures import ThreadPoolExecutor, as_completed

        results: list[StockData] = []
        total = len(tickers)
        workers = max(1, min(self.config.max_workers, total or 1))

        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(self.fetch, t): t for t in tickers}
            done = 0
            for future in as_completed(futures):
                if should_stop and should_stop():
                    break
                ticker = futures[future]
                try:
                    data = future.result()
                except Exception as exc:  # noqa: BLE001
                    data = StockData(ticker=ticker.symbol, name=ticker.name)
                    data.errors.append(str(exc))
                done += 1
                results.append(data)
                if progress:
                    progress(done, total, data)
        return results


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
_NUMERIC_FIELDS = (
    "price", "market_cap", "beta", "week52_high", "week52_low", "volume",
    "avg_volume", "pe_ratio", "pb_ratio", "ps_ratio", "peg_ratio", "roe",
    "roa", "profit_margin", "operating_margin", "debt_to_equity",
    "current_ratio", "free_cash_flow", "revenue_growth", "earnings_growth",
    "dividend_yield", "payout_ratio",
)


def _completeness(data: StockData) -> float:
    present = sum(1 for f in _NUMERIC_FIELDS if getattr(data, f) is not None)
    return present / len(_NUMERIC_FIELDS)


def _backfill(primary: StockData, others: list[StockData]) -> None:
    """Fill None fields on primary using already-fetched fallback results."""
    for other in others:
        if other is primary:
            continue
        for f in _NUMERIC_FIELDS:
            if getattr(primary, f) is None and getattr(other, f) is not None:
                setattr(primary, f, getattr(other, f))
        if not primary.sector and other.sector:
            primary.sector = other.sector
        if not primary.industry and other.industry:
            primary.industry = other.industry
        if not primary.name and other.name:
            primary.name = other.name
