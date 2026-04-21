"""Tests for Phase 1: fetch_specs."""

from __future__ import annotations

from pathlib import Path

import httpx
import orjson
import pytest
import respx

from apidelta_ml.data.fetch_specs import (
    SpecVersion,
    count_specs,
    fetch_one_api,
    fetch_specs,
    load_spec,
    slugify,
)


class TestSlugify:
    def test_passthrough(self) -> None:
        assert slugify("stripe.com") == "stripe.com"

    def test_colons_become_double_underscore(self) -> None:
        assert slugify("amazonaws.com:s3") == "amazonaws.com__s3"

    def test_slashes_become_underscore(self) -> None:
        assert slugify("adobe.com/aem") == "adobe.com_aem"

    def test_combined(self) -> None:
        assert slugify("weird:name/with:colons") == "weird__name_with__colons"


class TestSpecVersion:
    def test_swagger_url_preferred(self) -> None:
        v = SpecVersion(version="1.0", swaggerUrl="https://a.example", swaggerYamlUrl="https://b.example")
        assert v.spec_url() == "https://a.example"

    def test_yaml_fallback(self) -> None:
        v = SpecVersion(version="1.0", swaggerYamlUrl="https://b.example")
        assert v.spec_url() == "https://b.example"

    def test_no_url_returns_none(self) -> None:
        v = SpecVersion(version="1.0")
        assert v.spec_url() is None


class TestFetchOneApi:
    def test_downloads_all_versions(
        self, tmp_raw_dir: Path, fake_api_list: dict, minimal_openapi_bytes: bytes
    ) -> None:
        entry = fake_api_list["example.com"]

        with respx.mock:
            respx.get("https://example.invalid/v1.json").respond(
                200, content=minimal_openapi_bytes
            )
            respx.get("https://example.invalid/v2.json").respond(
                200, content=minimal_openapi_bytes
            )
            with httpx.Client() as client:
                result = fetch_one_api(
                    "example.com", entry, raw_dir=tmp_raw_dir, client=client
                )

        assert result.versions_downloaded == 2
        assert result.versions_skipped == 0
        assert result.errors == []
        assert (tmp_raw_dir / "example.com" / "1.0.0.json").exists()
        assert (tmp_raw_dir / "example.com" / "2.0.0.json").exists()

    def test_yaml_suffix(self, tmp_raw_dir: Path, fake_api_list: dict) -> None:
        entry = fake_api_list["weird:name/with:colons"]
        with respx.mock:
            respx.get("https://example.invalid/weird.yaml").respond(
                200, content=b"openapi: 3.0.0\ninfo:\n  title: t\n  version: 1\n"
            )
            with httpx.Client() as client:
                result = fetch_one_api(
                    "weird:name/with:colons", entry, raw_dir=tmp_raw_dir, client=client
                )

        assert result.versions_downloaded == 1
        assert (tmp_raw_dir / "weird__name_with__colons" / "1.0.0.yaml").exists()

    def test_skips_existing(
        self, tmp_raw_dir: Path, fake_api_list: dict, minimal_openapi_bytes: bytes
    ) -> None:
        entry = fake_api_list["example.com"]
        (tmp_raw_dir / "example.com").mkdir()
        (tmp_raw_dir / "example.com" / "1.0.0.json").write_bytes(b"{}")

        with respx.mock:
            respx.get("https://example.invalid/v2.json").respond(
                200, content=minimal_openapi_bytes
            )
            with httpx.Client() as client:
                result = fetch_one_api(
                    "example.com", entry, raw_dir=tmp_raw_dir, client=client
                )

        assert result.versions_downloaded == 1
        assert result.versions_skipped == 1

    def test_records_errors_without_crashing(
        self, tmp_raw_dir: Path, fake_api_list: dict
    ) -> None:
        entry = fake_api_list["example.com"]

        with respx.mock:
            respx.get("https://example.invalid/v1.json").respond(500)
            respx.get("https://example.invalid/v2.json").respond(500)
            with httpx.Client() as client:
                result = fetch_one_api(
                    "example.com", entry, raw_dir=tmp_raw_dir, client=client
                )

        assert result.versions_downloaded == 0
        assert len(result.errors) == 2


class TestFetchSpecs:
    def test_respects_limit(
        self, tmp_raw_dir: Path, fake_api_list: dict, minimal_openapi_bytes: bytes
    ) -> None:
        with respx.mock:
            respx.get("https://api.apis.guru/v2/list.json").respond(
                200, json=fake_api_list
            )
            respx.get("https://example.invalid/v1.json").respond(
                200, content=minimal_openapi_bytes
            )
            respx.get("https://example.invalid/v2.json").respond(
                200, content=minimal_openapi_bytes
            )

            with httpx.Client() as client:
                results = fetch_specs(limit=1, raw_dir=tmp_raw_dir, client=client)

        assert len(results) == 1
        assert results[0].api_slug == "example.com"


class TestCountSpecs:
    def test_empty_dir(self, tmp_raw_dir: Path) -> None:
        assert count_specs(tmp_raw_dir) == {"apis": 0, "versions": 0}

    def test_counts_correctly(self, tmp_raw_dir: Path) -> None:
        (tmp_raw_dir / "a").mkdir()
        (tmp_raw_dir / "a" / "1.json").write_text("{}")
        (tmp_raw_dir / "a" / "2.json").write_text("{}")
        (tmp_raw_dir / "b").mkdir()
        (tmp_raw_dir / "b" / "1.json").write_text("{}")

        assert count_specs(tmp_raw_dir) == {"apis": 2, "versions": 3}


class TestLoadSpec:
    def test_loads_json(self, tmp_path: Path, minimal_openapi_bytes: bytes) -> None:
        p = tmp_path / "spec.json"
        p.write_bytes(minimal_openapi_bytes)
        spec = load_spec(p)
        assert spec["openapi"] == "3.0.0"

    def test_loads_yaml(self, tmp_path: Path) -> None:
        p = tmp_path / "spec.yaml"
        p.write_text("openapi: 3.0.0\ninfo:\n  title: t\n  version: '1'\n")
        spec = load_spec(p)
        assert spec["openapi"] == "3.0.0"
        assert spec["info"]["version"] == "1"
