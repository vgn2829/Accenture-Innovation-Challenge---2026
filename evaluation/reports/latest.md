# Evaluation Report

Generated: 2026-08-30T11:16:37.448Z

- Corpus: 600 synthetic cases; held-out: 120
- Accuracy: 1
- False release rate: 0
- False block rate: 0
- High-impact escalation recall: 1
- Verification coverage: 0.875
- Tier distribution: {"tier0":15,"tier1":51,"tier2":54}
- Calibration: NOT ESTABLISHED

## Use-case policy comparison

- customer_support: Tier 1, ESCALATE, UNVERIFIED, budget 100ms
- knowledge_assistant: Tier 1, ESCALATE, UNVERIFIED, budget 250ms
- decision_support: Tier 2, ESCALATE, UNVERIFIED, budget 1000ms

## Limitations

- Synthetic cases are mechanism tests, not prevalence estimates.
- No public dataset is included until exact license and labels are verified.
- Calibration is not established.
- Local latency is not a production SLA.
