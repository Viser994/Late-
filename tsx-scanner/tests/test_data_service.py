"""Tests for provider fallback / orchestration."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tsx_scanner.config import AppConfig
from tsx_scanner.data_service import DataService, _backfill, _completeness
from tsx_scanner.models import StockData, Ticker
from tsx_scanner.providers.base import Provider, as_percent, to_float


class _FailProvider(Provider):
    name = "fail"
    requires_key = False

    def is_available(self):
        return True

    def fetch(self, ticker):
        raise RuntimeError("boom")


class _PartialProvider(Provider):
    name = "partial"
    requires_key = False

    def is_available(self):
        return True

    def fetch(self, ticker):
        return StockData(ticker=ticker.symbol, name=ticker.name, price=10.0,
                         market_cap=1e9, source="partial")


class _RichProvider(Provider):
    name = "rich"
    requires_key = False

    def is_available(self):
        return True

    def fetch(self, ticker):
        return StockData(ticker=ticker.symbol, name=ticker.name, price=10.0,
                         market_cap=1e9, pe_ratio=12.0, roe=15.0, source="rich")


def test_to_float_and_percent():
    assert to_float("1,234.5") == 1234.5
    assert to_float("12%") == 12.0
    assert to_float("N/A") is None
    assert to_float(None) is None
    assert as_percent(0.15) == 15.0
    assert as_percent(15) == 15.0


def test_fallback_skips_failing_provider():
    svc = DataService.__new__(DataService)
    svc.config = AppConfig()
    svc.providers = [_FailProvider(svc.config), _RichProvider(svc.config)]
    data = svc.fetch(Ticker("RY", "Royal Bank"))
    assert data.source == "rich"
    assert data.pe_ratio == 12.0


def test_backfill_from_secondary():
    primary = StockData(ticker="RY", price=10.0, market_cap=1e9, source="partial")
    secondary = StockData(ticker="RY", price=10.0, market_cap=1e9, pe_ratio=9.0,
                          roe=20.0, sector="Financials", source="rich")
    _backfill(primary, [primary, secondary])
    assert primary.pe_ratio == 9.0
    assert primary.roe == 20.0
    assert primary.sector == "Financials"
    assert primary.source == "partial"  # provenance of the primary is kept


def test_completeness_monotonic():
    low = StockData(ticker="A", price=1.0)
    high = StockData(ticker="B", price=1.0, market_cap=1.0, pe_ratio=1.0,
                     roe=1.0, roa=1.0)
    assert _completeness(high) > _completeness(low)


def test_all_providers_fail_returns_blank_with_errors():
    svc = DataService.__new__(DataService)
    svc.config = AppConfig()
    svc.providers = [_FailProvider(svc.config)]
    data = svc.fetch(Ticker("RY", "Royal Bank"))
    assert data.source == ""
    assert data.errors
