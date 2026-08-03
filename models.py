"""Data models used across the scanner."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class StockListing:
    symbol: str
    name: str
    exchange: str
    type: str = ""


@dataclass(slots=True)
class StockSnapshot:
    symbol: str
    company_name: str = ""
    price: float | None = None
    market_cap: float | None = None
    pe_ratio: float | None = None
    pb_ratio: float | None = None
    roe: float | None = None
    profit_margin: float | None = None
    debt_to_equity: float | None = None
    revenue_growth: float | None = None
    year_high: float | None = None
    year_low: float | None = None
    source: str = ""
    score: float = 0.0
    score_breakdown: dict[str, float] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def to_row(self) -> dict[str, Any]:
        return {
            "symbol": self.symbol,
            "company_name": self.company_name,
            "price": self.price,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "pb_ratio": self.pb_ratio,
            "roe": self.roe,
            "profit_margin": self.profit_margin,
            "debt_to_equity": self.debt_to_equity,
            "revenue_growth": self.revenue_growth,
            "year_high": self.year_high,
            "year_low": self.year_low,
            "source": self.source,
            "score": self.score,
            "score_breakdown": self.score_breakdown,
            "errors": self.errors,
        }
