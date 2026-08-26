# Dataset Lab Fix Plan

## P0 / before any real traffic

1. Add authenticated tenancy and authorization to every dataset, run, feedback, report, and Control Desk route.
2. Move raw-input handling and metadata persistence to a bounded, transactional service with encryption, retention, deletion, and audit controls.
3. Define fail-closed behavior for evaluator, storage, and dependency failures under a production threat model.

## P1 / before judging claims of enterprise readiness

1. Import at least one independently licensed public dataset after artifact/license review and publish provenance.
2. Add calibration, confidence intervals, stratified metrics, and adversarial holdouts; do not rely on synthetic 100% accuracy.
3. Replace heuristic-only PII/fairness/contamination checks with measured detectors and explicit false-positive/false-negative studies.
4. Add restart, concurrent-write, rate-limit, and multi-tenant integration tests.

## P2 / competition polish

1. Show adaptive-versus-deep deltas on a non-trivial labeled dataset, not a one-row or synthetic-only example.
2. Add dataset lineage/version identifiers and reproducible run manifests.
3. Add exportable reviewer feedback reports while keeping policy changes human-approved.
