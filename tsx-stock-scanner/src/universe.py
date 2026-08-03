from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

import requests

from src.config import get_cache_dir
from src.data_providers import DataAggregator

logger = logging.getLogger(__name__)

TICKER_CACHE_FILE = "tsx_tickers.json"

# Patterns that indicate non-common-share instruments on TSX.
EXCLUDE_PATTERNS = [
    r"\.PR\.?",          # preferred shares
    r"\.WT\.?",          # warrants
    r"\.UN$",            # units (often REIT/ETF structures)
    r"\.RT\.?",          # rights
    r"\.DB\.?",          # debentures
    r"\.PF\.?",          # preferred
    r"-[A-Z]$",          # class shares like -A, -B (keep main tickers)
]

EXCLUDE_KEYWORDS = {
    "ETF",
    "FUND",
    "TRUST",
    "INDEX",
    "BOND",
    "DEBENTURE",
    "WARRANT",
    "PREFERRED",
    "UNITS",
}

EXCLUDE_SUFFIXES = (
    ".UN",
    ".DB",
    ".WT",
    ".PR",
    ".PF",
    ".RT",
    ".NV",
    ".IR",
)


def _normalize_ticker(ticker: str) -> str:
    return ticker.replace(".TO", "").strip().upper()


def is_common_share(ticker: str, name: str = "") -> bool:
    """Return True if the symbol appears to be a common share."""
    symbol = _normalize_ticker(ticker)
    upper_name = (name or "").upper()

    if not symbol or len(symbol) > 6:
        return False

    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, symbol):
            return False

    for suffix in EXCLUDE_SUFFIXES:
        if symbol.endswith(suffix):
            return False

    for keyword in EXCLUDE_KEYWORDS:
        if keyword in upper_name:
            return False

    # TSX common shares are typically 1-5 letter tickers.
    if not re.fullmatch(r"[A-Z]{1,5}", symbol):
        return False

    return True


def _fetch_from_tsx_directory() -> list[str]:
    """Fetch all TSX listings from the official TSX company directory."""
    url = "https://www.tsx.com/json/company-directory/search/tsx/%5E"
    try:
        response = requests.get(
            url,
            timeout=60,
            headers={"User-Agent": "TSX-Stock-Scanner/1.0"},
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results", [])
        tickers: list[str] = []
        for item in results:
            symbol = item.get("symbol", "")
            name = item.get("name", "")
            if symbol and is_common_share(symbol, name):
                tickers.append(_normalize_ticker(symbol))
        tickers = sorted(set(tickers))
        logger.info("TSX directory returned %d common-share tickers", len(tickers))
        return tickers
    except Exception as exc:
        logger.warning("TSX directory fetch failed: %s", exc)
        return []


def _fetch_from_wikipedia() -> list[str]:
    """Fallback universe source when API keys are unavailable."""
    url = "https://en.wikipedia.org/wiki/List_of_S%26P/TSX_Composite_Index_constituents"
    try:
        response = requests.get(url, timeout=30, headers={"User-Agent": "TSX-Stock-Scanner/1.0"})
        response.raise_for_status()
        # Simple regex extraction of TSX-style tickers from wiki table.
        matches = re.findall(r">\s*([A-Z]{1,5})\s*</a>", response.text)
        tickers = sorted({m for m in matches if is_common_share(m)})
        logger.info("Wikipedia fallback returned %d tickers", len(tickers))
        return tickers
    except Exception as exc:
        logger.warning("Wikipedia universe fetch failed: %s", exc)
        return []


def _fetch_from_yfinance_screener() -> list[str]:
    """Attempt to pull TSX listings via yfinance."""
    try:
        import yfinance as yf

        # yfinance screener for Canadian equities on TSX.
        query = yf.Screener()
        query.set_predefined_body("most_actives")
        data = query.data
        quotes = data.get("quotes", []) if isinstance(data, dict) else []
        tickers = []
        for quote in quotes:
            symbol = quote.get("symbol", "")
            if symbol.endswith(".TO") and is_common_share(symbol):
                tickers.append(_normalize_ticker(symbol))
        return sorted(set(tickers))
    except Exception as exc:
        logger.debug("yfinance screener fallback failed: %s", exc)
        return []


class UniverseManager:
    """Manage the local TSX ticker universe."""

    def __init__(self, cache_dir: Path, aggregator: DataAggregator | None = None) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_path = self.cache_dir / TICKER_CACHE_FILE
        self.aggregator = aggregator or DataAggregator()

    def load_cached(self) -> dict | None:
        if not self.cache_path.exists():
            return None
        return json.loads(self.cache_path.read_text(encoding="utf-8"))

    def save_cache(self, tickers: list[str], source: str) -> None:
        payload = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "count": len(tickers),
            "tickers": tickers,
        }
        self.cache_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def get_tickers(self, force_refresh: bool = False) -> list[str]:
        if not force_refresh:
            cached = self.load_cached()
            if cached and cached.get("tickers"):
                logger.info(
                    "Loaded %d cached tickers (updated %s)",
                    len(cached["tickers"]),
                    cached.get("updated_at", "unknown"),
                )
                return cached["tickers"]

        return self.refresh()

    def refresh(self) -> list[str]:
        source = "unknown"
        raw_tickers: list[str] = []

        api_tickers = self.aggregator.fetch_universe()
        if api_tickers:
            raw_tickers = api_tickers
            source = "api"

        if not raw_tickers:
            raw_tickers = _fetch_from_tsx_directory()
            source = "tsx.com"

        if not raw_tickers:
            raw_tickers = _fetch_from_wikipedia()
            source = "wikipedia"

        if not raw_tickers:
            raw_tickers = _fetch_from_yfinance_screener()
            source = "yfinance"

        filtered = sorted(
            {_normalize_ticker(t) for t in raw_tickers if is_common_share(t)}
        )
        if not filtered:
            raise RuntimeError(
                "Unable to retrieve TSX ticker universe. "
                "Check your API keys or network connection."
            )

        self.save_cache(filtered, source)
        logger.info("Refreshed universe: %d common shares from %s", len(filtered), source)
        return filtered


def create_universe_manager(config: dict) -> UniverseManager:
    cache_dir = get_cache_dir(config)
    return UniverseManager(cache_dir, DataAggregator(config))
