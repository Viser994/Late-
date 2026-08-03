"""Custom composite scoring and ranking engine.

The score is a peer-relative, percentile-based composite. Each company is
scored 0-100 in six categories - Value, Quality, Growth, Financial Health,
Income and Momentum - by ranking it against every other company in the scan.
The categories are then combined with configurable weights into a single score,
and the companies are ranked from best (highest) to worst.

Peer-relative scoring means a "cheap" P/E or a "high" ROE is judged against the
actual TSX universe being scanned rather than against arbitrary fixed
thresholds, which makes the score robust to sector and market-cycle effects.
"""

from __future__ import annotations

from typing import Optional

from .config import ScoringWeights
from .models import StockData

# metric -> ("high" means higher is better, "low" means lower is better)
CATEGORY_METRICS: dict[str, list[tuple[str, str]]] = {
    "value": [("pe_ratio", "low"), ("pb_ratio", "low"), ("ps_ratio", "low")],
    "quality": [("roe", "high"), ("roa", "high"), ("profit_margin", "high")],
    "growth": [("revenue_growth", "high"), ("earnings_growth", "high")],
    "health": [("debt_to_equity", "low"), ("current_ratio", "high")],
    "income": [("dividend_yield", "high")],
    # "momentum" is computed separately from the 52-week range.
}


def _percentiles(values: list[Optional[float]]) -> list[Optional[float]]:
    """Return the fractional percentile rank (0..1) for each non-None value.

    Ties receive their average rank. None values map to None.
    """
    indexed = [(i, v) for i, v in enumerate(values) if v is not None]
    result: list[Optional[float]] = [None] * len(values)
    n = len(indexed)
    if n == 0:
        return result
    if n == 1:
        result[indexed[0][0]] = 0.5
        return result

    ordered = sorted(indexed, key=lambda pair: pair[1])
    # Assign average ranks to handle ties.
    i = 0
    while i < n:
        j = i
        while j + 1 < n and ordered[j + 1][1] == ordered[i][1]:
            j += 1
        avg_rank = (i + j) / 2.0  # 0-based average rank
        pct = avg_rank / (n - 1)
        for k in range(i, j + 1):
            result[ordered[k][0]] = pct
        i = j + 1
    return result


def _metric_scores(stocks: list[StockData], field: str, direction: str) -> list[Optional[float]]:
    """Return a 0-100 score per stock for a single metric."""
    raw: list[Optional[float]] = []
    penalty_idx: set[int] = set()

    for idx, s in enumerate(stocks):
        val = getattr(s, field)
        if val is None:
            raw.append(None)
            continue
        if direction == "low":
            # Non-positive valuation/leverage ratios are not "cheap"; they are
            # meaningless or a red flag, so score them worst.
            if val <= 0:
                raw.append(None)
                penalty_idx.add(idx)
                continue
        raw.append(float(val))

    pct = _percentiles(raw)
    scores: list[Optional[float]] = []
    for idx, p in enumerate(pct):
        if idx in penalty_idx:
            scores.append(0.0)
        elif p is None:
            scores.append(None)
        else:
            scores.append((p if direction == "high" else 1.0 - p) * 100.0)
    return scores


def _momentum_scores(stocks: list[StockData]) -> list[Optional[float]]:
    """Score based on where the price sits within its 52-week range."""
    scores: list[Optional[float]] = []
    for s in stocks:
        if (
            s.price is not None
            and s.week52_high is not None
            and s.week52_low is not None
            and s.week52_high > s.week52_low
        ):
            pos = (s.price - s.week52_low) / (s.week52_high - s.week52_low)
            scores.append(max(0.0, min(1.0, pos)) * 100.0)
        else:
            scores.append(None)
    return scores


def score_stocks(stocks: list[StockData], weights: ScoringWeights) -> list[StockData]:
    """Compute composite scores + ranks in place, and return them sorted."""
    if not stocks:
        return []

    weights = weights.normalized()
    n = len(stocks)

    # Compute a 0-100 score per category for every stock.
    category_scores: dict[str, list[Optional[float]]] = {}
    for category, metrics in CATEGORY_METRICS.items():
        per_metric = [_metric_scores(stocks, field, direction) for field, direction in metrics]
        combined: list[Optional[float]] = []
        for i in range(n):
            vals = [m[i] for m in per_metric if m[i] is not None]
            combined.append(sum(vals) / len(vals) if vals else None)
        category_scores[category] = combined
    category_scores["momentum"] = _momentum_scores(stocks)

    weight_map = weights.as_dict()
    for i, stock in enumerate(stocks):
        weighted_sum = 0.0
        weight_total = 0.0
        subs: dict[str, float] = {}
        for category, scores in category_scores.items():
            val = scores[i]
            if val is None:
                continue
            subs[category] = round(val, 1)
            w = weight_map.get(category, 0.0)
            weighted_sum += val * w
            weight_total += w
        stock.subscores = subs
        stock.score = round(weighted_sum / weight_total, 2) if weight_total > 0 else None

    ranked = sorted(
        stocks,
        key=lambda s: (s.score if s.score is not None else -1.0),
        reverse=True,
    )
    for position, stock in enumerate(ranked, start=1):
        stock.rank = position if stock.score is not None else None
    return ranked
