"""Configuration loading and application paths.

The user only ever needs to edit ``config.ini`` once. Everything else (cache
files, the stored ticker universe, exported results) lives in a per-user data
directory so the source tree stays clean.
"""

from __future__ import annotations

import configparser
import os
from dataclasses import dataclass, field
from pathlib import Path


# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PACKAGE_DIR.parent
BUNDLED_DATA_DIR = PACKAGE_DIR / "data"


def _default_data_dir() -> Path:
    """Return a writable per-user directory for caches and exports."""
    env = os.environ.get("TSX_SCANNER_HOME")
    if env:
        return Path(env).expanduser()
    if os.name == "nt":
        base = os.environ.get("LOCALAPPDATA", str(Path.home()))
        return Path(base) / "TSXScanner"
    return Path.home() / ".tsx_scanner"


DATA_DIR = _default_data_dir()
UNIVERSE_CACHE = DATA_DIR / "tsx_universe.json"
SCAN_CACHE = DATA_DIR / "last_scan.json"


def config_path() -> Path:
    """Locate config.ini, preferring one next to the project root."""
    candidates = [
        Path(os.environ.get("TSX_SCANNER_CONFIG", "")) if os.environ.get("TSX_SCANNER_CONFIG") else None,
        PROJECT_DIR / "config.ini",
        DATA_DIR / "config.ini",
    ]
    for candidate in candidates:
        if candidate and candidate.is_file():
            return candidate
    # Default location we would like the user to create.
    return PROJECT_DIR / "config.ini"


# --------------------------------------------------------------------------- #
# Config object
# --------------------------------------------------------------------------- #
@dataclass
class ScoringWeights:
    value: float = 0.20
    quality: float = 0.25
    growth: float = 0.20
    health: float = 0.15
    income: float = 0.10
    momentum: float = 0.10

    def normalized(self) -> "ScoringWeights":
        total = (
            self.value + self.quality + self.growth
            + self.health + self.income + self.momentum
        )
        if total <= 0:
            return ScoringWeights()
        return ScoringWeights(
            value=self.value / total,
            quality=self.quality / total,
            growth=self.growth / total,
            health=self.health / total,
            income=self.income / total,
            momentum=self.momentum / total,
        )

    def as_dict(self) -> dict[str, float]:
        return {
            "value": self.value,
            "quality": self.quality,
            "growth": self.growth,
            "health": self.health,
            "income": self.income,
            "momentum": self.momentum,
        }


@dataclass
class AppConfig:
    api_keys: dict[str, str] = field(default_factory=dict)
    provider_order: list[str] = field(
        default_factory=lambda: ["fmp", "finnhub", "alpha_vantage", "yfinance"]
    )
    max_workers: int = 8
    request_timeout: int = 20
    cache_ttl_hours: float = 12.0
    include_tsxv: bool = False
    weights: ScoringWeights = field(default_factory=ScoringWeights)

    def key_for(self, provider: str) -> str:
        return (self.api_keys.get(provider) or "").strip()

    def has_key(self, provider: str) -> bool:
        return bool(self.key_for(provider))


# Map friendly provider names -> config.ini key names.
_KEY_ALIASES = {
    "fmp": ["financialmodelingprep", "fmp"],
    "finnhub": ["finnhub"],
    "alpha_vantage": ["alpha_vantage", "alphavantage"],
    "yfinance": [],  # no key required
}


def _get_first(section: configparser.SectionProxy, names: list[str]) -> str:
    for name in names:
        if name in section:
            return section.get(name, "")
    return ""


def load_config(path: Path | None = None) -> AppConfig:
    """Load configuration from disk, falling back to sensible defaults."""
    cfg = AppConfig()
    path = path or config_path()

    parser = configparser.ConfigParser()
    if path.is_file():
        parser.read(path, encoding="utf-8")

    if parser.has_section("api_keys"):
        section = parser["api_keys"]
        for provider, aliases in _KEY_ALIASES.items():
            if aliases:
                cfg.api_keys[provider] = _get_first(section, aliases).strip()

    if parser.has_section("settings"):
        s = parser["settings"]
        order = s.get("provider_order", "").strip()
        if order:
            cfg.provider_order = [p.strip().lower() for p in order.split(",") if p.strip()]
        cfg.max_workers = s.getint("max_workers", fallback=cfg.max_workers)
        cfg.request_timeout = s.getint("request_timeout", fallback=cfg.request_timeout)
        cfg.cache_ttl_hours = s.getfloat("cache_ttl_hours", fallback=cfg.cache_ttl_hours)
        cfg.include_tsxv = s.getboolean("include_tsxv", fallback=cfg.include_tsxv)

    if parser.has_section("scoring"):
        sc = parser["scoring"]
        cfg.weights = ScoringWeights(
            value=sc.getfloat("weight_value", fallback=cfg.weights.value),
            quality=sc.getfloat("weight_quality", fallback=cfg.weights.quality),
            growth=sc.getfloat("weight_growth", fallback=cfg.weights.growth),
            health=sc.getfloat("weight_health", fallback=cfg.weights.health),
            income=sc.getfloat("weight_income", fallback=cfg.weights.income),
            momentum=sc.getfloat("weight_momentum", fallback=cfg.weights.momentum),
        )

    ensure_data_dir()
    return cfg


def ensure_data_dir() -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return DATA_DIR
