import unittest

from tsx_scanner.universe import _iter_instruments, yahoo_symbol_for_tsx


class UniverseTests(unittest.TestCase):
    def test_filters_non_common_instruments(self):
        payload = [
            {
                "name": "Example Inc.",
                "instruments": [
                    {"symbol": "EXA", "name": "Example Inc. Common Shares", "instrumentType": "Common Shares"},
                    {"symbol": "EXA.PR.A", "name": "Example Preferred Shares", "instrumentType": "Preferred Shares"},
                    {"symbol": "EXA.WT", "name": "Example Warrants", "instrumentType": "Warrants"},
                ],
            }
        ]

        stocks = list(_iter_instruments(payload))

        self.assertEqual([stock.symbol for stock in stocks], ["EXA"])

    def test_yahoo_symbol_replaces_tsx_dot_classes(self):
        self.assertEqual(yahoo_symbol_for_tsx("ABC.A"), "ABC-A.TO")


if __name__ == "__main__":
    unittest.main()
