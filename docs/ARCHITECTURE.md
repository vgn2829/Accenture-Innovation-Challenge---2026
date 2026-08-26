# ControlPlane.ai — Architecture

## Round 2 alignment architecture

```text
AI APPLICATION
      ↓
CONTROLPLANE EDGE (/api/analyze)
      ↓
USE-CASE / REGION PROFILE
      ↓
CLAIM CLASSIFICATION + BUSINESS IMPACT FLOOR
      ↓
VERSIONED VERIFICATION POLICY
      ↓
CHEAPEST SUFFICIENT VERIFICATION
   ┌──────────┼──────────┐
   ↓          ↓          ↓
 TIER 0     TIER 1     TIER 2
 rules      policy     trusted evidence
   └──────────┼──────────┘
      ↓
VERIFICATION STATE → RISK FUSION → RELEASE / EDIT / BLOCK / ESCALATE
      ↓                                      ↓
  audit + evaluation                      CONTROL DESK
                                             ↓
                                      FEEDBACK EVENT
                                             ↓
                                    held-out evaluation
```

The inline decision path is deterministic and offline-capable. Evaluation and feedback analytics are separate from the primary demo path; no live provider is required.

**Version:** 1.0  
**Date:** 2026-08-24

---

## Overview

ControlPlane.ai is implemented as a single Next.js application with TypeScript, using API Routes for backend logic and React Server/Client Components for the frontend. All persistence uses SQLite via better-sqlite3.

---

## Component Map

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js App Router, React, Tailwind CSS)              │
│                                                                  │
│  /           Overview Dashboard     Metrics, trends, alerts      │
│  /decisions  Live Decisions Feed    Recent decisions stream      │
│  /decisions/[id]  Decision Detail  Full audit + evidence         │
│  /controldesk     Control Desk      Escalated cases queue        │
│  /simulate        Scenario Sim      Demo mode with presets       │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP (internal)
┌─────────────────────────────▼────────────────────────────────────┐
│  API LAYER (Next.js API Routes)                                  │
│                                                                  │
│  POST /api/analyze              Main analysis endpoint           │
│  GET  /api/decisions            Paginated decision list          │
│  GET  /api/decisions/[id]       Full decision detail             │
│  GET  /api/metrics              Dashboard aggregate metrics      │
│  POST /api/controldesk/[id]     Human reviewer action           │
│  POST /api/simulate/[scenario]  Demo mode trigger               │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  ORCHESTRATION LAYER                                             │
│                                                                  │
│  VerificationOrchestrator                                        │
│  ├── runTier0() — parallel, always runs                          │
│  ├── runTier1() — runs if Tier 0 risk > LOW                      │
│  └── runTier2() — runs if Tier 1 risk > MEDIUM or HIGH IMPACT    │
│                                                                  │
│  Each tier returns: DetectionResult[]                            │
│  DetectionResult = { type, severity, evidence, detector }        │
└──────────┬────────────────────┬───────────────┬─────────────────┘
           │                    │               │
┌──────────▼──────┐  ┌──────────▼─────┐  ┌──────▼──────────────┐
│ PERFORMANCE     │  │ COST ENGINE     │  │ RESPONSIBILITY      │
│ ENGINE          │  │                 │  │ ENGINE              │
│                 │  │ TokenAnalyzer   │  │                     │
│ GroundingChkr   │  │  - input tokens │  │ PIIDetector         │
│  - citation     │  │  - output tok   │  │  - regex patterns   │
│  - semantic     │  │  - total cost   │  │  - phone, email     │
│    similarity   │  │                 │  │  - credit card      │
│                 │  │ RetryDetector   │  │  - SSN patterns     │
│ ConsistencyChkr │  │  - retry count  │  │  - custom patterns  │
│  - self-consist │  │  - same calls   │  │                     │
│                 │  │                 │  │ InjectionDetector   │
│ EvidenceVerif   │  │ LoopDetector    │  │  - override patterns│
│  - DB lookup    │  │  - cycle detect │  │  - instruction embed│
│  - claim vs     │  │  - budget check │  │                     │
│    source truth │  │                 │  │ SafetyClassifier    │
│                 │  │ Inputs:         │  │  - harm categories  │
│ Inputs:         │  │  session meta   │  │  - unsafe content   │
│  response text  │  │  token counts   │  │                     │
│  context docs   │  │  model id       │  │ PolicyEvaluator     │
│  business recs  │  │                 │  │  - hard rules       │
│                 │  │ Outputs:        │  │  - soft rules       │
│ Outputs:        │  │  CostSignal[]   │  │                     │
│  PerfSignal[]   │  │                 │  │ Inputs:             │
│                 │  └─────────────────┘  │  response text      │
└─────────────────┘                       │  context            │
                                          │                     │
                                          │ Outputs:            │
                                          │  ResponsSignal[]    │
                                          └─────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  RISK FUSION                                                     │
│                                                                  │
│  Inputs: PerfSignal[], CostSignal[], ResponsSignal[]             │
│          + businessImpact (low/medium/high/critical)             │
│                                                                  │
│  Outputs:                                                        │
│    performanceScore: 0-100                                       │
│    costScore: 0-100                                              │
│    responsibilityScore: 0-100                                    │
│    compositeRisk: 0-100  (weighted by businessImpact)            │
│    dominantSignals: DetectionResult[]  (top signals)             │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  DECISION ENGINE                                                 │
│                                                                  │
│  Input: RiskFusionResult + business context                      │
│                                                                  │
│  Rules (evaluated in priority order):                           │
│  1. Hard BLOCK conditions (PII + CRITICAL, confirmed false claim)│
│  2. Hard ESCALATE conditions (HIGH impact + uncertain)           │
│  3. EDIT conditions (PII + EDIT safe, formatting repair)         │
│  4. RELEASE conditions (low risk, policy clear)                  │
│  5. Default: ESCALATE (when uncertain)                           │
│                                                                  │
│  Output: Decision { action, reason, confidence, editedResponse } │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  DATA LAYER (SQLite via better-sqlite3)                          │
│                                                                  │
│  Tables:                                                         │
│  decisions         Full audit record per response                │
│  detections        Individual detector results                   │
│  evidence          Evidence items attached to detections         │
│  control_desk      Escalated items + reviewer actions            │
│  metrics_cache     Precomputed dashboard metrics                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Critical Request Path (Synchronous)

```
POST /api/analyze
  → VerificationOrchestrator.run()
    → Tier 0 [parallel, ~5-20ms]
      → PIIDetector.scan()
      → InjectionDetector.scan()
      → LoopDetector.check()
      → TokenAnalyzer.analyze()
      → PolicyEvaluator.hardRules()
    → Risk assessment
    → If risk > LOW:
      → Tier 1 [sequential, ~20-100ms]
        → GroundingChecker.check()
        → SafetyClassifier.classify()
    → If risk > MEDIUM or businessImpact HIGH:
      → Tier 2 [~10-50ms for in-memory evidence lookup]
        → EvidenceVerifier.verify()
    → RiskFusion.compute()
    → DecisionEngine.decide()
    → AuditLog.record()
  → Response: DecisionResult
```

**Total target latency:**
- Tier 0 only (RELEASE): 20-50ms
- Tier 0+1 (EDIT/low risk): 50-150ms  
- Tier 0+1+2 (BLOCK/ESCALATE): 50-200ms

Note: For demo fixtures, latency is simulated with realistic values. For live analysis, actual elapsed time is measured.

---

## Async Path (Non-blocking)

These operations occur off the request path:

- Drift monitoring aggregation (runs on cron or demand)
- Dashboard metrics cache update (runs after each decision)
- Long-term reliability trend computation (runs on demand)
- Evaluation dataset export (manual trigger)

---

## Component Failure Behavior

| Component | Failure Mode | Behavior |
|-----------|-------------|----------|
| PIIDetector | Error | Log + treat as UNKNOWN → ESCALATE |
| EvidenceVerifier | Data not found | Return UNCERTAIN signal, not FALSE |
| Decision Engine | Logic error | Default to ESCALATE (fail-safe) |
| SQLite | Write failure | Log to file, continue (audit gap documented) |
| External AI API | Unavailable | Use fixture response (demo mode) |
| Frontend | Component error | Error boundary shows fallback UI |

**Principle: Always fail toward caution (ESCALATE) not toward RELEASE.**

---

## Technology Choices

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Full-stack TypeScript, API Routes, SSR, single deployment |
| Language | TypeScript | Type safety, engine interfaces, competition code quality |
| Styling | Tailwind CSS | Rapid enterprise UI, no CSS debt |
| Database | SQLite (better-sqlite3) | Zero config, ships with repo, synchronous, sufficient for prototype |
| Testing | Vitest | Fast, TypeScript-native, no config overhead |
| Linting | ESLint + Prettier | Standard TS/Next.js setup |
| Icons | Lucide React | Consistent, accessible icon set |
| Charts | Recharts | Lightweight, React-native charting |
| AI Provider | OpenAI API (GPT-4o-mini for Tier 2) | Only used at Tier 2 for deep eval; fallback to fixtures |

---

## Model Abstraction

```typescript
interface ModelProvider {
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResult>
  getMetadata(): ProviderMetadata
  estimateCost(tokens: TokenUsage): CostEstimate
}

// Implementations
class OpenAIProvider implements ModelProvider { ... }
class FixtureProvider implements ModelProvider { ... }  // Demo mode
```

Only one real provider is needed. Fixture provider enables demo without API keys.

---

## Security Architecture

- All API keys in environment variables only
- `.env.example` with safe placeholders committed
- `.env` never committed (gitignore)
- All user inputs sanitized before SQL insertion (parameterized queries only)
- Response content treated as untrusted until evaluated
- No dynamic code execution from model output
- XSS: React's JSX escaping; no `dangerouslySetInnerHTML` with untrusted content
- Rate limiting: 100 req/min per IP (middleware)
- Request size limit: 50KB max payload
- Audit log: append-only (no delete API)

---

## Data Flow Diagram (Scenario C — BLOCK)

```
Input:
  response: "Your ₹24,500 refund has been processed."
  businessRecord: { refundStatus: "NOT_PROCESSED", amount: 0 }
  businessImpact: HIGH

Tier 0 (parallel, 15ms):
  PII: no match
  Policy: "refund" keyword → flag for evidence check
  Tokens: normal
  Loop: none

Tier 1 (30ms):
  Grounding: no source document conflict detected
  Safety: PASS

Tier 2 (evidence lookup, 2ms):
  EvidenceVerifier.verify():
    claim: "refund processed"
    claimedAmount: 24500
    record: refundStatus=NOT_PROCESSED
    → CONFLICT DETECTED
    → evidence: { claimVsRecord: { claimed: "processed", actual: "not processed" } }
    → performanceSignal: { severity: CRITICAL, type: "FACTUAL_CONFLICT", evidence: [...] }

RiskFusion:
  performanceScore: 95 (factual conflict = high)
  costScore: 5
  responsibilityScore: 10
  businessImpact: HIGH (financial + customer)
  compositeRisk: 92

DecisionEngine:
  Rule: performanceScore >= 90 AND businessImpact HIGH AND evidenceConflict
  → BLOCK
  → reason: "Factual conflict detected: AI claims refund processed; business record shows not processed."

AuditEvent:
  { requestId, timestamp, model, risk, businessImpact, detections, evidence, decision, reason, verificationTier: 2, latencyMs: 47 }
```
