# ControlPlane Evaluation Corpus

The current runnable corpus is synthetic and generated from the reviewed seeds in `datasets/synthetic-seeds.json`. It is not customer data and does not represent production prevalence. Demo fixtures A–D are excluded.

`npm run evaluate` executes the held-out evaluation runner and writes:

- `evaluation/results/latest.json`
- `evaluation/reports/latest.md`

The runner expands reviewed templates deterministically to 320 cases, checks duplicates and missing labels, uses a 60/20/20 development/validation/evaluation split, and reports metrics separately. Calibration is `NOT ESTABLISHED`.

Public dataset candidates are documented in `docs/brief-alignment/DATASET_STRATEGY.md`; none are counted until exact license and label quality are verified.
