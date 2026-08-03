"""TSX Stock Scanner.

A desktop application that scans every common share listed on the Toronto Stock
Exchange, pulls fundamental and market data from several free providers (with
automatic fallback), computes a custom composite score for each company, ranks
them and shows the results in an interactive interface.
"""

__version__ = "1.0.0"
__all__ = ["__version__"]
