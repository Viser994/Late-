from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class StockData:
    """Fundamental and market data for a single TSX company."""

    ticker: str
    company_name: str = ""
    current_price: float | None = None
    market_cap: float | None = None
    pe_ratio: float | None = None
    pb_ratio: float | None = None
    roe: float | None = None
    debt_to_equity: float | None = None
    revenue_growth: float | None = None
    dividend_yield: float | None = None
    profit_margin: float | None = None
    eps: float | None = None
    sector: str = ""
    industry: str = ""
    data_source: str = ""
    score: float | None = None
    rank: int | None = None
    score_breakdown: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rank": self.rank,
            "ticker": self.ticker,
            "company_name": self.company_name,
            "current_price": self.current_price,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "pb_ratio": self.pb_ratio,
            "roe": self.roe,
            "debt_to_equity": self.debt_to_equity,
            "revenue_growth": self.revenue_growth,
            "dividend_yield": self.dividend_yield,
            "profit_margin": self.profit_margin,
            "eps": self.eps,
            "sector": self.sector,
            "industry": self.industry,
            "score": self.score,
            "value_score": self.score_breakdown.get("value"),
            "quality_score": self.score_breakdown.get("quality"),
            "growth_score": self.score_breakdown.get("growth"),
            "health_score": self.score_breakdown.get("financial_health"),
            "data_source": self.data_source,
        }
