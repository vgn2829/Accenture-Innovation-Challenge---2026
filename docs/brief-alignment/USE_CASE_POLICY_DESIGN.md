# Use-Case Policy Design

Profiles are reusable configuration, not UI-only labels.

| Profile | Default impact | Latency budget | Grounding | PII | Uncertainty |
|---|---|---:|---|---|---|
| Customer Support | medium | 100ms | preferred; required for material financial/order claims | redact | escalate high impact |
| Knowledge Assistant | medium | 250ms | required for material factual claims | redact | escalate material uncertainty |
| Decision Support | high | 1000ms | required | redact | escalate; fairness screen required |

Regions are configuration inputs (`IN`, `EU`, etc.) that can tighten a profile. They do not constitute legal or regulatory compliance. The policy registry exposes `policyVersion`, `profile`, `region`, minimum tier, required evidence, uncertainty behavior, permitted actions, and latency budget.

Default mapping preserves the current demo: customer-support/financial → Customer Support, general → Knowledge Assistant, hiring → Decision Support.
