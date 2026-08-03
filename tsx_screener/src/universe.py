"""TSX stock universe — fetches, filters, and caches the ticker list."""

import json
import logging
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import requests

from .config import AppConfig

logger = logging.getLogger(__name__)

# Cached ticker file location (relative to project root)
_DATA_DIR = Path(__file__).parent.parent / "data"
_TICKER_CACHE = _DATA_DIR / "tsx_tickers.json"

# ─── Seed list of well-known TSX common shares ────────────────────────────────
# Used as a fallback when the API is unavailable.  This covers ~200 of the most
# liquid names so the app is immediately useful without any API key.
# Note: some tickers change over time. Use `python main.py update` with an FMP
# API key for a fully up-to-date universe.
TSX_SEED_TICKERS: List[str] = [
    # Financials — Banks & Insurance
    "RY", "TD", "BNS", "BMO", "CM", "NA", "MFC", "SLF", "GWO", "IAG",
    "FFH", "IFC", "EQB", "LB",
    # Energy — Oil & Gas
    "CNQ", "SU", "CVE", "IMO", "ARX", "POU", "BTE", "TOU", "VET", "WCP",
    "PEY", "KEL", "AAV", "BIR", "FRU", "TVE",
    # Energy — Pipelines & Midstream
    "ENB", "TRP", "PPL", "KEY", "GEI",
    # Materials — Gold & Silver
    "ABX", "AEM", "FM", "K", "WPM", "LUG", "EDV", "ELD", "OGC", "IMG",
    "OR", "G", "CG", "MAG", "DML", "NXE",
    # Materials — Base Metals & Mining
    "HBM", "LUN", "CS", "TDG", "TECK.B", "FM",
    # Utilities
    "FTS", "EMA", "H", "AQN", "NPI", "TA", "ALA", "SPB", "BLX",
    # Industrials
    "CNR", "CP", "TIH", "WCN", "CAE", "STN", "WSP", "GFL", "TFI",
    "AC", "CJT", "MDA", "NFI", "CIGI", "BYD",
    # Consumer Discretionary / Staples
    "ATD", "L", "MRU", "DOO", "GIL",
    # Real Estate (common shares only — excluding .UN trusts)
    "TCN", "FCR.UN", "GRT.UN", "DIR.UN", "CRR.UN", "SMU.UN", "BEI.UN",
    "AAR.UN", "IIP.UN", "CRT.UN",
    # Technology
    "SHOP", "CSU", "OTEX", "BB", "KXS", "LSPD", "DSG", "REAL", "MDF",
    "HUT", "BITF",
    # Healthcare
    "SIS", "WELL",
    # Telecom / Media
    "BCE", "T", "QBR.B", "RCI.B", "MBT",
    # Diversified / Conglomerates
    "BAM", "BN", "POW", "GWO", "IGM", "CIX",
    # Cannabis
    "WEED", "ACB", "CRON", "OGI",
]

# Patterns that indicate non-common shares to exclude
_EXCLUSION_PATTERNS = [
    r"\.WT$", r"\.WS$", r"\.RT$", r"\.PR\.[A-Z]$", r"\.DB$",
    r"\.[A-Z]\.DB$",
    r" ETF", r" FUND", r" WARRANT", r" RIGHT", r" PREF",
]

_EXCLUSION_RE = re.compile("|".join(_EXCLUSION_PATTERNS), re.IGNORECASE)

# Name-based exclusion keywords
_NAME_EXCLUSIONS = {
    "etf", "warrant", "debenture", "income fund",
    "exchange traded", "index fund",
}


def _should_exclude(ticker: str, name: str = "") -> bool:
    """Return True if this security should be excluded from the common-share universe."""
    if _EXCLUSION_RE.search(ticker):
        return True
    name_lower = name.lower()
    return any(kw in name_lower for kw in _NAME_EXCLUSIONS)


def _normalise_ticker(raw: str) -> str:
    """Strip trailing .TO / .TSX suffixes and return upper-case ticker."""
    t = raw.strip().upper()
    for suffix in (".TO", ".TSX", ".V", ".CN"):
        if t.endswith(suffix):
            t = t[: -len(suffix)]
    return t


# ─── FMP fetch ────────────────────────────────────────────────────────────────

def _fetch_from_fmp(api_key: str, timeout: int = 30) -> List[Dict]:
    """Download the full TSX stock list from Financial Modeling Prep."""
    url = (
        f"https://financialmodelingprep.com/api/v3/stock/list"
        f"?apikey={api_key}"
    )
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and "Error Message" in data:
        raise ValueError(data["Error Message"])

    results = []
    for item in data:
        exchange = (item.get("exchangeShortName") or item.get("exchange") or "").upper()
        if exchange not in ("TSX", "TORONTO", "TSX.V", "TSXV"):
            continue
        ticker = _normalise_ticker(item.get("symbol", ""))
        name = item.get("name") or item.get("companyName") or ""
        if not ticker or _should_exclude(ticker, name):
            continue
        results.append({"ticker": ticker, "name": name, "exchange": exchange})

    return results


def _fetch_from_fmp_exchange(api_key: str, exchange: str = "TSX", timeout: int = 30) -> List[Dict]:
    """Download stock list for a specific exchange via FMP exchange endpoint."""
    url = (
        f"https://financialmodelingprep.com/api/v3/symbol/{exchange}"
        f"?apikey={api_key}"
    )
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and "Error Message" in data:
        raise ValueError(data["Error Message"])

    results = []
    for item in data:
        ticker = _normalise_ticker(item.get("symbol", ""))
        name = item.get("name") or ""
        if not ticker or _should_exclude(ticker, name):
            continue
        results.append({"ticker": ticker, "name": name, "exchange": exchange})
    return results


# ─── Cache helpers ─────────────────────────────────────────────────────────────

def _load_cache(max_age_days: int) -> Optional[List[Dict]]:
    """Return cached ticker list if it exists and is fresh enough."""
    if not _TICKER_CACHE.exists():
        return None
    try:
        payload = json.loads(_TICKER_CACHE.read_text())
        updated = datetime.fromisoformat(payload.get("updated", "2000-01-01"))
        if datetime.utcnow() - updated > timedelta(days=max_age_days):
            return None
        return payload.get("tickers", [])
    except Exception as exc:
        logger.warning("Could not read ticker cache: %s", exc)
        return None


def _save_cache(tickers: List[Dict]) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"updated": datetime.utcnow().isoformat(), "tickers": tickers}
    _TICKER_CACHE.write_text(json.dumps(payload, indent=2))
    logger.info("Saved %d tickers to cache.", len(tickers))


# ─── Seed fallback ─────────────────────────────────────────────────────────────

def _seed_tickers() -> List[Dict]:
    """Return seed list as minimal dicts (no names, just tickers)."""
    return [{"ticker": t, "name": "", "exchange": "TSX"} for t in TSX_SEED_TICKERS]


# ─── Public API ───────────────────────────────────────────────────────────────

def get_tsx_tickers(config: AppConfig, force_refresh: bool = False) -> List[Dict]:
    """Return the list of TSX common-share tickers.

    Each entry is a dict with keys: ticker, name, exchange.

    Strategy:
    1. Return cached list if fresh.
    2. Try FMP if API key is available.
    3. Fall back to seed list.
    """
    if not force_refresh:
        cached = _load_cache(config.settings.ticker_cache_days)
        if cached:
            logger.info("Loaded %d tickers from cache.", len(cached))
            return cached

    fmp_key = config.api_keys.financialmodelingprep
    tickers: List[Dict] = []

    if fmp_key:
        logger.info("Fetching TSX ticker list from FinancialModelingPrep…")
        try:
            tickers = _fetch_from_fmp_exchange(fmp_key, "TSX")
            if not tickers:
                tickers = _fetch_from_fmp(fmp_key)
        except Exception as exc:
            logger.warning("FMP ticker fetch failed: %s — using seed list.", exc)

    if not tickers:
        logger.info("Using built-in seed ticker list (%d tickers).", len(TSX_SEED_TICKERS))
        tickers = _seed_tickers()

    # De-duplicate by ticker symbol
    seen: set = set()
    unique: List[Dict] = []
    for t in tickers:
        key = t["ticker"]
        if key not in seen:
            seen.add(key)
            unique.append(t)

    _save_cache(unique)
    return unique
