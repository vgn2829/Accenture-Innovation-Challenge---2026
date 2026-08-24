# ControlPlane.ai — Product Specification

**Version:** 1.0  
**Date:** 2026-08-24

---

## Target User

**Primary:** Enterprise AI operations teams, AI compliance officers, and ML platform engineers responsible for ensuring AI systems deployed in business-critical workflows behave safely, correctly, and cost-effectively.

**Secondary:** Business stakeholders who need visibility and control over AI decisions that affect customers or finances.

**Demo audience:** Accenture Innovation Challenge judges (technical + business).

---

## Core User Workflow

1. An AI system generates a response (customer support, financial ops, hiring, etc.)
2. The response is submitted to ControlPlane's `/api/analyze` endpoint with context
3. ControlPlane runs tiered verification in milliseconds
4. ControlPlane returns a decision: RELEASE, EDIT, BLOCK, or ESCALATE
5. If EDIT: returns the corrected/redacted response
6. If ESCALATE: the case appears in the Control Desk for human review
7. The human reviewer approves, overrides, or blocks the escalated case
8. Every action is logged in the audit trail

---

## Main Screens

### 1. Overview Dashboard (`/`)
**Purpose:** Bird's-eye view of AI system health and risk state.

**Displays:**
- Total AI interactions (today / 7d / 30d)
- Decision breakdown: RELEASE / EDIT / BLOCK / ESCALATE counts + percentages
- Risk trend chart (rolling 24h)
- Top risk signals today
- Cost/waste indicators (tokens saved, retries blocked)
- Active alerts (escalated items pending review)
- Verification tier distribution (shows adaptive nature — most responses are Tier 0/1)

### 2. Live Decisions Feed (`/decisions`)
**Purpose:** Real-time stream of processed AI responses.

**Each item shows:**
- Decision badge (RELEASE/EDIT/BLOCK/ESCALATE) with color + icon
- Truncated AI response preview
- Dominant risk signal
- Risk score bar
- Model identifier
- Task type
- Verification tier used
- Latency (ms)
- Timestamp
- Click to view detail

**Filters:** All / RELEASE / EDIT / BLOCK / ESCALATE / High Risk

### 3. Decision Detail (`/decisions/[id]`)
**Purpose:** Full audit record for one AI response decision.

**Displays:**
- Original AI response (full text)
- Edited response (if decision = EDIT)
- Risk dimension scores (Performance / Cost / Responsibility bars)
- Business impact level
- Detection list with severity badges
- Evidence panel (evidence items that informed the decision)
- Verification path (which tiers were executed, in what order, with latency)
- Decision box: action + reason + confidence
- Audit event JSON (collapsible)

### 4. Control Desk (`/controldesk`)
**Purpose:** Human review queue for escalated cases.

**Queue view:** All pending escalated items with priority, risk score, reason for escalation

**Case review view:**
- Full AI response
- Risk signals + evidence
- Why it was escalated (reason + detector disagreement info)
- Business context
- Action buttons:
  - ✅ Approve Release — reviewer decides it is safe to release
  - ✏️ Approve with Edit — reviewer specifies edits
  - 🚫 Confirm Block — reviewer confirms blocking
  - 📝 Add Note — add a reviewer note (always available)
- Reviewer action is recorded in audit trail

### 5. Scenario Simulator (`/simulate`)
**Purpose:** Reliable demonstration of all four decision outcomes.

**UI:**
- Four scenario cards (A: RELEASE, B: EDIT, C: BLOCK, D: ESCALATE)
- Each card shows: scenario description, input context, expected outcome
- "Run Scenario" button → instantly processes the scenario
- Results displayed inline: decision badge, risk scores, evidence, verification path
- "View Full Detail" → links to full Decision Detail page

---

## Inputs

Per `/api/analyze` request:

```typescript
interface AnalyzeRequest {
  requestId?: string           // UUID, generated if not provided
  model: string                // e.g., "gpt-4o", "claude-3-sonnet"
  taskType: TaskType           // "customer-support" | "financial" | "hiring" | "general"
  aiResponse: string           // The AI's output to analyze
  context?: {
    retrievedDocs?: string[]   // Documents used for RAG
    sessionHistory?: Message[] // Previous turns in conversation
    businessRecords?: Record<string, unknown>  // Structured business data for evidence check
    userId?: string
    customerId?: string
  }
  businessImpact?: "low" | "medium" | "high" | "critical"
  demoMode?: boolean           // If true, skip real detection and use fixtures
  scenario?: ScenarioId        // "A" | "B" | "C" | "D" — for demo mode
}
```

---

## Outputs

Per `/api/analyze` response:

```typescript
interface AnalyzeResponse {
  requestId: string
  decision: "RELEASE" | "EDIT" | "BLOCK" | "ESCALATE"
  decisionReason: string
  confidence: number           // 0-100
  
  risk: {
    performance: number        // 0-100
    cost: number               // 0-100
    responsibility: number     // 0-100
    composite: number          // 0-100
    businessImpact: string
  }
  
  detections: Detection[]      // All signals found
  evidence: Evidence[]         // Supporting evidence
  
  verificationTier: 0 | 1 | 2
  latencyMs: number
  
  editedResponse?: string      // Only when decision = EDIT
  
  auditEvent: AuditEvent       // Full structured record
}
```

---

## Risk Dimensions

### Performance Risk (0–100)
Measures reliability of the AI response.

| Signal | Tier | Weight |
|--------|------|--------|
| Factual conflict (evidence lookup) | 2 | 0.40 |
| Citation invalid | 1 | 0.25 |
| Consistency failure (multi-sample) | 1 | 0.20 |
| High model uncertainty | 0 | 0.10 |
| Schema validation failure | 0 | 0.05 |

### Cost Risk (0–100)
Measures operational waste.

| Signal | Tier | Weight |
|--------|------|--------|
| Agent loop detected | 0 | 0.40 |
| Retry count > threshold | 0 | 0.25 |
| Context token bloat | 0 | 0.20 |
| Expensive model for trivial task | 0 | 0.10 |
| Redundant tool calls | 0 | 0.05 |

### Responsibility Risk (0–100)
Measures safety and compliance.

| Signal | Tier | Weight |
|--------|------|--------|
| PII detected in output | 0 | 0.40 |
| Prompt injection indicator | 0 | 0.30 |
| Hard policy violation | 0 | 0.20 |
| Unsafe content category | 1 | 0.10 |

---

## Detection Mechanisms

### PII Detection (Tier 0, Deterministic)
Patterns (regex-based):
- Email addresses: RFC 5322 pattern
- Phone numbers: E.164 + common Indian formats (+91, local)
- Credit card numbers: Luhn-validated 13-19 digit sequences
- Aadhaar numbers: 12-digit Indian ID pattern
- PAN numbers: Indian tax ID format (AAAA9999A)
- Indian bank account numbers: common format patterns
- Dates of birth when adjacent to name-like tokens

### Injection Detection (Tier 0, Deterministic)
Patterns:
- "Ignore previous instructions"
- "You are now" + role override
- "Forget your" + system/context
- Nested instruction patterns
- Jailbreak markers

### Evidence Verification (Tier 2, Deterministic)
- Extracts factual claims from AI response (amounts, statuses, dates)
- Looks up corresponding business record fields
- Checks numerical consistency (claimed amount vs. record amount)
- Checks status consistency (claimed status vs. record status)

### Loop Detection (Tier 0, Rule-based)
- Same tool call issued > 3 times in session
- Session cost exceeds configured budget
- Response count exceeds max turns for task type

---

## Decision Rules

```
Priority 1 — BLOCK (any of):
  responsibilityScore >= 90 AND businessImpact in [high, critical]
  performanceScore >= 85 AND businessImpact in [high, critical] AND evidenceConflict = true
  injection detected (severity = critical)
  agentLoop detected AND cost > budget

Priority 2 — ESCALATE (any of):
  businessImpact in [high, critical] AND confidence < 70
  performanceScore BETWEEN 60 AND 85 AND businessImpact HIGH
  responsibilityScore BETWEEN 50 AND 90 AND fairnessConcern = true
  detectors disagree (performance LOW, responsibility HIGH)

Priority 3 — EDIT (all must be true):
  responsibilityScore >= 40
  editIsSafe = true (only PII redaction or deterministic format repair)
  businessImpact NOT critical

Priority 4 — RELEASE (default when):
  compositeRisk < 25
  no hard policy violations
  businessImpact = low OR medium
```

---

## Escalation Experience (Control Desk)

When a response is ESCALATED:

1. Case appears in Control Desk queue immediately
2. Case shows: reason, risk scores, AI response, evidence, escalation trigger
3. Human reviewer sees all context needed to make a decision
4. Available actions: Approve Release, Approve with Edit, Confirm Block, Add Note
5. All reviewer actions are timestamped and attributed in audit trail
6. Case is marked RESOLVED and removed from queue

---

## Audit Trail

Every ControlPlane decision produces a database record containing:

```json
{
  "requestId": "uuid",
  "timestamp": "ISO8601",
  "model": "gpt-4o",
  "taskType": "financial",
  "risk": { "performance": 92, "cost": 5, "responsibility": 8, "composite": 88 },
  "businessImpact": "high",
  "detections": [{ "type": "FACTUAL_CONFLICT", "severity": "critical", "detector": "EvidenceVerifier", "evidence": {...} }],
  "verificationTier": 2,
  "decision": "BLOCK",
  "decisionReason": "Factual conflict: AI claims refund processed; record shows not processed.",
  "confidence": 97,
  "latencyMs": 47,
  "demoMode": true
}
```

Audit records are append-only. No delete API exists.

---

## Scenario Simulator

The simulator provides four pre-configured scenarios with deterministic outcomes.

Each scenario has:
- Fixed input (AI response + context)
- Fixed expected outcome
- Fixture data for evidence lookup
- Deterministic decision result

The simulator bypasses live AI calls entirely. It uses the real detection and decision engine on fixed inputs.

---

## Demo Mode

When `demoMode: true` AND `scenario` is set:
- Input is the fixture for that scenario
- Detection runs on fixture data (real engines, not mocked)
- Evidence lookup uses in-memory fixture records
- AI model is NOT called
- Result is deterministic

When `demoMode: true` AND no scenario:
- Processes the provided input normally
- AI calls use fixture provider if API key not set

---

## Settings / Configuration (Environment)

```
OPENAI_API_KEY          — OpenAI key (optional; demo works without it)
DEMO_MODE               — "true" forces demo fixtures for all requests
DATABASE_PATH           — SQLite file path (default: ./data/controlplane.db)
NEXT_PUBLIC_APP_NAME    — Display name
RATE_LIMIT_RPM          — Requests per minute limit (default: 100)
```

---

## What Is NOT In This Product (Non-Goals)

- Real authentication/authorization (simulated)
- Multi-tenant data isolation
- Real provider cost API (estimated cost, labeled)
- Model training or fine-tuning
- Webhook/callback system
- Batch processing API
- Mobile app
- Kubernetes deployment
- Full regulatory compliance (EU AI Act, HIPAA)
