"""Multi-factor composite scoring for TSX stocks.

Each factor is ranked percentile-style (0–100) across the full universe so that
absolute values don't matter — only relative ranking.  Higher = better.

Factors
-------
Value  (25%) : low P/E, low P/B, low EV/EBITDA → cheap is better
Quality(25%) : high ROE, high gross margin, low debt/equity, high current ratio
Growth (25%) : revenue growth YoY, earnings growth YoY
Momentum(15%): 1-month and 3-month price return
Dividend(10%): dividend yield
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

import numpy as np
import pandas as pd

from .fetcher import StockData
from .config import ScoringWeights

logger = logging.getLogger(__name__)


# ─── Scored result ────────────────────────────────────────────────────────────

@dataclass
class ScoredStock:
    data: StockData
    score_total: float = 0.0
    score_value: float = 0.0
    score_quality: float = 0.0
    score_growth: float = 0.0
    score_momentum: float = 0.0
    score_dividend: float = 0.0
    rank: int = 0
    data_quality: int = 0   # 0–100 % of key fields present


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _percentile_rank(series: pd.Series) -> pd.Series:
    """Return percentile rank (0–100) for each element; NaN stays NaN."""
    return series.rank(pct=True, na_option="keep") * 100


def _inverse_percentile_rank(series: pd.Series) -> pd.Series:
    """Lower raw value → higher rank (for metrics where smaller = better)."""
    return _percentile_rank(-series)


def _fill_na_median(series: pd.Series) -> pd.Series:
    """Fill NaN with median for scoring purposes only."""
    median = series.median()
    return series.fillna(median if not np.isnan(median) else 50.0)


def _clamp(series: pd.Series, lo: float = 0.0, hi: float = 100.0) -> pd.Series:
    return series.clip(lower=lo, upper=hi)


def _data_quality(stock: StockData) -> int:
    key_fields = [
        "price", "pe_ratio", "pb_ratio", "roe", "gross_margin",
        "revenue_growth", "return_3m", "dividend_yield", "debt_to_equity",
        "market_cap",
    ]
    present = sum(1 for f in key_fields if getattr(stock, f) is not None)
    return round(present / len(key_fields) * 100)


# ─── Factor builders ──────────────────────────────────────────────────────────

def _value_score(df: pd.DataFrame) -> pd.Series:
    """Value score: cheap P/E, P/B, EV/EBITDA → high score."""
    components = []

    for col in ["pe_ratio", "pb_ratio", "ps_ratio"]:
        if col in df.columns:
            # Cap extreme multiples (> 200) to avoid distortion
            trimmed = df[col].clip(upper=200).replace(0, np.nan)
            trimmed = trimmed[trimmed > 0]  # ignore negative ratios
            rank = _inverse_percentile_rank(trimmed)
            components.append(rank)

    if "ev_ebitda" in df.columns:
        trimmed = df["ev_ebitda"].clip(0, 100).replace(0, np.nan)
        components.append(_inverse_percentile_rank(trimmed))

    if not components:
        return pd.Series(50.0, index=df.index)

    combined = pd.concat(components, axis=1).mean(axis=1)
    return _fill_na_median(combined)


def _quality_score(df: pd.DataFrame) -> pd.Series:
    """Quality score: high ROE/margins, low D/E, high current ratio."""
    components = []

    for col in ["roe", "gross_margin", "operating_margin", "net_margin", "roa"]:
        if col in df.columns:
            components.append(_percentile_rank(df[col]))

    if "debt_to_equity" in df.columns:
        # Lower D/E is better
        capped = df["debt_to_equity"].clip(0, 20)
        components.append(_inverse_percentile_rank(capped))

    if "current_ratio" in df.columns:
        # Higher current ratio is better up to ~4x (beyond that is idle cash)
        capped = df["current_ratio"].clip(0, 6)
        components.append(_percentile_rank(capped))

    if not components:
        return pd.Series(50.0, index=df.index)

    combined = pd.concat(components, axis=1).mean(axis=1)
    return _fill_na_median(combined)


def _growth_score(df: pd.DataFrame) -> pd.Series:
    """Growth score: higher revenue and earnings growth → better."""
    components = []

    for col in ["revenue_growth", "earnings_growth"]:
        if col in df.columns:
            # Cap extreme growth numbers
            capped = df[col].clip(-200, 500)
            components.append(_percentile_rank(capped))

    if not components:
        return pd.Series(50.0, index=df.index)

    combined = pd.concat(components, axis=1).mean(axis=1)
    return _fill_na_median(combined)


def _momentum_score(df: pd.DataFrame) -> pd.Series:
    """Momentum score: recent price returns."""
    components = []

    # Weight: 1M = 40%, 3M = 40%, 6M = 20%
    weights = {"return_1m": 0.4, "return_3m": 0.4, "return_6m": 0.2}
    total_weight = 0.0

    for col, w in weights.items():
        if col in df.columns and df[col].notna().sum() > 5:
            components.append(_percentile_rank(df[col]) * w)
            total_weight += w

    if not components or total_weight == 0:
        return pd.Series(50.0, index=df.index)

    combined = sum(components) / total_weight
    return _fill_na_median(combined)


def _dividend_score(df: pd.DataFrame) -> pd.Series:
    """Dividend score: higher yield is better (but excessive yield can signal trouble)."""
    if "dividend_yield" not in df.columns:
        return pd.Series(50.0, index=df.index)

    # Cap at 20% yield; anything above is likely a yield trap
    capped = df["dividend_yield"].clip(0, 20)
    result = _percentile_rank(capped)
    # Stocks with no dividend get the 50th percentile (neutral)
    result = result.fillna(50.0)
    return result


# ─── Main scorer ──────────────────────────────────────────────────────────────

def score_universe(
    stocks: List[StockData],
    weights: ScoringWeights,
) -> List[ScoredStock]:
    """Score and rank all stocks in the universe.

    Stocks with no price data are excluded from ranking but still returned
    (with score = 0) so the user can see data gaps.
    """
    # Only score stocks that have at least a price
    valid = [s for s in stocks if s.price is not None and s.price > 0]
    invalid = [s for s in stocks if s not in valid]

    if not valid:
        logger.warning("No valid stock data to score.")
        return [ScoredStock(data=s) for s in stocks]

    df = pd.DataFrame([v.to_dict() for v in valid])
    df.index = range(len(df))

    # Compute factor scores (all 0–100 range)
    value_s = _clamp(_value_score(df))
    quality_s = _clamp(_quality_score(df))
    growth_s = _clamp(_growth_score(df))
    momentum_s = _clamp(_momentum_score(df))
    dividend_s = _clamp(_dividend_score(df))

    composite = (
        weights.value * value_s
        + weights.quality * quality_s
        + weights.growth * growth_s
        + weights.momentum * momentum_s
        + weights.dividend * dividend_s
    )

    scored: List[ScoredStock] = []
    for i, stock in enumerate(valid):
        dq = _data_quality(stock)
        scored.append(
            ScoredStock(
                data=stock,
                score_total=round(float(composite.iloc[i]), 1),
                score_value=round(float(value_s.iloc[i]), 1),
                score_quality=round(float(quality_s.iloc[i]), 1),
                score_growth=round(float(growth_s.iloc[i]), 1),
                score_momentum=round(float(momentum_s.iloc[i]), 1),
                score_dividend=round(float(dividend_s.iloc[i]), 1),
                data_quality=dq,
            )
        )

    # Sort by composite score descending, assign ranks
    scored.sort(key=lambda x: x.score_total, reverse=True)
    for rank_idx, sc in enumerate(scored, start=1):
        sc.rank = rank_idx

    # Append invalid stocks at the bottom with rank beyond valid set
    bottom_rank = len(scored) + 1
    for stock in invalid:
        scored.append(ScoredStock(data=stock, rank=bottom_rank))
        bottom_rank += 1

    return scored
