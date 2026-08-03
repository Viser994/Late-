import unittest

from tsx_scanner.models import StockMetrics
from tsx_scanner.scoring import rank_stocks, score_metrics


class ScoringTests(unittest.TestCase):
    def test_profitable_low_valuation_stock_scores_higher_than_error_row(self):
        strong = StockMetrics(
            symbol="AAA",
            name="AAA Corp",
            price=10,
            pe_ratio=8,
            price_to_book=1.1,
            revenue_growth=0.12,
            profit_margin=0.18,
            return_on_equity=0.22,
            debt_to_equity=0.3,
            dividend_yield=0.03,
            beta=0.8,
            volume=1_500_000,
        )
        missing = StockMetrics(symbol="BBB", name="BBB Corp", error="No data")

        ranked = rank_stocks([missing, strong])

        self.assertEqual(ranked[0].metrics.symbol, "AAA")
        self.assertGreater(ranked[0].score, ranked[1].score)

    def test_score_is_bounded(self):
        metrics = StockMetrics(
            symbol="AAA",
            name="AAA Corp",
            price=1,
            pe_ratio=-20,
            revenue_growth=2,
            profit_margin=2,
            return_on_equity=2,
            debt_to_equity=-1,
            dividend_yield=1,
        )

        scored = score_metrics(metrics)

        self.assertGreaterEqual(scored.score, 0)
        self.assertLessEqual(scored.score, 100)


if __name__ == "__main__":
    unittest.main()
