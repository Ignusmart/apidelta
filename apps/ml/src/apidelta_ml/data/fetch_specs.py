"""Phase 1: Fetch OpenAPI specs from APIs.guru.

APIs.guru publishes a curated directory of OpenAPI specs with version history.
Each API has multiple version snapshots, which we use as natural before/after pairs
for training the diff classifier.

Directory schema (simplified):
    {
        "stripe.com": {
            "versions": {
                "2020-08-27": {"swaggerYamlUrl": "...", "updated": "..."},
                "2022-11-15": {"swaggerYamlUrl": "...", "updated": "..."}
            }
        }
    }

We download every version for each API into data/raw/<slug>/<version>.json.
Later phases pair consecutive versions and diff them.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import orjson
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential

from apidelta_ml.paths import RAW_DIR, ensure_dirs

logger = logging.getLogger(__name__)

APIS_GURU_LIST_URL = "https://api.apis.guru/v2/list.json"
DEFAULT_TIMEOUT = 30.0


class SpecVersion(BaseModel):
    """One version snapshot of an API."""

    version: str
    updated: str | None = None
    swagger_url: str | None = Field(default=None, alias="swaggerUrl")
    swagger_yaml_url: str | None = Field(default=None, alias="swaggerYamlUrl")
    openapi_ver: str | None = Field(default=None, alias="openapiVer")

    model_config = {"populate_by_name": True, "extra": "ignore"}

    def spec_url(self) -> str | None:
        return self.swagger_url or self.swagger_yaml_url


@dataclass
class FetchResult:
    api_slug: str
    versions_downloaded: int
    versions_skipped: int
    errors: list[str]


def slugify(api_name: str) -> str:
    """APIs.guru names can contain colons and slashes. Convert to filesystem-safe slug."""
    return api_name.replace(":", "__").replace("/", "_")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def _http_get(client: httpx.Client, url: str) -> httpx.Response:
    resp = client.get(url, timeout=DEFAULT_TIMEOUT, follow_redirects=True)
    resp.raise_for_status()
    return resp


def fetch_api_list(client: httpx.Client | None = None) -> dict[str, Any]:
    """Fetch the top-level list of all APIs from APIs.guru."""
    owned_client = client is None
    client = client or httpx.Client()
    try:
        resp = _http_get(client, APIS_GURU_LIST_URL)
        return resp.json()
    finally:
        if owned_client:
            client.close()


def _parse_versions(api_entry: dict[str, Any]) -> list[SpecVersion]:
    raw = api_entry.get("versions", {})
    out: list[SpecVersion] = []
    for version_name, version_data in raw.items():
        try:
            out.append(SpecVersion(version=version_name, **version_data))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Skipping malformed version %s: %s", version_name, exc)
    return out


def _dest_for(raw_dir: Path, slug: str, version: str, url: str) -> Path:
    ext = ".yaml" if url.endswith((".yaml", ".yml")) else ".json"
    return raw_dir / slug / f"{version}{ext}"


def fetch_one_api(
    api_name: str,
    api_entry: dict[str, Any],
    *,
    raw_dir: Path = RAW_DIR,
    client: httpx.Client | None = None,
    overwrite: bool = False,
) -> FetchResult:
    """Download every version of a single API."""
    owned_client = client is None
    client = client or httpx.Client()
    slug = slugify(api_name)
    versions = _parse_versions(api_entry)
    downloaded = skipped = 0
    errors: list[str] = []

    try:
        for v in versions:
            url = v.spec_url()
            if url is None:
                errors.append(f"{v.version}: no spec url")
                continue
            dest = _dest_for(raw_dir, slug, v.version, url)
            if dest.exists() and not overwrite:
                skipped += 1
                continue
            try:
                resp = _http_get(client, url)
            except Exception as exc:
                errors.append(f"{v.version}: {exc}")
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(resp.content)
            downloaded += 1
    finally:
        if owned_client:
            client.close()

    return FetchResult(
        api_slug=slug,
        versions_downloaded=downloaded,
        versions_skipped=skipped,
        errors=errors,
    )


def fetch_specs(
    limit: int | None = None,
    *,
    raw_dir: Path = RAW_DIR,
    client: httpx.Client | None = None,
    overwrite: bool = False,
) -> list[FetchResult]:
    """Fetch specs for up to `limit` APIs. None = all."""
    ensure_dirs()
    raw_dir.mkdir(parents=True, exist_ok=True)
    owned_client = client is None
    client = client or httpx.Client()
    results: list[FetchResult] = []

    try:
        api_list = fetch_api_list(client)
        names = list(api_list.keys())
        if limit is not None:
            names = names[:limit]

        for i, name in enumerate(names, start=1):
            logger.info("(%d/%d) fetching %s", i, len(names), name)
            result = fetch_one_api(
                name, api_list[name], raw_dir=raw_dir, client=client, overwrite=overwrite
            )
            results.append(result)
    finally:
        if owned_client:
            client.close()

    return results


def count_specs(raw_dir: Path = RAW_DIR) -> dict[str, int]:
    """Sanity-check: count files in data/raw/."""
    if not raw_dir.exists():
        return {"apis": 0, "versions": 0}
    apis = [d for d in raw_dir.iterdir() if d.is_dir()]
    total_versions = sum(1 for api in apis for f in api.iterdir() if f.is_file())
    return {"apis": len(apis), "versions": total_versions}


def load_spec(path: Path) -> dict[str, Any]:
    """Load a spec file (JSON or YAML)."""
    text = path.read_bytes()
    if path.suffix in (".yaml", ".yml"):
        import yaml  # lazy import

        return yaml.safe_load(text)
    return orjson.loads(text)
