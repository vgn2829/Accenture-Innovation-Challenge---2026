# ControlPlane.ai — MASTER PLAN
**Version:** 1.0  
**Date:** 2026-08-24  
**Competition:** Accenture Innovation Challenge 2026, Round 2  
**Deadline:** August 30, 2026 (06:29 PM CUT)  

---

## Executive Summary

ControlPlane.ai is an **AI decision layer** that sits between AI systems and users/business processes. It intercepts every AI response, applies tiered risk verification, and issues one of four deterministic decisions: RELEASE, EDIT, BLOCK, or ESCALATE.

The central innovation is **Risk-Adaptive Verification**: verification effort scales with response risk and business impact, making enterprise AI governance practical without prohibitive latency or cost.

We are building a working prototype that demonstrates this thesis convincingly across four real scenarios, backed by genuine technical implementation, a human Control Desk, and a complete audit trail.

---

## Goals

The Round 2 prototype must prove:

1. **Risk-Adaptive Verification works** — not every response gets expensive verification; the system intelligently routes based on risk.
2. **Three Engines are real** — Performance (reliability), Cost (waste), and Responsibility (safety/PII/policy) engines are implemented and produce distinct signals.
3. **Decision Engine is explainable** — every RELEASE/EDIT/BLOCK/ESCALATE decision is accompanied by scored risk signals, evidence, and a human-readable reason.
4. **Human Control Desk is functional** — escalated cases appear in a real review UI where a human can approve, override, or add notes.
5. **Four demo scenarios are deterministic** — the demo can be run reliably without external model dependency.
6. **Architecture is defensible** — all design decisions are documented and justifiable in Round 3 AI-led discussion.

---

## Non-Goals (Round 2)

These will NOT be built:

- Multi-tenant SaaS platform
- Real user authentication (auth simulation is sufficient)
- Production database (SQLite is sufficient)
- Real-time streaming of thousands of events
- Native mobile app
- Provider cost API integration (estimated cost model is acceptable, labeled as estimate)
- Full LLM evaluation benchmark suite
- Kubernetes/cloud deployment
- Advanced ML model training
- Full GDPR compliance implementation

All non-goals are documented in `FUTURE_IDEAS.md`.

---

## User Journey

```
┌─────────────────────────────────────────────────────────┐
│  AI System generates a response                         │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ControlPlane API receives response + context           │
│  (model, task type, source data, session metadata)      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 0 — Parallel fast checks (always runs)            │
│  • PII regex scan          • Schema validation          │
│  • Secret detection        • Hard policy rules          │
│  • Token count             • Loop detection             │
│  • Basic safety patterns   • Cost telemetry             │
└────────────────────────┬────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        │  Risk score after Tier 0?       │
        │  LOW → Likely RELEASE           │
        │  MEDIUM → Tier 1               │
        │  HIGH → Tier 2                 │
        └────────────────┬────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 1 — Lightweight verification (conditional)        │
│  • Semantic grounding check  • Quality evaluation       │
│  • Policy classification     • Fairness signals         │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 2 — Deep verification (high risk only)            │
│  • Evidence lookup against business records             │
│  • Strong evaluator model                               │
│  • Deterministic execution verification                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Risk Fusion                                            │
│  Performance Score + Cost Score + Responsibility Score  │
│  × Business Impact Weight                               │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Decision Engine                                        │
│  RELEASE / EDIT / BLOCK / ESCALATE                      │
└────────────────────────┬────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        │                                 │
   RELEASE/EDIT/BLOCK            ESCALATE → Control Desk
        │                                 │
        ↓                                 ↓
  Audit Event                    Human Reviewer UI
  Logged                         → Approve / Override / Note
```

---

## Architecture (High-Level)

```
Frontend (Next.js)
├── Overview Dashboard
├── Live Decisions Feed
├── Decision Detail View
├── Control Desk
└── Scenario Simulator

API Layer (Next.js API Routes)
├── POST /api/analyze          ← Main analysis endpoint
├── GET  /api/decisions        ← List recent decisions
├── GET  /api/decisions/[id]   ← Decision detail
├── GET  /api/metrics          ← Dashboard metrics
├── POST /api/controldesk/[id] ← Human reviewer action
└── POST /api/simulate/[scenario] ← Demo mode

Orchestration Layer
├── VerificationOrchestrator
│   ├── Tier 0 runner (parallel)
│   ├── Tier 1 runner (conditional)
│   └── Tier 2 runner (conditional)
└── RiskFusion

Engines
├── PerformanceEngine
│   ├── GroundingChecker
│   ├── ConsistencyChecker
│   └── EvidenceVerifier       ← Hero scenario
├── CostEngine
│   ├── TokenAnalyzer
│   ├── RetryDetector
│   └── LoopDetector
└── ResponsibilityEngine
    ├── PIIDetector            ← Regex + pattern rules
    ├── InjectionDetector
    ├── SafetyClassifier
    └── PolicyEvaluator

Decision Engine
├── RiskFusion
├── BusinessImpactWeighter
└── DecisionRouter             ← RELEASE/EDIT/BLOCK/ESCALATE

Data Layer
├── SQLite (audit log, decisions, control desk queue)
└── Fixture Store              ← Demo mode fixtures

Demo Mode
├── Scenario fixtures (A/B/C/D)
└── Deterministic response override
```

---

## Milestones

### M1 — Project Foundation (Day 1)
- [ ] Next.js project initialized with TypeScript + Tailwind
- [ ] Directory structure established
- [ ] Database schema created (SQLite)
- [ ] Environment configuration set up
- [ ] All planning docs exist
- **Gate:** `npm run dev` shows blank app without errors

### M2 — Core Engines (Day 1–2)
- [ ] Engine interfaces defined (TypeScript)
- [ ] PII detector (regex-based, Tier 0)
- [ ] Injection pattern detector (Tier 0)
- [ ] Token/cost estimator (Tier 0)
- [ ] Loop detector (Tier 0)
- [ ] Evidence verifier (Tier 2) — hero scenario
- [ ] Unit tests for all detectors
- **Gate:** 90% test pass rate on unit tests

### M3 — Decision Engine + Risk Fusion (Day 2)
- [ ] Risk scoring model implemented
- [ ] Business impact weighter
- [ ] Decision router (RELEASE/EDIT/BLOCK/ESCALATE)
- [ ] Orchestration (Tier 0/1/2 routing)
- [ ] Integration tests for all four decisions
- **Gate:** All four scenario outcomes deterministic

### M4 — API Layer (Day 2–3)
- [ ] POST /api/analyze endpoint
- [ ] GET /api/decisions endpoint
- [ ] GET /api/decisions/[id] endpoint
- [ ] GET /api/metrics endpoint
- [ ] POST /api/controldesk/[id] endpoint
- [ ] POST /api/simulate/[scenario] endpoint
- [ ] Audit event logging
- **Gate:** All API routes return correct responses with curl

### M5 — Frontend (Day 3–4)
- [ ] Overview Dashboard
- [ ] Live Decisions Feed
- [ ] Decision Detail view
- [ ] Control Desk UI
- [ ] Scenario Simulator
- **Gate:** All four demo scenarios runnable from browser without errors

### M6 — Polish + Demo Mode (Day 4–5)
- [ ] Fixture data for all scenarios
- [ ] Deterministic demo mode
- [ ] UI visual QA
- [ ] Accessibility audit (contrast, labels)
- [ ] Error states implemented
- **Gate:** Demo run by fresh person without explanation

### M7 — Documentation + Packaging (Day 5)
- [ ] README complete
- [ ] All docs complete
- [ ] .env.example created
- [ ] Tests passing
- [ ] Build succeeds
- [ ] Scenario regression suite passes
- **Gate:** All 10 quality gates satisfied

---

## Definition of Done

The prototype is complete when:

1. `npm install && npm run dev` works on a clean machine with only a .env file
2. All four demo scenarios produce their expected decisions
3. Control Desk shows escalated items and allows human actions
4. Every decision has a complete audit event in the database
5. `npm test` reports ≥90% pass rate
6. `npm run build` succeeds with no errors
7. `npm run lint` reports zero errors
8. `npx tsc --noEmit` reports zero errors
9. README contains all required competition sections
10. All 10 quality gates are documented as passed in IMPLEMENTATION_STATUS.md

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| External LLM API unavailable during demo | HIGH | HIGH | All demo scenarios use fixture data; no live API required |
| Demo takes too long (>5 min) | MEDIUM | HIGH | Scenario simulator runs instantly via fixtures |
| PII regex misses edge cases | MEDIUM | MEDIUM | Use well-tested regex patterns (E.164 phone, RFC 5322 email, Luhn check) |
| Evidence verification too slow | MEDIUM | HIGH | Evidence check is in-memory lookup against fixture data; <1ms |
| SQLite corruption | LOW | MEDIUM | DB is regenerated on startup from migrations; data is demo-only |
| TypeScript errors block build | MEDIUM | HIGH | Run tsc after every milestone; fix immediately |
| Frontend too complex to build in time | MEDIUM | HIGH | Build minimal versions first; polish after all scenarios work |
| Competition rule change (unknown requirements) | LOW | HIGH | Research documented; flexible architecture can adapt |
| Round 3 AI discussion catches implementation gaps | MEDIUM | HIGH | DECISION_LOG.md answers every architectural question |

---

## Decision Gates

### After M1: Foundation
- Does `npm run dev` start without errors?
- Are all planning docs created?

### After M2: Engines
- Do unit tests pass for all detectors?
- Are PII patterns catching phone, email, credit card, SSN?
- Does evidence verifier correctly detect refund conflict?

### After M3: Decision Engine
- Does Scenario C (BLOCK) produce BLOCK decision deterministically?
- Does Scenario B (EDIT) produce EDIT + redacted output?
- Does Scenario A (RELEASE) produce RELEASE?
- Does Scenario D (ESCALATE) produce ESCALATE?

### After M4: API
- Do all API routes return 200 with correct schema?
- Does audit log record events?

### After M5: Frontend
- Can a judge understand the product in 20 seconds?
- Does Control Desk show escalated items?

### After M6: Polish
- Does the demo run without a presenter explaining it?
- Are all four outcomes visually distinct?

### After M7: Package
- Does `npm run build` succeed?
- Is README competition-ready?
- Are all 10 gates passed?
