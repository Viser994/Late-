"""Configuration management for TSX Screener."""

import configparser
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


CONFIG_FILENAME = "config.ini"


def _find_config_path() -> Path:
    """Search upward from cwd for config.ini, then fall back to the module directory."""
    search = Path.cwd()
    for _ in range(5):
        candidate = search / CONFIG_FILENAME
        if candidate.exists():
            return candidate
        parent = search.parent
        if parent == search:
            break
        search = parent
    # Fall back: same directory as this file's package root
    pkg_root = Path(__file__).parent.parent
    return pkg_root / CONFIG_FILENAME


@dataclass
class ApiKeys:
    financialmodelingprep: str = ""
    finnhub: str = ""
    alpha_vantage: str = ""


@dataclass
class Settings:
    data_cache_days: int = 1
    ticker_cache_days: int = 7
    max_workers: int = 8
    min_market_cap_millions: float = 0.0
    results_per_page: int = 50


@dataclass
class ScoringWeights:
    value: float = 0.25
    quality: float = 0.25
    growth: float = 0.25
    momentum: float = 0.15
    dividend: float = 0.10

    def validate(self) -> None:
        total = self.value + self.quality + self.growth + self.momentum + self.dividend
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total:.3f}. "
                "Check the [scoring_weights] section in config.ini."
            )


@dataclass
class AppConfig:
    api_keys: ApiKeys = field(default_factory=ApiKeys)
    settings: Settings = field(default_factory=Settings)
    weights: ScoringWeights = field(default_factory=ScoringWeights)
    config_path: Optional[Path] = None


def load_config(config_path: Optional[Path] = None) -> AppConfig:
    """Load configuration from config.ini.

    Priority: explicit path > auto-detected path > defaults.
    """
    path = config_path or _find_config_path()
    parser = configparser.ConfigParser()

    if path.exists():
        parser.read(str(path))
    else:
        # No config file found; use all defaults and warn
        import warnings
        warnings.warn(
            f"No config.ini found at {path}. "
            "Using defaults. Create a config.ini to set API keys."
        )

    def _get(section: str, key: str, fallback: str = "") -> str:
        try:
            return parser.get(section, key, fallback=fallback).strip()
        except (configparser.NoSectionError, configparser.NoOptionError):
            return fallback

    def _getint(section: str, key: str, fallback: int) -> int:
        try:
            return parser.getint(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError):
            return fallback

    def _getfloat(section: str, key: str, fallback: float) -> float:
        try:
            return parser.getfloat(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError):
            return fallback

    # Override with environment variables (useful for CI / Docker)
    fmp_key = os.environ.get("FMP_API_KEY", _get("api_keys", "financialmodelingprep"))
    fh_key = os.environ.get("FINNHUB_API_KEY", _get("api_keys", "finnhub"))
    av_key = os.environ.get("ALPHA_VANTAGE_API_KEY", _get("api_keys", "alpha_vantage"))

    keys = ApiKeys(
        financialmodelingprep=fmp_key,
        finnhub=fh_key,
        alpha_vantage=av_key,
    )

    settings = Settings(
        data_cache_days=_getint("settings", "data_cache_days", 1),
        ticker_cache_days=_getint("settings", "ticker_cache_days", 7),
        max_workers=_getint("settings", "max_workers", 8),
        min_market_cap_millions=_getfloat("settings", "min_market_cap_millions", 0.0),
        results_per_page=_getint("settings", "results_per_page", 50),
    )

    weights = ScoringWeights(
        value=_getfloat("scoring_weights", "value", 0.25),
        quality=_getfloat("scoring_weights", "quality", 0.25),
        growth=_getfloat("scoring_weights", "growth", 0.25),
        momentum=_getfloat("scoring_weights", "momentum", 0.15),
        dividend=_getfloat("scoring_weights", "dividend", 0.10),
    )
    weights.validate()

    return AppConfig(api_keys=keys, settings=settings, weights=weights, config_path=path)
