from __future__ import annotations

import unittest

from src.models import StockData
from src.scorer import StockScorer
from src.universe import is_common_share
from src.utils import to_float


class TestToFloat(unittest.TestCase):
    def test_valid_numbers(self) -> None:
        self.assertEqual(to_float(42), 42.0)
        self.assertEqual(to_float("3.14"), 3.14)

    def test_rejects_invalid(self) -> None:
        self.assertIsNone(to_float(None))
        self.assertIsNone(to_float("Infinity"))
        self.assertIsNone(to_float("N/A"))
        self.assertIsNone(to_float(float("inf")))


class TestStockScorer(unittest.TestCase):
    def test_scores_without_crashing_on_string_values(self) -> None:
        stocks = [
            StockData(ticker="A", company_name="A Co", pe_ratio="Infinity", current_price=10.0),
            StockData(ticker="B", company_name="B Co", pe_ratio=15.0, current_price=20.0),
            StockData(ticker="C", company_name="C Co", pe_ratio=20.0, current_price=30.0),
        ]
        ranked = StockScorer().score(stocks)
        self.assertEqual(len(ranked), 3)
        self.assertIsNotNone(ranked[0].score)
        self.assertEqual(ranked[0].rank, 1)

    def test_ranks_higher_scores_first(self) -> None:
        stocks = [
            StockData(ticker="LOW", roe=0.05, profit_margin=0.02, current_price=1.0),
            StockData(ticker="HIGH", roe=0.30, profit_margin=0.25, current_price=1.0),
        ]
        ranked = StockScorer().score(stocks)
        self.assertEqual(ranked[0].ticker, "HIGH")


class TestUniverseFilter(unittest.TestCase):
    def test_common_shares(self) -> None:
        self.assertTrue(is_common_share("RY", "Royal Bank"))
        self.assertTrue(is_common_share("SHOP", "Shopify Inc"))

    def test_excludes_etfs_and_instruments(self) -> None:
        self.assertFalse(is_common_share("XIU", "iShares S&P/TSX 60 Index ETF"))
        self.assertFalse(is_common_share("RY.PR.A", "Royal Bank Preferred"))
        self.assertFalse(is_common_share("ABC.WT", "ABC Warrant"))
        self.assertFalse(is_common_share("XYZ.DB", "XYZ Debenture"))


if __name__ == "__main__":
    unittest.main()
