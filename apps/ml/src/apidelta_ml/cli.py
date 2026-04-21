"""CLI entry points. Invoked via `python -m apidelta_ml.cli` or `apidelta-ml`."""

from __future__ import annotations

import logging
import shutil
import sys
from importlib import import_module

import click
from rich.console import Console
from rich.table import Table

from apidelta_ml import __version__
from apidelta_ml.data.fetch_specs import count_specs, fetch_specs
from apidelta_ml.paths import RAW_DIR, ensure_dirs

console = Console()


@click.group()
@click.version_option(__version__)
def main() -> None:
    """APIDelta ML — classify OpenAPI diffs."""
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )


@main.command()
def verify() -> None:
    """Sanity-check environment: Python, oasdiff, key imports."""
    table = Table(title="Environment check")
    table.add_column("Check")
    table.add_column("Status")
    table.add_column("Detail")

    # Python version
    py = sys.version.split()[0]
    py_ok = sys.version_info >= (3, 11)
    table.add_row("Python >= 3.11", _tick(py_ok), py)

    # oasdiff
    oasdiff = shutil.which("oasdiff")
    table.add_row(
        "oasdiff on PATH",
        _tick(bool(oasdiff)),
        oasdiff or "not found — `brew install oasdiff`",
    )

    # Key imports
    for mod in ("httpx", "pydantic", "orjson", "click", "rich", "tenacity", "yaml"):
        try:
            import_module(mod)
            table.add_row(f"import {mod}", _tick(True), "")
        except ImportError as exc:
            table.add_row(f"import {mod}", _tick(False), str(exc))

    # ML-extra imports (optional). Catch broadly: xgboost raises its own error
    # class if libomp is missing, not ImportError.
    for mod in ("numpy", "pandas", "sklearn", "xgboost", "sentence_transformers", "mapie"):
        try:
            import_module(mod)
            table.add_row(f"import {mod}", _tick(True), "(optional ML extra)")
        except ImportError:
            table.add_row(f"import {mod}", "[yellow]SKIP[/yellow]", "install with: uv sync --extra ml")
        except Exception as exc:
            hint = (
                "missing libomp — `brew install libomp`"
                if mod == "xgboost" and "libomp" in str(exc)
                else str(exc)[:80]
            )
            table.add_row(f"import {mod}", "[yellow]WARN[/yellow]", hint)

    console.print(table)


@main.command("fetch-specs")
@click.option("--limit", type=int, default=None, help="Max APIs to fetch (None = all).")
@click.option("--overwrite", is_flag=True, help="Re-download existing versions.")
def fetch_specs_cmd(limit: int | None, overwrite: bool) -> None:
    """Phase 1: download OpenAPI specs from APIs.guru."""
    ensure_dirs()
    console.print(f"[cyan]Fetching specs (limit={limit})...[/cyan]")
    results = fetch_specs(limit=limit, overwrite=overwrite)

    total_downloaded = sum(r.versions_downloaded for r in results)
    total_skipped = sum(r.versions_skipped for r in results)
    total_errors = sum(len(r.errors) for r in results)

    console.print(
        f"[green]✓[/green] {len(results)} APIs | "
        f"{total_downloaded} downloaded | "
        f"{total_skipped} skipped (already present) | "
        f"{total_errors} errors"
    )

    if total_errors:
        console.print("[yellow]First 10 errors:[/yellow]")
        count = 0
        for r in results:
            for err in r.errors:
                console.print(f"  {r.api_slug}: {err}")
                count += 1
                if count >= 10:
                    return


@main.command("verify-specs")
def verify_specs_cmd() -> None:
    """Sanity-check data/raw/ integrity."""
    counts = count_specs(RAW_DIR)
    console.print(f"[cyan]data/raw/[/cyan]: {counts['apis']} APIs, {counts['versions']} total versions")
    if counts["apis"] == 0:
        console.print("[yellow]Nothing fetched yet. Run: make fetch-specs-sample[/yellow]")


def _tick(ok: bool) -> str:
    return "[green]OK[/green]" if ok else "[red]FAIL[/red]"


if __name__ == "__main__":
    main()
