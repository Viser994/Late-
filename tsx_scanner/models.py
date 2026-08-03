from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class Stock:
    """A listed TSX common share."""

    symbol: str
    yahoo_symbol: str
    name: str
    exchange: str = "TSX"


@dataclass
class StockMetrics:
    symbol: str
    name: str
    price: float | None = None
    market_cap: float | None = None
    volume: float | None = None
    pe_ratio: float | None = None
    forward_pe: float | None = None
    price_to_book: float | None = None
    eps: float | None = None
    revenue_growth: float | None = None
    profit_margin: float | None = None
    return_on_equity: float | None = None
    debt_to_equity: float | None = None
    dividend_yield: float | None = None
    beta: float | None = None
    fifty_two_week_change: float | None = None
    sector: str | None = None
    industry: str | None = None
    provider: str | None = None
    error: str | None = None


@dataclass
class ScoredStock:
    rank: int
    score: float
    valuation_score: float
    quality_score: float
    growth_score: float
    income_score: float
    market_score: float
    metrics: StockMetrics

    def to_row(self) -> dict[str, Any]:
        row = asdict(self.metrics)
        row.update(
            {
                "rank": self.rank,
                "score": round(self.score, 2),
                "valuation_score": round(self.valuation_score, 2),
                "quality_score": round(self.quality_score, 2),
                "growth_score": round(self.growth_score, 2),
                "income_score": round(self.income_score, 2),
                "market_score": round(self.market_score, 2),
            }
        )
        return row
