# Gap Analysis

## Already real

- Deterministic Tier 0/1/2 orchestration.
- Trusted demo evidence boundary.
- Explicit `VERIFIED`, `CONFLICT`, `UNVERIFIED`, and `NOT_APPLICABLE` states.
- RELEASE / EDIT / BLOCK / ESCALATE decisions.
- Control Desk persistence and replay protection.
- Session-history retry detection and tool-call loop detection.

## Missing or weak

1. Use-case profiles are implied by task type, not explicitly configurable.
2. Decisions lack policy version, profile, region, and evidence-source attribution.
3. There is no reproducible evaluation corpus or machine-generated report.
4. Human overrides do not become structured feedback events.
5. No held-out evaluation set demonstrates generalization beyond four fixtures.
6. No cost/latency comparison between full Tier 2 and adaptive verification.
7. No dedicated multi-turn/agent evaluation subset.
8. No Trust & Evaluation page.
9. Independent Tier 0 checks are sequential rather than parallel.
10. Embedding/statistical anomaly detection is not implemented and must remain UNVERIFIED.

## Scope decision

The completion pass will implement a deterministic, synthetic evaluation framework and a small policy/profile layer. It will not add live private data, hidden enterprise connectors, fabricated provider output, or unsupported statistical/AI capabilities.
