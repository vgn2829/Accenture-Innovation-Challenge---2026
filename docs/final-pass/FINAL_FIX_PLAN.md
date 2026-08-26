# Final Fix Plan

1. Fix simulator clean initial state, separate selection from execution, clear stale results on scenario/profile changes, and guard overlapping runs.
2. Add a local Dataset Lab demo token gate without exposing the token client-side.
3. Clear Dataset Lab UI state after successful deletion and surface upload/reset failures.
4. Add a real Control Desk Add Note interaction or explicitly remove the backend-only affordance from the product contract.
5. Add regression and fresh red-team tests, then run lint, typecheck, build, API tests, and browser checks.
6. Record design alignment and remaining prototype deviations; do not claim production security or an independent benchmark.
