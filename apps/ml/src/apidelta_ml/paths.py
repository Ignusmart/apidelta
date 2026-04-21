"""Canonical paths for data artifacts."""

from __future__ import annotations

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent
APP_ROOT = PACKAGE_ROOT.parent.parent
DATA_DIR = APP_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
GOLD_DIR = DATA_DIR / "gold"
ARTIFACTS_DIR = APP_ROOT / "artifacts"


def ensure_dirs() -> None:
    for d in (RAW_DIR, PROCESSED_DIR, GOLD_DIR, ARTIFACTS_DIR):
        d.mkdir(parents=True, exist_ok=True)
