# ControlPlane Evaluation Corpus

The current runnable corpus is synthetic and generated from the reviewed seeds in `datasets/synthetic-seeds.json`. It is not customer data and does not represent production prevalence. Demo fixtures A–D are excluded.

`npm run evaluate` executes the held-out evaluation runner and writes:

- `evaluation/results/latest.json`
- `evaluation/reports/latest.md`

The runner expands reviewed templates deterministically to 600 cases across 40 distinct seed categories, checks duplicates and missing labels, uses a 60/20/20 (360 development / 120 validation / 120 evaluation) split, and reports metrics separately. Calibration is `NOT ESTABLISHED`.

Additional ready-to-test benchmark datasets are provided for Dataset Lab ingestion:
- `evaluation/datasets/benchmark-enterprise-multi-domain.csv`
- `evaluation/datasets/benchmark-adversarial-and-safety.json`
- `evaluation/datasets/benchmark-agent-cost-and-loops.jsonl`

Public dataset candidates are documented in `docs/brief-alignment/DATASET_STRATEGY.md`; none are counted until exact license and label quality are verified.
