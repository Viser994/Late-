"""Tests for the scoring / ranking engine."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tsx_scanner.config import ScoringWeights
from tsx_scanner.models import StockData
from tsx_scanner.scoring import _percentiles, score_stocks


def test_percentiles_basic():
    pct = _percentiles([10.0, 20.0, 30.0])
    assert pct == [0.0, 0.5, 1.0]


def test_percentiles_handle_none_and_ties():
    pct = _percentiles([5.0, None, 5.0, 15.0])
    assert pct[1] is None
    # The two tied 5.0 values share the average rank (0.5 of 0 and 1 -> 0.25).
    assert abs(pct[0] - 0.25) < 1e-9
    assert abs(pct[2] - 0.25) < 1e-9
    assert abs(pct[3] - 1.0) < 1e-9


def _mk(ticker, **kw):
    return StockData(ticker=ticker, name=ticker, price=kw.pop("price", 10.0), **kw)


def test_higher_quality_scores_higher():
    stocks = [
        _mk("GOOD", market_cap=1e9, roe=30, roa=15, profit_margin=25,
            pe_ratio=10, pb_ratio=1, ps_ratio=1, debt_to_equity=0.2,
            current_ratio=3, revenue_growth=20, earnings_growth=20,
            dividend_yield=4, week52_low=5, week52_high=12),
        _mk("BAD", market_cap=1e9, roe=1, roa=0.5, profit_margin=1,
            pe_ratio=90, pb_ratio=9, ps_ratio=9, debt_to_equity=4,
            current_ratio=0.5, revenue_growth=-10, earnings_growth=-20,
            dividend_yield=0.1, week52_low=5, week52_high=12, price=6),
    ]
    ranked = score_stocks(stocks, ScoringWeights())
    assert ranked[0].ticker == "GOOD"
    assert ranked[0].rank == 1
    assert ranked[1].ticker == "BAD"
    assert ranked[0].score > ranked[1].score


def test_negative_pe_penalised_in_value():
    stocks = [
        _mk("PROFIT", pe_ratio=15, pb_ratio=2, ps_ratio=2),
        _mk("LOSS", pe_ratio=-5, pb_ratio=2, ps_ratio=2),
    ]
    score_stocks(stocks, ScoringWeights())
    by = {s.ticker: s for s in stocks}
    assert by["PROFIT"].subscores["value"] > by["LOSS"].subscores["value"]


def test_missing_categories_do_not_zero_company():
    # Only income data available -> should still produce a score.
    stocks = [
        _mk("ONLYDIV", dividend_yield=5),
        _mk("ONLYDIV2", dividend_yield=2),
    ]
    ranked = score_stocks(stocks, ScoringWeights())
    assert all(s.score is not None for s in ranked)
    assert ranked[0].ticker == "ONLYDIV"


def test_empty_input():
    assert score_stocks([], ScoringWeights()) == []
