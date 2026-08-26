# Final Implementation Plan

1. Add typed use-case profile registry with region override and policy version.
2. Thread profile/policy/evidence source into orchestrator responses, audit events, DB rows, and UI.
3. Add normalized evaluation schema and deterministic synthetic corpus with held-out split.
4. Add `npm run evaluate` runner, machine-readable JSON, human-readable report, and trade-off comparison.
5. Add multi-turn/agent cases and report loop/retry outcomes.
6. Add feedback table/API and a compact Trust & Evaluation page.
7. Preserve A/B/C/D fixtures and add profile selection to the simulator.
8. Add tests for policy switching, evaluation determinism, feedback persistence, and safety invariants.
9. Run the full verification commands and document unsupported claims as NOT ESTABLISHED.
