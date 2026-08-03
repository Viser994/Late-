from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

DEFAULT_CONFIG: dict[str, Any] = {
    "api_keys": {
        "financialmodelingprep": "",
        "finnhub": "",
        "alpha_vantage": "",
    },
    "scoring_weights": {
        "value": 0.25,
        "quality": 0.30,
        "growth": 0.25,
        "financial_health": 0.20,
    },
    "cache_dir": "data",
    "request_delay_seconds": 0.25,
}

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = PACKAGE_ROOT / "config.json"
EXAMPLE_CONFIG_PATH = PACKAGE_ROOT / "config.example.json"


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def load_config(config_path: Path | None = None) -> dict[str, Any]:
    path = config_path or DEFAULT_CONFIG_PATH
    if not path.exists():
        if EXAMPLE_CONFIG_PATH.exists():
            config = json.loads(EXAMPLE_CONFIG_PATH.read_text(encoding="utf-8"))
        else:
            config = deepcopy(DEFAULT_CONFIG)
        save_config(config, path)
        return config

    user_config = json.loads(path.read_text(encoding="utf-8"))
    return _deep_merge(DEFAULT_CONFIG, user_config)


def save_config(config: dict[str, Any], config_path: Path | None = None) -> Path:
    path = config_path or DEFAULT_CONFIG_PATH
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    return path


def get_cache_dir(config: dict[str, Any]) -> Path:
    cache_dir = Path(config.get("cache_dir", "data"))
    if not cache_dir.is_absolute():
        cache_dir = PACKAGE_ROOT / cache_dir
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir
