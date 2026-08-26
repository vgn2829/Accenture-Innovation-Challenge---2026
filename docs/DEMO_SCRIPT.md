# ControlPlane.ai — Master Jury Demo Script

## Round 2 final story

Start by selecting a use-case profile in `/simulate` and show the policy metadata changing verification depth and latency budget. Run Scenario C to show Tier 2 trusted evidence and BLOCK, Scenario B for Tier 1 EDIT, and Scenario D for human ESCALATE. Resolve the Control Desk case once to create feedback, then open `/evaluation` to show the held-out synthetic evaluation and explicitly state that its calibration is not established.

**Competition:** Accenture Innovation Challenge 2026  
**Target Duration:** 3 Minutes  
**Narrative Arc:** Failure → Verification → Risk → Decision → Human Control → Business Impact  

---

## Act 1: The Core Problem (0:00 – 0:30)

*(Presenter on Overview Screen: `http://localhost:3000`)*

> "Every enterprise today is deploying LLMs into production customer service, operations, and hiring. But today's guardrails are static and passive — they either monitor logs after mistakes occur or apply dumb regex blocks that break user workflows.
>
> **ControlPlane.ai** is an active **runtime decision layer**. We sit directly between AI models and business systems. When an AI produces a response, ControlPlane evaluates its risk in real time, applies **Risk-Adaptive Verification**, and deterministically decides whether to **RELEASE**, **EDIT**, **BLOCK**, or **ESCALATE**."

*(Presenter clicks **Launch Demo Simulator**)*

---

## Act 2: Risk-Adaptive Verification in Action (0:30 – 1:45)

*(Presenter on Simulator Screen: `http://localhost:3000/simulate`)*

> "Let's demonstrate our signature capability: **Risk-Adaptive Verification**. Verification effort dynamically scales with risk, so you never waste compute or add latency to safe interactions."

### Scenario A — The Sub-Millisecond Pass (Tier 0)
*(Presenter clicks "Run Scenario A")*
> "In Scenario A, an AI confirms an order shipment. ControlPlane runs Tier 0 fast deterministic scans in under 2 milliseconds. Zero PII, zero financial contradictions — the response is immediately **RELEASED**."

### Scenario B — Autonomous Safe Repair (Tier 1)
*(Presenter clicks "Run Scenario B")*
> "In Scenario B, customer support inadvertently leaks a customer's phone number and email address. ControlPlane catches the pattern, routes to Tier 1, and chooses **EDIT** — automatically redacting sensitive PII while preserving the helpful answer."

### Scenario C — The ₹24,500 Dispute Block (Tier 2 Ground Truth)
*(Presenter clicks "Run Scenario C")*
> "Now, our hero scenario. A customer asks about a disputed ₹24,500 refund. The AI model hallucinates and claims: *'Your refund of ₹24,500 has been processed successfully.'*
>
> Because this is a high-impact financial claim, ControlPlane escalates to **Tier 2 Deep Grounding**. It checks our core database, finds that the refund was actually **REJECTED**, flags an irreconcilable factual contradiction, and **BLOCKS** the response. The customer is protected, and the enterprise avoids liability."

*(Presenter clicks "Inspect Full Decision Audit" to show the 4-pillar risk breakdown and Tier 2 stepper at `/decisions/[id]`)*

---

## Act 3: Human-in-the-Loop Control Desk (1:45 – 2:30)

*(Presenter navigates back to `/simulate` and runs Scenario D, then clicks "Open Control Desk")*

> "What happens when an AI generates a high-liability recommendation with policy ambiguity?
>
> In Scenario D, an AI hiring evaluator recommends prioritizing specific demographic cohorts. ControlPlane flags a fairness concern and executes an **ESCALATE** decision, routing the case directly to the **Human Control Desk**."

*(Presenter selects the case, types note: 'Demographic bias confirmed. Re-routed to recruitment lead.', and clicks **Confirm Block**)*

> "Here on the Control Desk, a supervisor inspects the exact evidence, sees the policy infraction, and issues an authoritative override. The case resolves instantly and logs a tamper-evident audit record."

---

## Act 4: Enterprise Value & Wrap-up (2:30 – 3:00)

*(Presenter returns to Overview Screen: `http://localhost:3000`)*

> "Returning to our executive dashboard, all actions are reflected live across our metrics: decision distribution, verification tier efficiency, and prevented token waste.
>
> ControlPlane.ai transforms AI governance from an uncertain liability into a deterministic, risk-adaptive competitive advantage. Thank you."
