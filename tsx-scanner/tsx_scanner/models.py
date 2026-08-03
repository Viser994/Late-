"""Data models shared across the application."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Optional


@dataclass
class Ticker:
    """A single security in the investable universe."""

    symbol: str                 # TMX-native symbol, e.g. "RY" or "BMO.PR.A"
    name: str = ""
    exchange: str = "TSX"       # "TSX" or "TSXV"
    security_type: str = "Common Stock"

    def yahoo_symbol(self) -> str:
        """Return the Yahoo Finance representation of this symbol.

        TMX uses dots for share classes (e.g. ``BBD.B``) while Yahoo uses a
        dash (``BBD-B.TO``). TSX tickers get the ``.TO`` suffix and TSX Venture
        tickers get ``.V``.
        """
        base = self.symbol.replace(".", "-")
        suffix = ".V" if self.exchange.upper() == "TSXV" else ".TO"
        return f"{base}{suffix}"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Ticker":
        return cls(
            symbol=data["symbol"],
            name=data.get("name", ""),
            exchange=data.get("exchange", "TSX"),
            security_type=data.get("security_type", "Common Stock"),
        )


@dataclass
class StockData:
    """Fundamental + market data collected for one company.

    Every numeric field is optional: providers rarely return a complete set, so
    the scoring engine is written to tolerate missing values.
    """

    ticker: str
    name: str = ""
    exchange: str = "TSX"

    # Market data
    price: Optional[float] = None
    currency: str = "CAD"
    market_cap: Optional[float] = None
    beta: Optional[float] = None
    week52_high: Optional[float] = None
    week52_low: Optional[float] = None
    volume: Optional[float] = None
    avg_volume: Optional[float] = None

    # Valuation
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    peg_ratio: Optional[float] = None

    # Profitability / quality
    roe: Optional[float] = None
    roa: Optional[float] = None
    profit_margin: Optional[float] = None
    operating_margin: Optional[float] = None

    # Financial health
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    free_cash_flow: Optional[float] = None

    # Growth
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None

    # Income
    dividend_yield: Optional[float] = None
    payout_ratio: Optional[float] = None

    # Classification / provenance
    sector: str = ""
    industry: str = ""
    source: str = ""            # provider that supplied the data
    errors: list[str] = field(default_factory=list)

    # Scoring outputs (filled in by scoring.py)
    score: Optional[float] = None
    rank: Optional[int] = None
    subscores: dict[str, float] = field(default_factory=dict)

    def has_core_data(self) -> bool:
        """True when there is enough data to be worth scoring/displaying."""
        return self.price is not None and (
            self.market_cap is not None or self.pe_ratio is not None
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
