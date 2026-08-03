from __future__ import annotations

import configparser
import shutil
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config.ini"
EXAMPLE_CONFIG_PATH = PROJECT_ROOT / "config.example.ini"


@dataclass(frozen=True)
class ApiKeys:
    financialmodelingprep: str = ""
    finnhub: str = ""
    alpha_vantage: str = ""


@dataclass(frozen=True)
class Settings:
    api_keys: ApiKeys
    request_delay_seconds: float
    request_timeout_seconds: float
    universe_cache: Path
    results_cache: Path


def ensure_config(path: Path = DEFAULT_CONFIG_PATH) -> Path:
    """Create config.ini from the example template if it does not exist."""
    if not path.exists():
        shutil.copyfile(EXAMPLE_CONFIG_PATH, path)
    return path


def _resolve_path(raw_path: str) -> Path:
    path = Path(raw_path).expanduser()
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path


def load_settings(path: Path = DEFAULT_CONFIG_PATH) -> Settings:
    ensure_config(path)
    parser = configparser.ConfigParser()
    parser.read(path)

    api_keys = ApiKeys(
        financialmodelingprep=parser.get("api_keys", "financialmodelingprep", fallback="").strip(),
        finnhub=parser.get("api_keys", "finnhub", fallback="").strip(),
        alpha_vantage=parser.get("api_keys", "alpha_vantage", fallback="").strip(),
    )

    return Settings(
        api_keys=api_keys,
        request_delay_seconds=parser.getfloat("scanner", "request_delay_seconds", fallback=0.25),
        request_timeout_seconds=parser.getfloat("scanner", "request_timeout_seconds", fallback=20.0),
        universe_cache=_resolve_path(parser.get("paths", "universe_cache", fallback="data/tsx_universe.json")),
        results_cache=_resolve_path(parser.get("paths", "results_cache", fallback="data/latest_results.csv")),
    )
