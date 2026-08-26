# Brief Gap Audit — Pre-Fix

## Verified

- Risk-adaptive verification and profile-aware policy selection exist.
- Four authoritative decisions exist.
- Dataset Lab supports CSV/JSON/JSONL, profiling, mapping, cleaning, validation, reports, failures, and feedback.
- Uploaded data remains untrusted.
- Synthetic benchmark is explicitly labeled and public benchmark count remains zero.

## Partial / unverified

- Dataset APIs have no demo authentication boundary.
- Dataset storage is intentionally process-memory only.
- Fairness and PII checks are heuristic.
- Calibration, independent public benchmark performance, production concurrency, and tenant isolation are unverified.
- Full versus adaptive metrics are generated, but representative BYO-data experiment evidence is not yet recorded.
