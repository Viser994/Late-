"""Build and maintain the TSX investable universe.

Responsibilities:
  * Discover every stock listed on the TSX (and optionally the TSX Venture
    exchange) from a listing API (Finnhub or FMP).
  * Keep only *common shares* - filter out ETFs, warrants, preferred shares,
    rights, funds, units and debentures.
  * Cache the resulting ticker list locally and refresh it on demand.
  * Fall back to a bundled seed list when no listing API key is available, so
    the application is usable out of the box.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Callable, Iterable, Optional

import requests

from . import config as cfg
from .models import Ticker

# --------------------------------------------------------------------------- #
# Common-share filtering
# --------------------------------------------------------------------------- #

# Suffixes on TMX symbols that denote something other than a common share.
# Examples: BMO.PR.A (preferred), FOO.WT (warrant), BAR.UN (trust units).
_NON_COMMON_SUFFIXES = {
    "PR", "PF", "PFD",          # preferred shares
    "WT", "WS", "WAR",          # warrants
    "RT", "RTS",                # rights
    "UN", "UNS",                # trust / fund units
    "DB", "NT", "NO", "SB",     # debentures / notes
}

# Keywords that, when present in a company/security name, indicate a non-common
# instrument. Checked case-insensitively against the whole name.
_NON_COMMON_NAME_KEYWORDS = (
    "preferred", "pfd", "pref ", " pref.", "warrant", "warrants", " right",
    "rights", "debenture", "subscription receipt", " etf", "exchange traded",
    "index fund", " trust units", "capital pool", " notes due", " note due",
    " units", "split corp", "income fund", "royalty trust",
)

# Security types from provider APIs that we accept as common shares.
_COMMON_TYPES = {
    "common stock", "common share", "common shares", "stock", "equity",
    "cs", "shares", "ordinary shares", "",  # blank -> assume common
}

# Security types we always reject regardless of anything else.
_REJECT_TYPES = {
    "etf", "etp", "fund", "mutual fund", "closed-end fund", "reit",
    "preferred stock", "preferred", "warrant", "right", "unit", "units",
    "bond", "debenture", "note", "adr", "gdr", "trust",
}


def _symbol_suffix_tokens(symbol: str) -> list[str]:
    """Return the dotted suffix tokens of a TMX symbol (excluding the root)."""
    parts = symbol.upper().split(".")
    return parts[1:] if len(parts) > 1 else []


def is_common_share(symbol: str, name: str = "", security_type: str = "") -> bool:
    """Heuristically decide whether a listing is a plain common share."""
    if not symbol:
        return False

    stype = (security_type or "").strip().lower()
    if stype in _REJECT_TYPES:
        return False
    if stype and stype not in _COMMON_TYPES:
        # Unknown but explicitly-typed instrument: only accept if it clearly
        # contains the word "common".
        if "common" not in stype and "ordinary" not in stype:
            return False

    for token in _symbol_suffix_tokens(symbol):
        # A trailing single letter (e.g. BBD.B, GIB.A) is a share *class* and is
        # still a common share. Anything matching a known non-common suffix is
        # rejected.
        if token in _NON_COMMON_SUFFIXES:
            return False

    lname = f" {name.lower()} "
    for keyword in _NON_COMMON_NAME_KEYWORDS:
        if keyword in lname:
            return False

    return True


def filter_common_shares(tickers: Iterable[Ticker]) -> list[Ticker]:
    """Keep only common shares and drop duplicates (first symbol wins)."""
    seen: set[str] = set()
    result: list[Ticker] = []
    for t in tickers:
        key = t.symbol.upper()
        if key in seen:
            continue
        if is_common_share(t.symbol, t.name, t.security_type):
            seen.add(key)
            result.append(t)
    return result


# --------------------------------------------------------------------------- #
# Listing providers
# --------------------------------------------------------------------------- #
def _fetch_from_finnhub(app: cfg.AppConfig, exchange_code: str) -> list[Ticker]:
    """Finnhub: GET /stock/symbol?exchange=TO returns every TMX listing."""
    key = app.key_for("finnhub")
    if not key:
        return []
    url = "https://finnhub.io/api/v1/stock/symbol"
    resp = requests.get(
        url,
        params={"exchange": exchange_code, "token": key},
        timeout=app.request_timeout,
    )
    resp.raise_for_status()
    rows = resp.json()
    tickers: list[Ticker] = []
    for row in rows:
        raw = row.get("symbol", "")
        # Finnhub returns Toronto symbols with a ".TO" suffix; strip it back to
        # the TMX-native symbol and restore the dotted class separator.
        native = raw.upper()
        if native.endswith(".TO"):
            native = native[:-3]
        if native.endswith(".V"):
            native = native[:-2]
        native = native.replace("-", ".")
        tickers.append(
            Ticker(
                symbol=native,
                name=row.get("description", ""),
                exchange="TSXV" if exchange_code == "V" else "TSX",
                security_type=row.get("type", ""),
            )
        )
    return tickers


def _fetch_from_fmp(app: cfg.AppConfig, exchange_short: str) -> list[Ticker]:
    """FMP: GET /stock/list then filter by exchangeShortName == 'TSX'/'TSXV'."""
    key = app.key_for("fmp")
    if not key:
        return []
    url = "https://financialmodelingprep.com/api/v3/stock/list"
    resp = requests.get(url, params={"apikey": key}, timeout=app.request_timeout)
    resp.raise_for_status()
    rows = resp.json()
    tickers: list[Ticker] = []
    for row in rows:
        if (row.get("exchangeShortName") or "").upper() != exchange_short:
            continue
        raw = (row.get("symbol") or "").upper()
        native = raw
        if native.endswith(".TO"):
            native = native[:-3]
        if native.endswith(".V"):
            native = native[:-2]
        native = native.replace("-", ".")
        tickers.append(
            Ticker(
                symbol=native,
                name=row.get("name", ""),
                exchange="TSXV" if exchange_short == "TSXV" else "TSX",
                security_type=row.get("type", "stock"),
            )
        )
    return tickers


def _load_seed() -> list[Ticker]:
    seed_path = cfg.BUNDLED_DATA_DIR / "tsx_seed.json"
    if not seed_path.is_file():
        return []
    data = json.loads(seed_path.read_text(encoding="utf-8"))
    tickers = []
    for row in data.get("tickers", []):
        tickers.append(
            Ticker(
                symbol=row["symbol"],
                name=row.get("name", ""),
                exchange=data.get("exchange", "TSX"),
                security_type="Common Stock",
            )
        )
    return tickers


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def fetch_universe(
    app: cfg.AppConfig,
    log: Optional[Callable[[str], None]] = None,
) -> list[Ticker]:
    """Discover the full TSX universe of common shares from a listing API.

    Tries Finnhub first, then FMP. Falls back to the bundled seed list if both
    are unavailable (e.g. no keys configured). Returns filtered common shares.
    """
    log = log or (lambda _msg: None)
    exchanges = [("TSX",)]
    collected: list[Ticker] = []

    # --- Finnhub ---------------------------------------------------------- #
    if app.has_key("finnhub"):
        try:
            log("Fetching TSX listings from Finnhub…")
            collected.extend(_fetch_from_finnhub(app, "TO"))
            if app.include_tsxv:
                collected.extend(_fetch_from_finnhub(app, "V"))
        except Exception as exc:  # noqa: BLE001 - fall through to next source
            log(f"Finnhub listing failed: {exc}")

    # --- FMP -------------------------------------------------------------- #
    if not collected and app.has_key("fmp"):
        try:
            log("Fetching TSX listings from FinancialModelingPrep…")
            collected.extend(_fetch_from_fmp(app, "TSX"))
            if app.include_tsxv:
                collected.extend(_fetch_from_fmp(app, "TSXV"))
        except Exception as exc:  # noqa: BLE001
            log(f"FMP listing failed: {exc}")

    # --- Seed fallback ---------------------------------------------------- #
    if not collected:
        log("No listing API available - using bundled seed universe.")
        collected = _load_seed()

    common = filter_common_shares(collected)
    log(f"Universe: {len(common)} common shares (from {len(collected)} listings).")
    return common


def save_universe(tickers: list[Ticker], path: Path | None = None) -> Path:
    path = path or cfg.UNIVERSE_CACHE
    cfg.ensure_data_dir()
    payload = {
        "updated": time.time(),
        "count": len(tickers),
        "tickers": [t.to_dict() for t in tickers],
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def load_universe(path: Path | None = None) -> tuple[list[Ticker], float]:
    """Return (tickers, updated_epoch). Empty list if no cache exists."""
    path = path or cfg.UNIVERSE_CACHE
    if not path.is_file():
        return [], 0.0
    data = json.loads(path.read_text(encoding="utf-8"))
    tickers = [Ticker.from_dict(row) for row in data.get("tickers", [])]
    return tickers, float(data.get("updated", 0.0))


def get_universe(
    app: cfg.AppConfig,
    force_refresh: bool = False,
    log: Optional[Callable[[str], None]] = None,
) -> list[Ticker]:
    """Return the universe, using the local cache when it is still fresh."""
    log = log or (lambda _msg: None)
    if not force_refresh:
        tickers, updated = load_universe()
        age_hours = (time.time() - updated) / 3600 if updated else float("inf")
        if tickers and age_hours <= app.cache_ttl_hours:
            log(f"Loaded {len(tickers)} tickers from cache ({age_hours:.1f}h old).")
            return tickers

    tickers = fetch_universe(app, log=log)
    if tickers:
        save_universe(tickers)
    return tickers
