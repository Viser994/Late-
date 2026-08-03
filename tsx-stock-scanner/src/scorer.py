from __future__ import annotations

import logging
import statistics
from typing import Iterable

from src.models import StockData
from src.utils import to_float

logger = logging.getLogger(__name__)


def _percentile_score(value: float | None, values: list[float], higher_is_better: bool) -> float | None:
    value = to_float(value)
    if value is None or not values:
        return None
    clean = sorted(values)
    if len(clean) == 1:
        return 50.0
    rank = sum(1 for v in clean if v <= value) / len(clean)
    score = rank * 100
    return score if higher_is_better else 100 - score


def _safe_values(stocks: Iterable[StockData], attr: str) -> list[float]:
    values: list[float] = []
    for stock in stocks:
        num = to_float(getattr(stock, attr, None))
        if num is not None:
            values.append(num)
    return values


class StockScorer:
    """Calculate composite scores across value, quality, growth, and financial health."""

    def __init__(self, weights: dict[str, float] | None = None) -> None:
        default_weights = {
            "value": 0.25,
            "quality": 0.30,
            "growth": 0.25,
            "financial_health": 0.20,
        }
        self.weights = weights or default_weights
        total = sum(self.weights.values())
        if total > 0:
            self.weights = {k: v / total for k, v in self.weights.items()}

    def score(self, stocks: list[StockData]) -> list[StockData]:
        if not stocks:
            return []

        pe_values = [v for v in _safe_values(stocks, "pe_ratio") if v > 0]
        pb_values = [v for v in _safe_values(stocks, "pb_ratio") if v > 0]
        roe_values = _safe_values(stocks, "roe")
        margin_values = _safe_values(stocks, "profit_margin")
        growth_values = _safe_values(stocks, "revenue_growth")
        debt_values = _safe_values(stocks, "debt_to_equity")
        div_values = _safe_values(stocks, "dividend_yield")

        for stock in stocks:
            value_parts = [
                _percentile_score(stock.pe_ratio, pe_values, higher_is_better=False),
                _percentile_score(stock.pb_ratio, pb_values, higher_is_better=False),
            ]
            value_score = _mean_ignore_none(value_parts)

            quality_parts = [
                _percentile_score(stock.roe, roe_values, higher_is_better=True),
                _percentile_score(stock.profit_margin, margin_values, higher_is_better=True),
            ]
            quality_score = _mean_ignore_none(quality_parts)

            growth_parts = [
                _percentile_score(stock.revenue_growth, growth_values, higher_is_better=True),
            ]
            growth_score = _mean_ignore_none(growth_parts)

            health_parts = [
                _percentile_score(stock.debt_to_equity, debt_values, higher_is_better=False),
                _percentile_score(stock.dividend_yield, div_values, higher_is_better=True),
            ]
            health_score = _mean_ignore_none(health_parts)

            breakdown = {
                "value": value_score or 0.0,
                "quality": quality_score or 0.0,
                "growth": growth_score or 0.0,
                "financial_health": health_score or 0.0,
            }

            composite = sum(breakdown[k] * self.weights.get(k, 0) for k in breakdown)
            stock.score_breakdown = {k: round(v, 2) for k, v in breakdown.items()}
            stock.score = round(composite, 2)

        ranked = sorted(stocks, key=lambda s: s.score or 0, reverse=True)
        for idx, stock in enumerate(ranked, start=1):
            stock.rank = idx
        return ranked


def _mean_ignore_none(values: list[float | None]) -> float | None:
    clean = [v for v in values if v is not None]
    if not clean:
        return None
    return statistics.mean(clean)
