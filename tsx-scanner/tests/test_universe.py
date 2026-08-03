"""Tests for common-share filtering and universe helpers."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tsx_scanner.models import Ticker
from tsx_scanner.universe import filter_common_shares, is_common_share


def test_accepts_plain_common_shares():
    assert is_common_share("RY", "Royal Bank of Canada", "Common Stock")
    assert is_common_share("SHOP", "Shopify Inc.", "")
    assert is_common_share("ENB", "Enbridge Inc.", "EQUITY")


def test_accepts_share_classes():
    # A trailing single letter is a share class, still a common share.
    assert is_common_share("BBD.B", "Bombardier Inc.", "Common Stock")
    assert is_common_share("GIB.A", "CGI Inc.", "")
    assert is_common_share("TECK.B", "Teck Resources Limited", "")


def test_rejects_preferred_by_suffix():
    assert not is_common_share("BMO.PR.A", "Bank of Montreal Pref A", "")
    assert not is_common_share("ENB.PF.K", "Enbridge Pref", "")


def test_rejects_warrants_rights_units_debentures():
    assert not is_common_share("XYZ.WT", "Some Co Warrants", "")
    assert not is_common_share("XYZ.RT", "Some Co Rights", "")
    assert not is_common_share("BIP.UN", "Brookfield Infra Units", "")
    assert not is_common_share("ABC.DB", "Some Debenture", "")


def test_rejects_by_type():
    assert not is_common_share("ZSP", "BMO S&P 500 Index ETF", "ETF")
    assert not is_common_share("XIU", "iShares S&P/TSX 60 Index ETF", "ETF")
    assert not is_common_share("FOO", "Some Preferred", "Preferred Stock")


def test_rejects_by_name_keywords():
    assert not is_common_share("FOO", "Big Split Corp Class A", "")
    assert not is_common_share("BAR", "Some Income Fund", "")
    assert not is_common_share("BAZ", "Vanguard Total ETF", "")


def test_filter_dedupes_and_filters():
    tickers = [
        Ticker("RY", "Royal Bank", "TSX", "Common Stock"),
        Ticker("RY", "Royal Bank dup", "TSX", "Common Stock"),
        Ticker("XIU", "iShares TSX 60 ETF", "TSX", "ETF"),
        Ticker("BMO.PR.A", "BMO Pref", "TSX", ""),
        Ticker("SHOP", "Shopify", "TSX", "Common Stock"),
    ]
    out = filter_common_shares(tickers)
    symbols = [t.symbol for t in out]
    assert symbols == ["RY", "SHOP"]


def test_yahoo_symbol_mapping():
    assert Ticker("RY").yahoo_symbol() == "RY.TO"
    assert Ticker("BBD.B").yahoo_symbol() == "BBD-B.TO"
    assert Ticker("ABC", exchange="TSXV").yahoo_symbol() == "ABC.V"
