from __future__ import annotations

import math
from typing import Any


def to_float(value: Any) -> float | None:
    """Convert API values to float, rejecting NaN/Inf and placeholder strings."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        num = float(value)
    elif isinstance(value, str):
        cleaned = value.strip()
        if not cleaned or cleaned.lower() in {"none", "-", "n/a", "nan", "null"}:
            return None
        if cleaned.lower() in {"inf", "infinity", "-inf", "-infinity"}:
            return None
        try:
            num = float(cleaned)
        except ValueError:
            return None
    else:
        return None

    if not math.isfinite(num):
        return None
    return num


def normalize_ratio(value: Any, as_percent: bool = False) -> float | None:
    """Normalize API ratios to decimal form (e.g. 0.05 = 5%).

    Some providers return percentages as whole numbers (2.4 = 2.4%).
    When as_percent is True, values greater than 1 are divided by 100.
    """
    num = to_float(value)
    if num is None:
        return None
    if as_percent and abs(num) > 1:
        return num / 100
    return num
