"""Shared pytest fixtures."""

from __future__ import annotations

from pathlib import Path

import orjson
import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def tmp_raw_dir(tmp_path: Path) -> Path:
    """Isolated raw data directory per test."""
    d = tmp_path / "raw"
    d.mkdir()
    return d


@pytest.fixture
def fake_api_list() -> dict:
    """Minimal APIs.guru `list.json` shape."""
    return {
        "example.com": {
            "versions": {
                "1.0.0": {
                    "swaggerUrl": "https://example.invalid/v1.json",
                    "updated": "2024-01-01T00:00:00Z",
                    "openapiVer": "3.0.0",
                },
                "2.0.0": {
                    "swaggerUrl": "https://example.invalid/v2.json",
                    "updated": "2024-06-01T00:00:00Z",
                    "openapiVer": "3.0.0",
                },
            }
        },
        "weird:name/with:colons": {
            "versions": {
                "1.0.0": {
                    "swaggerYamlUrl": "https://example.invalid/weird.yaml",
                    "updated": "2024-01-01T00:00:00Z",
                }
            }
        },
    }


@pytest.fixture
def minimal_openapi_bytes() -> bytes:
    """Tiny valid OpenAPI 3.0 spec as JSON bytes."""
    spec = {
        "openapi": "3.0.0",
        "info": {"title": "Example", "version": "1.0.0"},
        "paths": {"/ping": {"get": {"responses": {"200": {"description": "ok"}}}}},
    }
    return orjson.dumps(spec)
