# Final Brief Scorecard

| Requirement | Implementation | Live demo evidence | Evaluation evidence | Status |
|---|---|---|---|---|
| Use-case-specific risk tolerance | Three typed profiles with budgets | Simulator profile selector | Policy comparison report | VERIFIED |
| Risk-adaptive verification | Policy-selected Tier 0/1/2 path | A/B/C/D path stepper | Tier distribution and adaptive/deep run | VERIFIED |
| Ground truth unavailable | Trusted resolver returns UNVERIFIED | Unsupported refund/order | Held-out unsupported claims | VERIFIED |
| False release/block measurement | Evaluation runner metrics | Decision detail | Synthetic held-out metrics | PARTIAL |
| Multi-turn/agent risk | Session retry and tool loop detectors | Control path available through API | Agent-loop corpus subset | PARTIAL |
| Geography variation | Region field and policy attribution | Detail shows region | Policy unit test | PARTIAL |
| Detection techniques | Rules, PII, evidence, optional semantic evaluator | A/B/C/D | Synthetic detector cases | PARTIAL |
| AI-as-judge | Optional OpenAI semantic evaluator | Offline path is default | Schema fallback test | PARTIAL |
| Inline/pre-response gate | `/api/analyze` runtime boundary | Simulator | API tests | VERIFIED |
| Parallel checks | Tier 0 checks scheduled together | Not visible directly | Timing recorded | PARTIAL |
| Governance/audit | Policy/profile/source fields in decisions | Detail and Control Desk | DB persistence tests | VERIFIED |
| Human feedback loop | Control Desk resolution creates FeedbackEvent | Resolve case | Feedback API/dashboard | VERIFIED |
| Trust & Evaluation surface | `/evaluation` page | Navigation and overview card | Generated evaluation artifact | VERIFIED |
| Public/open data | Candidate registry only | None | No public metrics counted | UNVERIFIED |
| Production security/compliance | Explicit limitations documented | Not claimed | Not evaluated as production | UNVERIFIED |
