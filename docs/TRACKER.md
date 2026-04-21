# APIDelta ML Layer — Build Tracker

**Goal**: Ship a fine-tuned ML classifier for API diffs as a paid tier on APIDelta. Doubles as a portfolio artifact demonstrating production AI/ML engineering (fine-tuning, distillation, conformal calibration, Modal serving).

**Status**: BUILDING (Weekend 1, Phase 1 complete)
**Gated by**: APIDelta surviving the 2026-05-15 kill-checkpoint. If APIDelta is killed, this dies with it.
**Research source**: `research/reports/2026-04-20-ml-portfolio-product-ideas.md` §Direction 1

---

## Architecture decision

**Python microservice carve-out**. CLAUDE.md's "no Python backends" rule is scoped to the core NestJS API — ML inference lives in a separate `apps/ml/` service deployed to Modal, called over HTTP from NestJS. The rule update will land in the same PR as the first weekend's work.

```
apidelta/
├── apps/
│   ├── web/        # Next.js (existing)
│   ├── api/        # NestJS (existing) — calls ml service over HTTP
│   └── ml/         # NEW — Python + FastAPI on Modal
└── ...
```

---

## Build plan (3 weekends)

### Weekend 1 — Data + baseline

**Goal**: Labeled dataset + a working (if dumb) classifier as floor.

- [x] **Scaffold `apps/ml/`** — Python service, uv-managed, pytest, ruff, Makefile, full README with glossary. `apps/ml/README.md`. CLAUDE.md + pnpm-workspace updated to carve out Python.
- [x] **Phase 1 — Fetch specs** (`apidelta_ml.data.fetch_specs`): APIs.guru downloader with retry + skip-existing, JSON + YAML support. 19/19 tests passing. Real fetch verified (3 APIs).
- [ ] Phase 2 — Generate diff pairs. **Known issue**: APIs.guru often has only 1 version per API; bump `--limit` to ~50 and filter for multi-version APIs to get real pairs.
- [ ] Phase 3 — Weak-label with `oasdiff` CLI. **System dep**: `brew install oasdiff`.
- [ ] Phase 4 — Hand-label gold set: ~500 from Stripe/Twilio/Shopify changelogs. **Never used in training. Only used for final eval.**
- [ ] Phase 5 — Baseline model: sentence-transformers (BGE-small-en-v1.5) → XGBoost. **System dep**: `brew install libomp` (for xgboost on macOS).
- [ ] Phase 6 — Measure macro-F1 on gold set → this is the **floor** any fancier model must beat

**Deliverable**: Dataset on HF Hub (private), baseline F1 score committed to this file.

### Weekend 2 — Fine-tune ModernBERT + distillation

**Goal**: Beat the baseline with a real fine-tuned model.

- [ ] Distillation label pass: Claude Haiku labels 50k diffs with Pydantic structured output (~$30-50 API cost)
- [ ] Fine-tune ModernBERT-base via LoRA on Modal (one A10G GPU, ~2-4hr)
- [ ] Evaluate macro-F1 on gold set + confusion matrix
- [ ] Add `mapie` conformal prediction → calibrated confidence intervals
- [ ] Push model to HF Hub (public — portfolio artifact)

**Deliverable**: Fine-tuned model card, eval report showing lift vs baseline.

**Kill criterion**: if fine-tuned model doesn't beat XGBoost baseline by ≥5 F1 points, ship the baseline and skip ModernBERT. Don't ship a worse model for portfolio optics.

### Weekend 3 — Productionize + integrate

**Goal**: Live in APIDelta as a paid feature.

- [ ] FastAPI service in `apps/ml/`, deployed to Modal with autoscale + keep-warm
- [ ] NestJS adds `MlClassifierClient` (HTTP) — calls ml service for every detected diff, stores `classification` + `confidence` in Postgres
- [ ] Prisma schema migration: add columns to `Diff` table
- [ ] UI: severity badges + confidence bars on diff view (shadcn/ui)
- [ ] Pricing: add "AI Insights" $20/mo add-on OR bump Pro tier — decide based on launch data
- [ ] Blog post draft: "Fine-tuning ModernBERT on 50k OpenAPI diffs"

**Deliverable**: Live in production, p50 <100ms, blog post draft, HF Hub model public.

---

## Out of scope (explicit)

- Semantic entropy / agent-output drift detection — deferred to v2
- MCP server spec monitoring expansion — deferred
- Replacing existing Claude classification — this **augments**, doesn't replace, until eval proves dominance
- Graph Neural Networks, clustering, vector similarity — wrong tools for this task (see Glossary)

---

## Risks

| Risk | Mitigation |
|------|-----------|
| APIDelta killed 2026-05-15 | Don't start weekend 2 until checkpoint clears |
| Label quality from `oasdiff` is weak | Gold set is the real ceiling; Haiku distillation is the safety net |
| Fine-tune doesn't beat baseline | Ship baseline; still a portfolio win with honest write-up |
| Modal cold starts >100ms | Budget $10-30/mo for keep-warm containers |
| Webacy conflict angle | This is pure API-spec classification (no wallets, no security) — safe |

---

## Glossary — ML concepts in this plan

### What kind of ML problem is this?

**Supervised classification.** We have inputs (a pair of OpenAPI specs: before + after) and discrete output labels (`cosmetic / breaking / new-feature / schema-shape`). The model learns the mapping from labeled examples.

Contrast with other ML problem types:

- **Classification** (what we're doing) — predict a category from a fixed set. "Is this diff breaking or not?" Labels exist in training data.
- **Clustering** — *no* labels exist; the algorithm groups similar things together and you name the groups after. Example: Direction 2 (wallet persona research) used HDBSCAN clustering to discover trader archetypes because nobody has pre-labeled "this wallet is a scalper". Not relevant here.
- **Regression** — predict a continuous number. "How many days until this API breaks?" Not what we're doing.
- **Ranking / similarity** — "find the K most similar items". Used in search. Not what we're doing.

**Key point**: classification vs clustering is the difference between *supervised* (labels given) and *unsupervised* (no labels) learning. APIDelta ML layer is supervised — we spend Weekend 1 getting labels precisely because classifiers need them.

### What is each model for?

| Model | Role | Type |
|-------|------|------|
| **`oasdiff`** (CLI tool, not ML) | Weak labeler for training data. Rule-based OpenAPI spec differ. | — |
| **Claude Haiku** | Stronger labeler (distillation teacher). We ask it to label 50k diffs with structured output. | LLM (closed) |
| **sentence-transformers / BGE-small** | Turns a text blob into a fixed-length vector (an *embedding*). Used as feature extractor for the baseline. | Embedding model |
| **XGBoost** | The baseline classifier. Takes embeddings + hand-crafted features, predicts label. | Gradient-boosted trees |
| **ModernBERT-base** | The portfolio showcase classifier. A transformer (BERT family, Dec 2024 release). We fine-tune it on our diff-pair task. | Transformer (149M params) |
| **LoRA** (Low-Rank Adaptation) | A *technique*, not a model. Lets us fine-tune ModernBERT by training small adapter matrices instead of all 149M params. 10-100× cheaper. | Fine-tuning method |
| **MAPIE** | A *wrapper*, not a model. Gives calibrated confidence intervals ("we're 90% sure this is breaking") using conformal prediction. | Uncertainty calibration |

### Random Forest vs XGBoost — why we picked XGBoost

**Random Forest**: trains many independent decision trees on random subsets, averages their votes. Good, robust, parallel.

**XGBoost** (Gradient Boosting): trains trees *sequentially*, where each new tree fixes the previous tree's mistakes. Usually wins Kaggle classification benchmarks.

Both are tree ensembles. Both work here. XGBoost is the default because it typically scores 1-3 F1 points higher on tabular tasks. Random Forest is a fine alternative if XGBoost overfits the small gold set.

**LightGBM** is a third option (faster training, similar accuracy). The Wallet Persona research uses LightGBM because it handles larger datasets better — any of the three would work for that task too.

### Train / validation / test splits — yes, we do this

Never train and evaluate on the same data. Standard split:

```
50k labeled diffs
├── 70% → Training set        (model learns from this)
├── 15% → Validation set      (hyperparameter tuning, early stopping)
└── 15% → Test set            (final score, touched ONCE at the end)

PLUS:

500 hand-labeled "gold set"   (NEVER in training; reported as the real number)
```

- **Why the gold set matters**: our 50k labels are weak (generated by `oasdiff` + Haiku). Evaluating on 50k test data only tells us how well we matched the *labels*, not how well we match reality. The 500 hand-labeled examples are reality.
- **Cross-validation** (k-fold): instead of one train/val split, rotate — train 5 times, each time holding out a different 1/5th for validation. More robust, 5× slower. Use it for hyperparameter tuning when data is scarce; skip it when you have 50k examples.
- **Conformal prediction calibration set**: MAPIE needs its own held-out set (usually 10-20% of training) to calibrate confidence intervals. Different from the test set.

### What does "fine-tuning" actually mean?

ModernBERT was pre-trained by HuggingFace on billions of tokens of general text. It already "knows" language. Fine-tuning:

1. Takes that pre-trained model
2. Adds a small classification head (a new layer that outputs 4 probabilities — one per label)
3. Trains on our 50k diff-pair examples for a few epochs
4. Most of the 149M parameters barely change; the head and top layers adapt to our task

**With LoRA**: we freeze all 149M params and only train tiny "adapter" matrices injected into each transformer layer. ~0.1% of the parameters, ~95% of the fine-tune quality.

### What is "distillation"?

Using a big expensive model (Claude Haiku) to generate training labels for a small cheap model (ModernBERT). The small model learns to mimic the big one's outputs. Result: Haiku-quality classification at 1000× cheaper inference cost.

### What is "conformal prediction"?

A technique that wraps any classifier and gives you statistically valid confidence intervals. Instead of "I predict `breaking` with 0.73 probability" (which is often miscalibrated), you get "with 90% confidence, the true label is in the set {`breaking`, `schema-shape`}". Makes the product trustworthy to ship.

---

## Success criteria

- [ ] Baseline beats random chance by wide margin (>0.6 F1 on gold set, since 4 classes)
- [ ] Fine-tuned model beats baseline by ≥5 F1 points (or we ship baseline)
- [ ] p50 latency <100ms on Modal
- [ ] Live in APIDelta UI by 2026-05-31
- [ ] Blog post shipped
- [ ] HF Hub model public with model card

---

## Iteration log

### 2026-04-20 — Weekend 1, session 1

**Done**:
- Scaffolded `apps/ml/` (Python 3.11, uv, pytest, ruff). Carve-out approved in `apidelta/CLAUDE.md` + excluded from pnpm workspace.
- Full `apps/ml/README.md` with ML glossary (classification vs clustering, train/val/test, Random Forest vs XGBoost, fine-tuning, LoRA, distillation, conformal prediction).
- `Makefile` with phased commands (`install`, `verify`, `test`, `fetch-specs*`, placeholders for phases 2-6).
- Phase 1 `fetch_specs` module: httpx + tenacity retry, pydantic models, JSON/YAML spec support, slugify for weird API names (`amazonaws.com:s3` → `amazonaws.com__s3`).
- Tests: **19/19 pytest passing** — unit (slugify, SpecVersion, load_spec, count_specs) + integration (respx-mocked HTTP) + CLI (click CliRunner).
- Verified live: `fetch-specs --limit 3` against real APIs.guru → 3 APIs in `data/raw/`.

**Known caveats**:
- APIs.guru curated directory often ships only 1 version per API. Need `--limit 50+` in Phase 2 to find multi-version APIs for real pair generation. Alternative: pull git history directly from upstream repos.
- System deps not installed on dev machine: `oasdiff` (Phase 3 blocker), `libomp` (Phase 5 blocker for xgboost on macOS). `make verify` surfaces both.
- 1 pytest iteration needed after xgboost raised `XGBoostError` (not `ImportError`) in `verify` command — fixed with broader exception handling.

**Next session**: Phase 2 (generate_diffs) — pair consecutive versions per API, emit `data/processed/pairs.jsonl`. Will need to fetch ~50 APIs first to have real multi-version data.

