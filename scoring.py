"""Custom stock scoring logic."""

from __future__ import annotations

from models import StockSnapshot

WEIGHTS = {
    "value_pe": 0.18,
    "value_pb": 0.12,
    "quality_roe": 0.18,
    "quality_margin": 0.12,
    "growth_revenue": 0.16,
    "balance_sheet": 0.12,
    "momentum_52w": 0.12,
}


def _clamp01(value: float) -> float:
    return max(0.0, min(value, 1.0))


def _score_low_is_good(value: float | None, floor: float, ceiling: float) -> float:
    if value is None:
        return 0.45
    normalized = (ceiling - value) / (ceiling - floor)
    return _clamp01(normalized)


def _score_high_is_good(value: float | None, floor: float, ceiling: float) -> float:
    if value is None:
        return 0.45
    normalized = (value - floor) / (ceiling - floor)
    return _clamp01(normalized)


def score_snapshot(snapshot: StockSnapshot) -> StockSnapshot:
    momentum_ratio: float | None = None
    if snapshot.price and snapshot.year_high and snapshot.year_high > 0:
        momentum_ratio = snapshot.price / snapshot.year_high

    components = {
        "value_pe": _score_low_is_good(snapshot.pe_ratio, floor=5.0, ceiling=45.0),
        "value_pb": _score_low_is_good(snapshot.pb_ratio, floor=0.5, ceiling=8.0),
        "quality_roe": _score_high_is_good(snapshot.roe, floor=0.03, ceiling=0.35),
        "quality_margin": _score_high_is_good(snapshot.profit_margin, floor=0.02, ceiling=0.35),
        "growth_revenue": _score_high_is_good(snapshot.revenue_growth, floor=-0.10, ceiling=0.30),
        "balance_sheet": _score_low_is_good(snapshot.debt_to_equity, floor=0.0, ceiling=3.0),
        "momentum_52w": _score_high_is_good(momentum_ratio, floor=0.5, ceiling=1.0),
    }
    weighted = sum(WEIGHTS[name] * value for name, value in components.items())
    snapshot.score_breakdown = components
    snapshot.score = round(weighted * 100.0, 2)
    return snapshot
