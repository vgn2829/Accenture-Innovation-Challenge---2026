# ControlPlane.ai — Roadmap

**Version:** 1.0  
**Date:** 2026-08-24

---

## Current: Round 2 Prototype (August 2026)

The prototype demonstrates the ControlPlane thesis with:
- Four demo scenarios (RELEASE / EDIT / BLOCK / ESCALATE)
- Three risk engines (Performance, Cost, Responsibility)
- Risk-Adaptive Verification (Tier 0 / 1 / 2)
- Human Control Desk
- Audit trail
- Scenario simulator

**Scope: Controlled demo environment, fictional data, single deployment**

---

## Round 3 Preparation (September 2026)

If shortlisted:
- All team members study DECISION_LOG.md (every question the AI interviewer might ask)
- Prepare answers for: architecture rationale, AI usage justification, scalability path, limitation acknowledgments
- Prepare live demo on a fresh environment

---

## Hypothetical Production Roadmap (Future)

> These are ideas for a production product, NOT part of the Round 2 submission.  
> Placed here to demonstrate strategic thinking for Round 3 discussion.

### Phase 1 — Production Foundation
- Real authentication (OAuth / OIDC)
- Multi-tenant PostgreSQL
- API key management per tenant
- Real-time WebSocket decision feed
- Production deployment (Vercel / AWS)

### Phase 2 — Engine Maturity
- NER-based PII detection (beyond regex) — addresses unstructured PII
- Real cost API integration (OpenAI, Anthropic billing APIs)
- Semantic similarity grounding (sentence-transformers)
- Adversarially-trained lightweight safety classifier
- Production agent loop detection (session telemetry)

### Phase 3 — Enterprise Features
- Policy-as-code (YAML-based business rules)
- Compliance reporting (EU AI Act audit export)
- SIEM integration (Splunk, Datadog)
- Slack/Teams Control Desk notifications
- SLA monitoring for review queue
- Custom risk weights per tenant/use-case

### Phase 4 — Intelligence
- Risk score calibration (ground truth feedback loop)
- Model reliability history (per-model failure rate)
- Drift monitoring (automatic alerts on behavioral shifts)
- Cost anomaly detection (statistical process control)
- Fairness benchmarking (automated bias testing)
- Multi-model routing (route to cheaper model when safe)

---

## Technology Evolution Path

| Current Prototype | Production |
|---------------------|------------|
| SQLite | PostgreSQL (RDS / Supabase) |
| In-memory rate limiting | Redis / API Gateway |
| Regex PII detection | Presidio + NER ensemble |
| Fixture evidence records | Live database integration |
| Next.js API Routes | Dedicated microservices (optional) |
| Single-node | Kubernetes / auto-scale |
| OpenAI only | Multi-provider (Anthropic, Google, Azure) |

---

## See Also

`docs/FUTURE_IDEAS.md` — Feature ideas that are out of scope for Round 2 but worth preserving.
