# ControlPlane.ai — Demo Plan

**Version:** 1.0  
**Date:** 2026-08-24  
**Total Demo Duration:** ~5 minutes (competition video) / live demo variable

---

## Demo Philosophy

The demo tells a single continuous story:

> "AI systems are making confident, consequential claims. ControlPlane.ai determines — in milliseconds — whether to trust, fix, block, or escalate each one. Watch verification depth adapt to risk."

Every scenario is run from the **Scenario Simulator** page for reliability.

---

## Pre-Demo Checklist

- [ ] App running (`npm run dev`)
- [ ] Database fresh or seeded with historical fixture data
- [ ] Overview Dashboard shows realistic historical metrics (seeded)
- [ ] All four scenario buttons visible on `/simulate`
- [ ] Browser zoomed to comfortable demo level (125%)
- [ ] No sensitive real data in environment

---

## Scenario A — RELEASE

### Input
```
AI Response:
"Your order #ORD-2847 is confirmed and will be shipped within 2-3 business days 
to your registered address. You will receive a tracking link via email once dispatched."

Context:
  taskType: customer-support
  businessImpact: low
  businessRecords:
    order: { id: "ORD-2847", status: "confirmed", estimatedShipping: "2-3 days" }
```

### Expected Detections
- PII: NONE
- Injection: NONE
- Evidence: ORDER STATUS CONSISTENT (order confirmed matches record)
- Safety: PASS
- Cost: NORMAL

### Expected Risk Scores
```
Performance:  12 (low — no evidence conflict)
Cost:          5 (normal operation)
Responsibility: 8 (no PII, no injection)
Composite:    10
```

### Expected Business Impact
LOW

### Expected Decision
**RELEASE**  
Reason: "All checks passed. Response is grounded, safe, and consistent with business records. Low risk."

### Verification Tier
**Tier 0 only** (demonstrates adaptive verification — no expensive check needed)

### UI Behavior
- Decision badge: green "RELEASE"
- Risk bars: all low (green)
- Verification path: "Tier 0 (fast checks only — 18ms)"
- No detections shown (all clear)
- Evidence: "Order record consistent"

### What the Presenter Says
> "Scenario A is a normal customer service reply. ControlPlane runs Tier 0 checks in 18 milliseconds — PII rules, policy rules, evidence check against the order record. Everything checks out. Decision: RELEASE. No expensive verification was needed. This is Risk-Adaptive Verification in action — the system is fast when it can be."

### Expected Duration
45 seconds

---

## Scenario B — EDIT

### Input
```
AI Response:
"Hi! I can see your account details. Your registered mobile number is +91-98765-43210 
and your email on file is ramesh.kumar@example.com. Your last transaction was on 
August 15, 2026 for ₹2,340."

Context:
  taskType: customer-support
  businessImpact: medium
  businessRecords:
    customer: { id: "CUST-001", name: "Ramesh Kumar" }
```

### Expected Detections
- PII: CRITICAL — Phone number detected (+91-98765-43210)
- PII: CRITICAL — Email address detected (ramesh.kumar@example.com)
- Injection: NONE
- Evidence: CONSISTENT
- Safety: PASS

### Expected Risk Scores
```
Performance:   15 (grounded)
Cost:           5 (normal)
Responsibility: 78 (PII detected)
Composite:     55
```

### Expected Business Impact
MEDIUM

### Expected Decision
**EDIT**  
Reason: "PII detected: phone number and email address in AI response. Safe redaction available. Returning sanitized response."

### Edited Response
```
"Hi! I can see your account details. Your registered mobile number is [PHONE REDACTED] 
and your email on file is [EMAIL REDACTED]. Your last transaction was on 
August 15, 2026 for ₹2,340."
```

### Verification Tier
**Tier 0** (PII regex catches this instantly)

### UI Behavior
- Decision badge: amber "EDIT"
- Side-by-side: Original (red highlights on PII) vs. Sanitized (green, PII replaced)
- Responsibility risk bar: HIGH (amber/red)
- Detection list: "Phone number • Critical" and "Email address • Critical"
- Verification path: "Tier 0 (18ms) — PII detected → EDIT safe"

### What the Presenter Says
> "Scenario B: the AI helpfully includes the customer's phone and email in its reply. ControlPlane catches both in Tier 0 — pure regex, 18 milliseconds. Because we can safely redact this without losing meaning, the decision is EDIT. The original and sanitized versions are shown side by side. The caller receives the clean version. The incident is logged."

### Expected Duration
60 seconds

---

## Scenario C — BLOCK (HERO SCENARIO)

### Input
```
AI Response:
"Great news! Your refund of ₹24,500 has been successfully processed and will 
reflect in your account within 3-5 business days."

Context:
  taskType: financial
  businessImpact: high
  businessRecords:
    refund: {
      customerId: "CUST-4521",
      status: "NOT_PROCESSED",
      requestedAmount: 24500,
      processedAmount: 0,
      processedDate: null
    }
```

### Expected Detections
- PII: NONE
- Injection: NONE  
- Evidence: **CRITICAL CONFLICT**
  - AI claims: "refund processed" 
  - Record shows: status = NOT_PROCESSED, processedAmount = 0
  - Numerical mismatch: claimed ₹24,500, record shows ₹0 processed
- Safety: PASS
- Cost: NORMAL

### Expected Risk Scores
```
Performance:  95 (CRITICAL — evidence conflict on financial claim)
Cost:          5 (normal)
Responsibility: 10 (no PII/injection)
Composite:    92 (high impact amplifier applied)
```

### Expected Business Impact
HIGH (financial + customer trust)

### Expected Decision
**BLOCK**  
Reason: "Critical evidence conflict: AI claims ₹24,500 refund has been processed. Business records show: refund status = NOT_PROCESSED, amount processed = ₹0. Releasing this response would create false customer expectation and financial liability. Blocked pending review."

### Verification Tier
**Tier 2** (full evidence verification)

### UI Behavior
- Decision badge: red "BLOCK" with alert icon
- Evidence panel prominently shows conflict table:
  | Field | AI Claim | Business Record |
  |-------|----------|-----------------|
  | Refund Status | Processed ✓ | NOT PROCESSED ✗ |
  | Amount | ₹24,500 | ₹0 |
- Performance risk bar: CRITICAL (dark red, near 100)
- Verification path shows: "Tier 0 (12ms) → Tier 1 (28ms) → Tier 2: Evidence Check (4ms) → BLOCK"
- AI response text shows with red border/overlay
- "Blocked response will not reach customer" message

### What the Presenter Says
> "This is the hero scenario. The AI is confidently telling a customer their ₹24,500 refund has been processed. But ControlPlane checks the actual business record. The record says: status is NOT_PROCESSED, amount processed is ZERO. This is a direct factual conflict on a high-impact financial transaction. 
>
> ControlPlane escalates to Tier 2 evidence verification — a deterministic lookup, not an LLM guess — and the result is unambiguous. Decision: BLOCK.
>
> The response never reaches the customer. The incident is logged. This is exactly the scenario that breaks customer trust and creates financial liability — and ControlPlane caught it in under 50 milliseconds."

### Expected Duration
90 seconds

---

## Scenario D — ESCALATE

### Input
```
AI Response:
"Based on the candidate's profile, we recommend proceeding with the next interview 
stage. The candidate shows strong technical capabilities and cultural alignment."

Context:
  taskType: hiring
  businessImpact: high
  candidateData: {
    name: "Priya Sharma",
    yearsExperience: 6,
    university: "Regional State University"
  }
  additionalSignals:
    - "SafetyClassifier: potential demographic inference risk (confidence: 0.52)"
    - "PolicyEvaluator: hiring decision requires human review (policy HR-AI-01)"
    - "PerformanceEngine: 'cultural alignment' is ungrounded claim (confidence: 0.48)"
```

### Expected Detections
- PII: Name detected (medium — in permitted hiring context)
- Fairness concern: "cultural alignment" — ungrounded, potential demographic proxy (0.52 confidence)
- Policy violation: HR-AI-01 — hiring decisions require human review
- Performance: "cultural alignment" claim ungrounded (no criteria defined)
- Detector disagreement: SafetyClassifier says RISK, PolicyEvaluator says REVIEW, GroundingChecker says UNCERTAIN

### Expected Risk Scores
```
Performance:  55 (medium — ungrounded claim)
Cost:          5 (normal)
Responsibility: 62 (fairness + policy concern)
Composite:    65 (high impact amplifier)
```

### Expected Business Impact
HIGH (consequential decision, legal/compliance risk)

### Expected Decision
**ESCALATE**  
Reason: "Multiple concerns detected without sufficient confidence for automatic action: (1) 'Cultural alignment' is an ungrounded claim that may proxy for demographic characteristics — confidence 52%. (2) HR policy HR-AI-01 requires human review of AI-assisted hiring decisions. (3) Detectors disagree. Human reviewer must assess before this recommendation is shown to hiring manager."

### Verification Tier
**Tier 1 + Tier 2**

### UI Behavior
- Decision badge: blue "ESCALATE" with person-icon
- "Case sent to Control Desk" notification
- Detector disagreement visualization: stacked bars showing RISK vs. UNCERTAIN vs. REVIEW
- Control Desk badge shows "+1 pending"
- Switching to `/controldesk` shows the case in queue
- Demo: reviewer clicks "Approve Release" or "Confirm Block" to resolve

### What the Presenter Says
> "Scenario D is more subtle. The AI is recommending a candidate for the next hiring stage. ControlPlane detects three things: first, 'cultural alignment' is an ungrounded claim that could proxy for demographic characteristics. Second, company HR policy HR-AI-01 requires human review of AI-assisted hiring decisions. Third, the detectors disagree — confidence is too low for an autonomous block, but too high to release.
>
> Decision: ESCALATE. The case goes to the Control Desk. Here a human reviewer sees the full picture — the AI's response, the detections, the evidence, the reason for escalation. They decide. ControlPlane doesn't pretend it knows the answer when it doesn't. That's responsible AI governance."

### Expected Duration
75 seconds

---

## Demo Flow (Total: ~5 minutes)

| Time | Action |
|------|--------|
| 0:00 | Open Overview Dashboard — show historical metrics, verification tier chart |
| 0:30 | Navigate to Scenario Simulator |
| 0:45 | Run Scenario A (RELEASE) |
| 1:30 | Run Scenario B (EDIT) — show original vs. sanitized |
| 2:30 | Run Scenario C (BLOCK) — show evidence conflict table |
| 4:00 | Run Scenario D (ESCALATE) — then navigate to Control Desk |
| 4:30 | Control Desk: resolve Scenario D as human reviewer |
| 4:50 | Final: show audit trail / decision detail for Scenario C |
| 5:00 | End |

---

## Fallback Plan

If any technical issue occurs:

1. **Refresh page and retry** — all scenarios are stateless from the simulator
2. **Scenario C fixture is embedded** — no database required for the hero scenario
3. **If app fails to start** — pre-recorded demo video is the submission requirement anyway

The demo video should be recorded AFTER all scenarios work perfectly.
