# Final Judge Sheet

## Round 2 evidence update

The live prototype now exposes three use-case profiles and a Trust & Evaluation page. The offline runner evaluates 320 synthetic cases with 64 held out: 100% decision accuracy, 0% false release, 0% false block, and 100% high-impact escalation recall on this mechanism corpus. These are not production accuracy claims; calibration is NOT ESTABLISHED and no public data is counted.

## One-sentence pitch

ControlPlane decides how deeply to verify an AI response based on risk, then deterministically RELEASES, EDITS, BLOCKS, or ESCALATES it with an evidence trail.

## What a judge can verify live

- Clean answer: Tier 0 → RELEASE.
- PII answer: Tier 1 → EDIT with redaction.
- Refund contradiction: Tier 2 trusted record → BLOCK.
- Ambiguous/high-impact hiring or financial case: Tier 2 → ESCALATE to Control Desk.
- Detail page shows claim type, impact, evidence state, tier, source evidence, and action.
- Simulator profile selector shows Customer Support, Knowledge Assistant, and Decision Support policy differences.
- Control Desk resolution creates a structured feedback event visible in Trust & Evaluation.

## Honest differentiation

The novel part is the operational composition: adaptive verification depth plus trusted transactional grounding plus four-way action plus a human queue. Regex PII, prompt-injection detection, tracing, and risk dashboards are not novel individually.

## Scores

| Dimension | Score / 5 | Reason |
|---|---:|---|
| Technical innovation | 3 | Coherent runtime composition; mostly known primitives |
| Product innovation | 4 | Clear intervention workflow, not only observability |
| AI innovation | 2 | AI is optional and schema-guarded; core safety is deterministic |
| Architecture innovation | 3 | Adaptive tier policy and trusted evidence boundary are good prototype decisions |
| Demo innovation | 4 | Four actions and the refund contradiction are memorable |
| Business innovation | 3 | Plausible enterprise control-plane wedge, moat not proven |
| Overall differentiation | 3 | Clearly differentiated packaging/workflow, not exceptional defensibility |

## Strongest judge attacks

- “This is guardrails plus a queue.” Answer with the entity-bound trusted evidence and adaptive depth trace; do not claim primitive novelty.
- “Your fairness detector is regex.” Correct answer: the offline screen is heuristic and must be positioned as a conservative prototype gate, not comprehensive fairness intelligence.
- “Your latency claim is arbitrary.” Correct answer: no production SLA is claimed; show measured local load results and the exact environment.
- “What if ControlPlane is wrong?” Correct answer: uncertainty escalates, audit events persist, and human review remains the safety valve; production needs independent auth, durable storage, and calibrated evaluation.

## Winning blockers

Production trust boundaries are incomplete, PII/fairness coverage is narrow, and the core concept can be reproduced by a strong team using existing guardrail and observability components. A winning submission needs stronger measured calibration, a real adapter contract, and a differentiated operational outcome.
