"""Configuration helpers for the TSX stock scanner app."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATH = Path("config.json")
DEFAULT_DATA_DIR = Path("data")
DEFAULT_UNIVERSE_PATH = DEFAULT_DATA_DIR / "tsx_universe.json"


@dataclass(slots=True)
class AppConfig:
    fmp_api_key: str = ""
    finnhub_api_key: str = ""
    alpha_vantage_api_key: str = ""
    request_timeout_seconds: int = 12
    max_workers: int = 8
    max_symbols: int = 0  # 0 means scan all symbols
    universe_path: str = str(DEFAULT_UNIVERSE_PATH)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "AppConfig":
        return cls(
            fmp_api_key=str(payload.get("fmp_api_key", "")).strip(),
            finnhub_api_key=str(payload.get("finnhub_api_key", "")).strip(),
            alpha_vantage_api_key=str(payload.get("alpha_vantage_api_key", "")).strip(),
            request_timeout_seconds=max(int(payload.get("request_timeout_seconds", 12)), 4),
            max_workers=max(int(payload.get("max_workers", 8)), 1),
            max_symbols=max(int(payload.get("max_symbols", 0)), 0),
            universe_path=str(payload.get("universe_path", DEFAULT_UNIVERSE_PATH)),
        )


def load_config(path: Path | str = DEFAULT_CONFIG_PATH) -> AppConfig:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(
            f"Config file not found at '{config_path}'. Copy config.example.json to config.json."
        )
    with config_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return AppConfig.from_dict(payload)
