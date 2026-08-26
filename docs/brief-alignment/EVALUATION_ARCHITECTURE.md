# Evaluation Architecture

```text
evaluation/datasets/*.json
        ↓
normalization + quality checks
        ↓
held-out / development split selection
        ↓
VerificationOrchestrator (offline)
        ↓
predicted decision, state, tier, detections, latency
        ↓
confusion + safety metrics + policy comparison
        ↓
evaluation/results/latest.json
evaluation/reports/latest.md
```

The runner uses the same offline orchestrator and trusted demo resolver used by the product, but excludes demo fixtures. It records source, split, expected labels, predicted labels, and limitations. No external API is required.

## Metrics

The report calculates decision accuracy, macro precision/recall, false release/block rates, escalation rate, verification coverage, tier distribution, critical false release rate, high-impact escalation recall, and unresolved rate. Calibration is reported as `NOT ESTABLISHED` because deterministic risk scores are not probability estimates.

## Trade-off experiment

The runner compares the normal adaptive policy with a synthetic “deep verification” mode by executing an equivalent Tier 2 evidence pass for every eligible case. Timings are local measurements, not production SLAs. Cost is shown only as measured estimated token/cost fields; no savings are fabricated.
