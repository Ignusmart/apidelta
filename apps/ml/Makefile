.PHONY: help install verify test test-unit lint clean \
        fetch-specs-sample fetch-specs verify-specs \
        generate-diffs weak-label hand-label \
        train-baseline eval smoke

PYTHON := uv run python
UV := uv

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2}'

# ─── Environment ──────────────────────────────────────────────────────────────

install: ## Create .venv and install dependencies
	$(UV) sync --all-extras
	@echo "✓ Environment ready. Activate: source .venv/bin/activate"

verify: ## Sanity-check environment (oasdiff, python, imports)
	@$(PYTHON) -m apidelta_ml.cli verify

# ─── Testing ──────────────────────────────────────────────────────────────────

test: ## Run all pytest tests
	$(UV) run pytest

test-unit: ## Run unit tests (no network)
	$(UV) run pytest -m "not network and not slow"

lint: ## Run ruff check + format
	$(UV) run ruff check src tests
	$(UV) run ruff format --check src tests

lint-fix: ## Auto-fix lint issues
	$(UV) run ruff check --fix src tests
	$(UV) run ruff format src tests

# ─── Phase 1: Fetch specs ─────────────────────────────────────────────────────

fetch-specs-sample: ## Phase 1: fetch 5 APIs (smoke test)
	$(PYTHON) -m apidelta_ml.cli fetch-specs --limit 5

fetch-specs: ## Phase 1: fetch ~100 APIs (~10 min)
	$(PYTHON) -m apidelta_ml.cli fetch-specs --limit 100

verify-specs: ## Sanity-check data/raw/ integrity
	$(PYTHON) -m apidelta_ml.cli verify-specs

# ─── Phase 2-6: TBD as we build them ──────────────────────────────────────────

generate-diffs: ## Phase 2 (not yet implemented)
	@echo "Not yet implemented (task #3)"
	@exit 1

weak-label: ## Phase 3 (not yet implemented)
	@echo "Not yet implemented (task #4)"
	@exit 1

hand-label: ## Phase 4 (not yet implemented)
	@echo "Not yet implemented (task #5)"
	@exit 1

train-baseline: ## Phase 5 (not yet implemented)
	@echo "Not yet implemented (task #7)"
	@exit 1

eval: ## Phase 6 (not yet implemented)
	@echo "Not yet implemented (task #8)"
	@exit 1

smoke: ## End-to-end smoke test on 3 APIs
	@echo "Will run after all phases implemented"
	@exit 1

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean: ## Remove .venv, data/, artifacts/
	rm -rf .venv data/raw data/processed artifacts .pytest_cache .ruff_cache
