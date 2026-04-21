"""Tests for CLI commands."""

from __future__ import annotations

from click.testing import CliRunner

from apidelta_ml.cli import main


def test_verify_runs() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["verify"])
    assert result.exit_code == 0
    assert "Python >= 3.11" in result.output


def test_verify_specs_on_empty(tmp_path, monkeypatch) -> None:
    import apidelta_ml.cli as cli_mod

    empty = tmp_path / "raw"
    empty.mkdir()
    monkeypatch.setattr(cli_mod, "RAW_DIR", empty)

    runner = CliRunner()
    result = runner.invoke(main, ["verify-specs"])
    assert result.exit_code == 0
    assert "0 APIs" in result.output


def test_version() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--version"])
    assert result.exit_code == 0
