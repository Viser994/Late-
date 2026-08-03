from __future__ import annotations

from .models import ScoredStock, StockMetrics


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _positive(value: float | None, neutral: float = 50.0, scale: float = 100.0) -> float:
    if value is None:
        return neutral
    return _clamp(value * scale)


def _lower_is_better(value: float | None, excellent: float, poor: float, neutral: float = 50.0) -> float:
    if value is None or value <= 0:
        return neutral
    if value <= excellent:
        return 100.0
    if value >= poor:
        return 0.0
    return _clamp(100.0 * (poor - value) / (poor - excellent))


def _higher_is_better(value: float | None, excellent: float, poor: float, neutral: float = 50.0) -> float:
    if value is None:
        return neutral
    if value >= excellent:
        return 100.0
    if value <= poor:
        return 0.0
    return _clamp(100.0 * (value - poor) / (excellent - poor))


def score_metrics(metrics: StockMetrics, rank: int = 0) -> ScoredStock:
    pe = metrics.forward_pe or metrics.pe_ratio
    pe_score = _lower_is_better(pe, excellent=8, poor=35)
    pb_score = _lower_is_better(metrics.price_to_book, excellent=1, poor=6)
    valuation = 0.7 * pe_score + 0.3 * pb_score

    roe_score = _higher_is_better(metrics.return_on_equity, excellent=0.20, poor=0.0)
    margin_score = _higher_is_better(metrics.profit_margin, excellent=0.20, poor=0.0)
    debt_score = _lower_is_better(metrics.debt_to_equity, excellent=0.5, poor=2.5)
    quality = 0.4 * roe_score + 0.35 * margin_score + 0.25 * debt_score

    growth = _higher_is_better(metrics.revenue_growth, excellent=0.20, poor=-0.05)
    income = _positive(metrics.dividend_yield, neutral=35.0, scale=1600.0)
    beta_score = _lower_is_better(metrics.beta, excellent=0.7, poor=2.0)
    momentum_score = _higher_is_better(metrics.fifty_two_week_change, excellent=0.25, poor=-0.25)
    liquidity_score = _higher_is_better(metrics.volume, excellent=1_000_000, poor=10_000)
    market = 0.45 * beta_score + 0.35 * momentum_score + 0.20 * liquidity_score

    total = (
        0.30 * valuation
        + 0.30 * quality
        + 0.18 * growth
        + 0.12 * income
        + 0.10 * market
    )
    if metrics.price is None or metrics.error:
        total *= 0.25

    return ScoredStock(
        rank=rank,
        score=round(_clamp(total), 4),
        valuation_score=valuation,
        quality_score=quality,
        growth_score=growth,
        income_score=income,
        market_score=market,
        metrics=metrics,
    )


def rank_stocks(metrics: list[StockMetrics]) -> list[ScoredStock]:
    scored = [score_metrics(item) for item in metrics]
    scored.sort(key=lambda item: item.score, reverse=True)
    for index, item in enumerate(scored, start=1):
        item.rank = index
    return scored
