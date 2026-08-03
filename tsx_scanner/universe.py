from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import requests

from .models import Stock


TSX_DIRECTORY_URL = "https://www.tsx.com/json/company-directory/search/tsx/^*"

EXCLUDED_SECURITY_TERMS = (
    " etf",
    "exchange traded fund",
    "warrant",
    "preferred",
    "preference",
    "debenture",
    "right",
    "subscription receipt",
    "installment receipt",
    "income fund",
    "closed end fund",
    "split share",
    "trust unit",
    "limited partnership unit",
    "note",
    "bond",
)

COMMON_SECURITY_TERMS = (
    "common",
    "common share",
    "common stock",
    "ordinary",
    "subordinate voting",
    "variable voting",
    "restricted voting",
    "class a",
    "class b",
)


class UniverseError(RuntimeError):
    pass


def yahoo_symbol_for_tsx(symbol: str) -> str:
    return symbol.strip().replace(".", "-") + ".TO"


def _clean_name(name: str) -> str:
    cleaned = re.sub(r"\b(common shares?|common stock)\b", "", name, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip(" -")


def _looks_like_common_share(record: dict) -> bool:
    security_type = str(
        record.get("instrumentType")
        or record.get("securityType")
        or record.get("type")
        or record.get("category")
        or ""
    ).lower()
    if security_type:
        return any(term in security_type for term in COMMON_SECURITY_TERMS)

    scalar_values = [
        str(value).lower()
        for value in record.values()
        if value is not None and not isinstance(value, (dict, list, tuple))
    ]
    text = " ".join(scalar_values)
    if any(term in f" {text}" for term in EXCLUDED_SECURITY_TERMS):
        return False

    # The TSX endpoint can omit an explicit instrument type; retain ambiguous
    # listed equities unless a non-common term is present.
    return True


def _iter_instruments(results: Iterable[dict]) -> Iterable[Stock]:
    seen: set[str] = set()
    for company in results:
        company_name = str(company.get("name") or company.get("issuerName") or "").strip()
        instruments = company.get("instruments") or [company]
        for instrument in instruments:
            merged = {**company, **instrument}
            if not _looks_like_common_share(merged):
                continue
            raw_symbol = str(instrument.get("symbol") or company.get("symbol") or "").strip()
            if not raw_symbol:
                continue
            symbol = raw_symbol.upper().removesuffix(".TO")
            if symbol in seen:
                continue
            seen.add(symbol)
            name = (
                str(instrument.get("name") or instrument.get("securityName") or company_name or symbol)
                .strip()
            )
            yield Stock(symbol=symbol, yahoo_symbol=yahoo_symbol_for_tsx(symbol), name=_clean_name(name))


def fetch_tsx_universe(timeout: float = 20.0) -> list[Stock]:
    response = requests.get(TSX_DIRECTORY_URL, timeout=timeout)
    response.raise_for_status()
    payload = response.json()
    results = payload.get("results")
    if not isinstance(results, list):
        raise UniverseError("TSX directory response did not include a results list.")
    stocks = sorted(_iter_instruments(results), key=lambda item: item.symbol)
    if not stocks:
        raise UniverseError("TSX directory returned no common-share symbols.")
    return stocks


def save_universe(stocks: list[Stock], cache_path: Path) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": TSX_DIRECTORY_URL,
        "count": len(stocks),
        "stocks": [stock.__dict__ for stock in stocks],
    }
    cache_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def load_universe(cache_path: Path) -> list[Stock]:
    if not cache_path.exists():
        return []
    payload = json.loads(cache_path.read_text(encoding="utf-8"))
    return [Stock(**item) for item in payload.get("stocks", [])]


def update_universe(cache_path: Path, timeout: float = 20.0) -> list[Stock]:
    stocks = fetch_tsx_universe(timeout=timeout)
    save_universe(stocks, cache_path)
    return stocks


def get_universe(cache_path: Path, timeout: float = 20.0, refresh: bool = False) -> list[Stock]:
    if refresh:
        return update_universe(cache_path, timeout=timeout)

    cached = load_universe(cache_path)
    if cached:
        return cached

    return update_universe(cache_path, timeout=timeout)
