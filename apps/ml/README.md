# APIDelta ML Service

Python microservice that classifies OpenAPI diffs as `cosmetic / breaking / new-feature / schema-shape` with calibrated confidence. Called over HTTP from the NestJS API (`apps/api`).

> **Status**: Weekend 1, Phase 1 (spec fetching). Not wired into the API yet.
> **Build plan**: `../../docs/TRACKER.md`

---

## Why this exists

APIDelta watches upstream APIs for changes. Today, a Claude API call classifies each change. That works but has two problems: (1) $ cost per diff, (2) no principled confidence score. This service trains a small, fast, self-hosted classifier to replace — or at minimum augment — the LLM call.

It also doubles as a portfolio artifact: fine-tuned ModernBERT, LoRA distillation, conformal calibration, FastAPI on Modal.

---

## Architecture at a glance

```
Raw OpenAPI specs (APIs.guru)
        │
        ▼
[fetch_specs]  →  data/raw/<api>/<version>.json
        │
        ▼
[generate_diffs]  →  data/processed/pairs.jsonl   (before, after) tuples
        │
        ├──────────────┐
        ▼              ▼
[weak_label]      [hand_label]
 oasdiff CLI       human (you) labels
        │              │
        ▼              ▼
data/processed/    data/gold/gold.jsonl
  labeled.jsonl    (~500 examples, test-only)
        │
        ▼
[features]  →  BGE embeddings + hand-crafted delta features
        │
        ▼
[baseline]  →  XGBoost classifier (Weekend 1 ship)
        │
        ▼
[eval]  →  Macro-F1 + confusion matrix on gold set
```

Weekend 2 adds fine-tuned ModernBERT (LoRA, distilled from Claude Haiku).
Weekend 3 wraps it in FastAPI, deploys to Modal, and wires into NestJS.

---

## Quick start

### Prerequisites

- **Python 3.11+** (managed via `uv` — see below)
- **uv**: fast Python package manager. Install: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **oasdiff**: Go CLI for OpenAPI diffing. Install: `brew install oasdiff` or see [oasdiff docs](https://github.com/oasdiff/oasdiff)
- **make**: standard (comes with Xcode CLI tools on macOS)

### Setup

```bash
cd apps/ml
make install    # creates .venv, installs dependencies
make verify     # sanity-check: oasdiff, python, imports all work
```

### Run everything (end-to-end smoke test)

```bash
make smoke      # fetches 3 APIs, generates diffs, weak-labels, trains baseline on tiny set
```

Takes ~2 minutes. If `make smoke` passes, your environment is good.

### Run tests

```bash
make test       # all pytest tests
make test-unit  # just unit tests (no network)
```

---

## Phase-by-phase walkthrough

Each phase has its own script. Run them in order. Each is idempotent — safe to re-run.

### Phase 1 — Fetch specs

```bash
make fetch-specs-sample   # pulls 5 APIs for smoke testing
make fetch-specs          # pulls ~100 APIs (~10 min, ~500MB)
```

What it does: downloads OpenAPI specs from [APIs.guru](https://apis.guru/). Each API has multiple version snapshots, which we use as natural before/after pairs.

Output: `data/raw/<api-name>/<version>.json`

**Verify**:
```bash
make verify-specs     # runs sanity checks on data/raw/
```

### Phase 2 — Generate diff pairs

```bash
make generate-diffs
```

What it does: for each API, sorts versions chronologically and emits `(spec_before, spec_after)` pairs.

Output: `data/processed/pairs.jsonl`

### Phase 3 — Weak-label with oasdiff

```bash
make weak-label
```

What it does: runs `oasdiff` on each pair, maps output to our 4-class label space. This is a **weak label** — fast but imperfect; the gold set is what we trust.

Output: `data/processed/labeled.jsonl`

### Phase 4 — Build gold set (manual, do once)

```bash
make hand-label        # interactive CLI
```

What it does: shows you a diff pair, asks for a label. Stores in `data/gold/gold.jsonl`. Target: 500 examples from high-quality changelogs (Stripe, Twilio, Shopify, GitHub). This set is **test-only** — never enters training.

### Phase 5 — Train baseline

```bash
make train-baseline
```

What it does: embeds each spec with BGE-small, adds hand-crafted delta features, trains XGBoost. Reports train/val/test F1.

Output: `artifacts/baseline.model`

### Phase 6 — Evaluate on gold set

```bash
make eval
```

What it does: runs the baseline on `data/gold/gold.jsonl`, reports macro-F1, per-class F1, confusion matrix. Writes `artifacts/eval-report.md`.

---

## Glossary — ML & domain terms

### The ML task

This is a **supervised classification** problem:

- **Input**: a pair of OpenAPI specs — the "before" and "after" versions of an API.
- **Output**: one of four labels: `cosmetic`, `breaking`, `new-feature`, `schema-shape`.
- **Supervised**: we have labeled training examples. The model learns the mapping.

Not to be confused with:
- **Clustering** (unsupervised — no labels, algorithm discovers groups)
- **Regression** (predicting a continuous number, e.g. "days until breakage")
- **Ranking** (ordering a list by relevance)

### The labels

- **cosmetic** — wording-only changes, description updates, reordering. No behavior change.
- **breaking** — clients written against the "before" spec will break. Removed fields, renamed paths, stricter validation, removed endpoints.
- **new-feature** — additive, non-breaking. New endpoints, new optional fields.
- **schema-shape** — structural changes that aren't obviously breaking or additive (e.g., `nullable: true` flip, type widening). Ambiguous; flagged for human review.

### The models we use

| Name | What it is | What it does here |
|------|-----------|-------------------|
| **oasdiff** | Go CLI, rule-based | Generates **weak labels** for 50k pairs. Not ML. |
| **Claude Haiku** | Anthropic LLM | (Weekend 2) generates stronger labels via structured output. The "teacher" for distillation. |
| **sentence-transformers / BGE-small** | Embedding model (~33M params) | Converts each spec to a fixed-length vector (the "embedding"). Feature extractor. |
| **XGBoost** | Gradient-boosted decision trees | The **baseline classifier**. Takes embeddings + hand-crafted features, outputs label. |
| **ModernBERT-base** | Transformer (149M params) | (Weekend 2) the **portfolio showcase** classifier. We fine-tune it on our task. |
| **LoRA** | Fine-tuning technique, not a model | Fine-tunes ModernBERT 100× cheaper by training small adapter matrices instead of all 149M params. |
| **MAPIE** | Python library, not a model | Wraps any classifier with **conformal prediction** for calibrated confidence intervals. |

### Random Forest vs XGBoost vs LightGBM

All three are **tree ensembles** — they combine many decision trees.

- **Random Forest**: trees are independent, trained on random subsets, votes averaged. Robust, hard to overfit.
- **XGBoost** (Extreme Gradient Boosting): trees are trained *sequentially* — each new tree fixes the previous tree's mistakes. Usually wins benchmarks on tabular data.
- **LightGBM**: similar to XGBoost but with a different tree-growth strategy (leaf-wise vs level-wise). Faster on large data, similar accuracy.

We pick **XGBoost** for the baseline because it typically scores 1-3 F1 points higher on tabular classification. If it overfits our small gold set, Random Forest is the fallback.

### Train / validation / test — and why we have a "gold set"

Standard ML split on our 50k weak-labeled pairs:

```
50k labeled pairs
├── 70% → Training set     (model learns from this)
├── 15% → Validation set   (tune hyperparameters, pick best model)
└── 15% → Test set         (final score, touched ONCE)
```

Plus a separate **gold set** of ~500 examples that we hand-label. **Never used in training.** Only for final evaluation.

**Why the gold set matters**: our 50k training labels come from `oasdiff` + (in Weekend 2) Claude Haiku. Both are imperfect. If we only evaluate on the 15% test split of the weak-labeled data, we're measuring *how well we matched oasdiff*, not *how well we match reality*. The gold set is reality.

### Cross-validation (k-fold)

Instead of one fixed train/val split, rotate: train 5 times, each time holding out a different 1/5th for validation, average the scores.

- **When to use**: hyperparameter tuning with small data (< a few thousand examples).
- **When to skip**: when you have 50k examples and one fixed split is already statistically stable. We skip it for the baseline; may use 3-fold for the Weekend 2 fine-tune if the 50k gets filtered down.

### Macro-F1 — why this metric

**F1** = harmonic mean of precision and recall for a single class.
**Macro-F1** = average of per-class F1 scores, weighted equally.

Why macro, not accuracy: our classes are imbalanced (likely 60% `cosmetic`, 20% `new-feature`, 15% `breaking`, 5% `schema-shape`). A model that predicts "cosmetic" for everything would hit 60% accuracy but be useless. Macro-F1 penalizes that — minority classes count equally.

### Distillation

Using a big expensive model (Claude Haiku) to generate labels for a small cheap model (ModernBERT). The small model learns to mimic the big one's outputs. Weekend 2.

### Fine-tuning

ModernBERT was pre-trained on billions of tokens of general text; it already "knows" language. Fine-tuning:

1. Take the pre-trained model.
2. Add a small classification head (outputs 4 probabilities — one per label).
3. Train on our 50k pairs for a few epochs.
4. Most of the 149M parameters barely change; the head and top layers adapt.

With **LoRA**, we freeze the 149M params and train only tiny adapter matrices. ~0.1% of the parameters, ~95% of the quality.

### Conformal prediction

A technique that wraps any classifier to give statistically valid confidence intervals. Instead of "I predict `breaking` with 0.73 probability" (often miscalibrated), you get "with 90% confidence, the true label is in the set `{breaking, schema-shape}`". Makes the product trustworthy.

### Weak labels vs gold labels

- **Weak**: generated automatically by a rule-based tool or LLM. Fast, cheap, noisy. We use these for training.
- **Gold**: hand-labeled by a human. Slow, expensive, correct. We use these for evaluation.

You train on weak and evaluate on gold. This is the standard "programmatic labeling" pattern (Snorkel-style).

---

## Project layout

```
apps/ml/
├── README.md                        # you are here
├── Makefile                         # all commands
├── pyproject.toml                   # Python deps + config (uv-managed)
├── .python-version                  # 3.11
├── .gitignore
├── src/
│   └── apidelta_ml/
│       ├── __init__.py
│       ├── data/
│       │   ├── fetch_specs.py       # Phase 1
│       │   ├── generate_diffs.py    # Phase 2
│       │   ├── weak_label.py        # Phase 3
│       │   └── hand_label.py        # Phase 4
│       ├── features/
│       │   ├── embeddings.py
│       │   └── hand_crafted.py
│       ├── models/
│       │   └── baseline.py          # Phase 5
│       ├── eval/
│       │   └── metrics.py           # Phase 6
│       └── cli.py                   # `python -m apidelta_ml <cmd>`
├── tests/
│   ├── conftest.py
│   ├── fixtures/                    # tiny spec samples for unit tests
│   └── test_*.py
├── scripts/                         # thin shell wrappers (Makefile calls these)
├── data/                            # gitignored
│   ├── raw/                         # fetched specs
│   ├── processed/                   # diff pairs, labels
│   └── gold/                        # hand-labeled (tracked in repo)
└── artifacts/                       # gitignored — trained models
```

---

## Makefile commands (reference)

| Command | Purpose |
|---------|---------|
| `make install` | Create .venv, install deps via uv |
| `make verify` | Sanity-check environment (oasdiff, python, imports) |
| `make test` | Run all pytest tests |
| `make test-unit` | Run unit tests (no network) |
| `make fetch-specs-sample` | Phase 1, 5 APIs |
| `make fetch-specs` | Phase 1, ~100 APIs |
| `make verify-specs` | Check data/raw/ integrity |
| `make generate-diffs` | Phase 2 |
| `make weak-label` | Phase 3 |
| `make hand-label` | Phase 4 (interactive) |
| `make train-baseline` | Phase 5 |
| `make eval` | Phase 6 |
| `make smoke` | End-to-end smoke test on 3 APIs |
| `make lint` | ruff check + format |
| `make clean` | Remove .venv, data/, artifacts/ |

---

## Contributing to this service

This is a solo-built portfolio piece. No external contributors expected. But:

- **Don't commit `data/raw/` or `data/processed/`** — they're gitignored. Rebuild with `make fetch-specs && make generate-diffs`.
- **Do commit `data/gold/`** — that's hand-crafted IP.
- Run `make test` before pushing. CI (TODO) will run the same.
