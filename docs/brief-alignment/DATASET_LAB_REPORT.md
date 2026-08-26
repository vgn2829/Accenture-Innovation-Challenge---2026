# Dataset Lab Verification Report

Date: 2026-08-25

## Scope

This report verifies the implemented Dataset Lab against the supplied Accenture Round 2 brief. Claims are based on source inspection, Vitest execution, API-route tests, lint, typecheck, and production build. Uploaded files are temporary prototype inputs only; no public corpus was imported or counted.

## Verified flow

`INGEST → PROFILE → CLEAN → MAP → VALIDATE → APPLY POLICY → RUN CONTROLPLANE → EVALUATE → REPORT`

- Adapters accept CSV, JSON arrays/objects, and JSONL, with malformed-row accounting and nesting/size/row limits.
- Profiling reports structure, inferred types, missingness, duplicates, nested fields, text length, PII candidates, and mapping candidates.
- Mapping is explicit; ambiguous candidates are surfaced rather than silently selected.
- Normalization is deterministic and retains raw/normalized values only in temporary process memory.
- All uploaded cases remain `USER_UPLOADED`. Uploaded evidence and entity references are not passed to the trusted evidence resolver.
- Runs retain policy/profile/mode/split/latency/tier/decision metadata. Historical JSON artifacts intentionally exclude raw uploaded responses.
- Labels are optional. Missing or invalid labels produce `UNAVAILABLE` metrics rather than fabricated scores.
- Feedback is review-only and cannot mutate policy automatically.

## Honest limitations

The BYO evaluator is not a production benchmark service. Storage is process memory with a 30-minute TTL; the API has demo-mode/token protection but no enterprise authentication or tenant isolation; PII/fairness/contamination checks are deterministic heuristics; small datasets can produce empty 10% slices; calibration and confidence intervals are not established; public-data metrics are zero. The existing 320-case result is synthetic mechanism evidence, not generalization evidence.

## Evidence

- 168 tests passed across 16 test files.
- `npm run lint` passed with no warnings.
- `npm run typecheck` passed.
- `npx next build --webpack` passed and emitted Dataset Lab routes/pages.
- `npm run evaluate` passed: 320 synthetic cases, 64 held-out, 0 public cases, 0 false releases, 0 false blocks, high-impact escalation recall 1.0; calibration remains `NOT ESTABLISHED`.
