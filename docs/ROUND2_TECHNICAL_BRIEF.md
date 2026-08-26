# ControlPlane.ai — Round 2 Technical Brief

## Alignment update — 2026-08-25

The runnable implementation now includes named Customer Support, Knowledge Assistant, and Decision Support profiles with explicit latency budgets, policy version, region, evidence source, and verification metadata. It also includes a deterministic synthetic evaluation runner (`npm run evaluate`) with a held-out split, feedback events from Control Desk outcomes, and a Trust & Evaluation page. Public dataset metrics, statistical calibration, production security, and regulatory compliance remain unverified and are not claimed.

**Competition:** Accenture Innovation Challenge 2026  
**Track:** Applied AI & Enterprise Trust  
**System Name:** ControlPlane.ai (Runtime AI Decision & Governance Layer)  
**Document Classification:** Technical Defense & Architecture Specification  

---

## 1. Problem Statement

Enterprises deploying Generative AI models into production encounter three critical operational vulnerabilities:

1. **Factual Hallucinations in High-Stakes Workflows:** AI models confidently assert erroneous financial claims, transaction statuses, and legal commitments without real-time grounding in enterprise databases.
2. **Privacy, Safety, and Policy Non-Compliance:** Unintentional leakage of customer PII (phone numbers, emails, government IDs), vulnerability to prompt injection attacks, and systemic demographic biases in automated decision systems.
3. **Inefficient Latency and Cost Governance:** Existing guardrail solutions execute heavyweight LLM-as-a-judge evaluations on 100% of network traffic, introducing 500ms–2000ms of latency overhead and doubling token costs even for trivial, low-risk requests.

---

## 2. The Solution: ControlPlane.ai

ControlPlane.ai is an intelligent, low-latency **runtime decision layer** deployed as a reverse proxy or sidecar between enterprise AI applications and end-users/business APIs.

Rather than acting as a passive telemetry collector or a blunt binary filter, ControlPlane.ai:
- Dynamically classifies the risk profile and business impact of incoming AI responses.
- Evaluates risk across three unified dimensions: **Performance (Grounding)**, **Cost (Token Economics)**, and **Responsibility (Privacy & Safety)**.
- Executes **Risk-Adaptive Verification** to scale verification compute based on detected risk.
- Renders one of four deterministic actions: **RELEASE**, **EDIT**, **BLOCK**, or **ESCALATE**.
- Routes high-liability edge cases to a human supervisor via the **Control Desk**.

---

## 3. Why Risk-Adaptive Verification?

In enterprise production, not all model outputs carry equal risk:
- An AI generating a standard greeting or an order shipment confirmation carries minimal risk.
- An AI asserting that a ₹24,500 disputed refund was processed carries critical financial liability.

Applying heavyweight multi-engine verification or LLM-based judges to every request is economically non-viable and degrades user experience. **Risk-Adaptive Verification** dynamically tiers verification effort:

- **Tier 0 (Fast Deterministic Scan, <2ms):** Regex PII patterns, prompt injection delimiters, and token ratios executed on 100% of traffic.
- **Tier 1 (Structural & Policy Evaluation, ~5ms):** Triggered when elevated risk or privacy patterns are observed. Executes PII classification, safe redaction mapping, and infinite loop/retry thrashing detection.
- **Tier 2 (Deep Ground-Truth Verification, ~10ms prototype measurement):** Triggered strictly for high-impact financial claims, factual assertions, or severe risk. Directly queries enterprise ground-truth databases and cross-references assertions.

---

## 4. System Architecture

```
[ Client Application / API Gateway ]
                 │ (AnalyzeRequest)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 ControlPlane API Layer                      │
│            POST /api/analyze  •  /api/simulate              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Verification Orchestrator                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tier 0: Fast Deterministic Scans (<2ms)               │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│              [ Risk Trigger Evaluation ]                    │
│               │                      │                      │
│        (Elevated Risk)         (High Impact)                │
│               ▼                      ▼                      │
│  ┌────────────────────────┐ ┌────────────────────────────┐  │
│  │ Tier 1: Policy Engine  │ │ Tier 2: Ground-Truth DB    │  │
│  └────────────────────────┘ └────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Engine Scores & Detections)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Risk Fusion Engine                       │
│  • Scales by Business Impact (Low=0.8x, High=1.3x, Crit=1.6x)│
│  • Computes Weighted Composite Score [0–100]                │
│  • Enforces Critical Severity Floors (Score >= 85)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Deterministic Decision Engine              │
│    Priority Hierarchy: BLOCK > ESCALATE > EDIT > RELEASE    │
└──────────────┬───────────────┬───────────────┬──────────────┘
               ▼               ▼               ▼
          [ RELEASE ]       [ EDIT ]        [ BLOCK ]
               │               │               │
               └───────────────┼───────────────┴──────────────┐
                               ▼                              ▼
                       [ SQLite Audit Log ]             [ ESCALATE ]
                     (Tamper-Evident SHA-256)                 │
                                                              ▼
                                                     [ Human Control Desk ]
                                                  (Supervisor Adjudication)
```

---

## 5. The Three Core Intelligence Engines

### A. Performance Engine (Grounding & Factual Integrity)
- **Input:** Model completion, system context, task type, business impact.
- **Detection Mechanism:**
  - `EvidenceVerifier`: Extracts structured transactional assertions (amounts, IDs, dates, status declarations) using deterministic entity extractors. Matches against enterprise mock/actual database records (e.g., Order #ORD-8921 -> `Status: REJECTED`).
  - `ConsistencyChecker`: Detects semantic polarity reversals and intra-response contradictions.
- **Output:** Performance risk score [0–100], list of evidence records, and contradiction flags.
- **Rationale:** Ground-truth database cross-checks provide mathematical certainty rather than probabilistic guesses when verifying financial facts.

### B. Cost Engine (Token Economics & Waste Prevention)
- **Input:** Prompt tokens, completion tokens, tool-call sequence history, iteration count.
- **Detection Mechanism:**
  - `TokenAnalyzer`: Flags disproportionate prompt-to-completion ratios and excessive token volume.
  - `LoopDetector`: Identifies cyclical repetition of identical tool calls or alternating identical state mutations.
  - `RetryDetector`: Flags repetitive retry attempts with decaying delta progress.
- **Output:** Cost risk score [0–100], detected loop signatures, and estimated token waste savings.
- **Rationale:** Detects and terminates runaway autonomous agent loops before significant cloud API expenses are incurred.

### C. Responsibility Engine (Privacy, Safety & Policy)
- **Input:** User prompt, AI response, business domain.
- **Detection Mechanism:**
  - `PIIDetector`: Deterministic regex patterns + Luhn algorithm checksum validation for Credit Cards, Indian Phone Numbers (+91), Emails, Indian PAN Cards, and Aadhaar numbers. Provides deterministic character-level redaction offsets.
  - `InjectionDetector`: Detects prompt injection markers, system instruction overrides (`Ignore previous instructions`), and XML/Markdown delimiter hijacking.
  - `SafetyPolicyDetector`: Evaluates demographic steering in recruitment and unauthorized financial guarantee commitments.
- **Output:** Responsibility risk score [0–100], PII redaction maps, and policy violation tags.
- **Rationale:** Combines deterministic regex accuracy for zero-latency PII detection with policy-level fairness checks.

---

## 6. Decision Engine & Priority Hierarchy

ControlPlane.ai enforces a strict, fail-safe decision hierarchy:

$$\text{BLOCK} \succ \text{ESCALATE} \succ \text{EDIT} \succ \text{RELEASE}$$

1. **BLOCK (Highest Priority):**
   - Triggered when: Composite Risk $\ge 75$, any Critical severity detection, or an unresolvable ground-truth conflict.
   - Action: Response is halted immediately. Error/fallback message returned to client.
2. **ESCALATE:**
   - Triggered when: High-impact fairness policy concern, demographic bias, or policy uncertainty is detected.
   - Action: Response is held in a pending state and dispatched to the Human Control Desk.
3. **EDIT:**
   - Triggered when: Risk is medium ($25 \le \text{Risk} < 75$) and all detected issues have `editSafe: true` (e.g., PII exposure).
   - Action: Sanitized response is constructed via automated redaction and delivered to the user.
4. **RELEASE (Default):**
   - Triggered when: Composite Risk $< 25$, zero critical/high detections, and all factual assertions are grounded.
   - Action: Original response delivered unaltered.

---

## 7. The Trust Hierarchy

ControlPlane.ai adheres to an explicit epistemic trust hierarchy:

1. **Deterministic Business Records (Ground Truth DB)** >
2. **Cryptographic & Algorithm Checksums (Luhn, Regex)** >
3. **Domain Heuristic Engines (Loop/Retry Detection)** >
4. **LLM-Based Evaluator Judgments** >
5. **Model Self-Confidence Claims**

By prioritizing deterministic evidence over probabilistic model self-reports, ControlPlane eliminates circular dependencies where an LLM is asked to verify its own hallucinations.

---

## 8. Latency Strategy & Prototype Performance

| Tier | Description | Typical Latency (Local Prototype) | Scope |
| :--- | :--- | :--- | :--- |
| **Tier 0** | Fast Deterministic Pattern Scans | **< 2 ms** | 100% of all requests |
| **Tier 1** | Structural & Policy Evaluation | **~ 4–6 ms** | ~15–20% of traffic |
| **Tier 2** | Deep Ground-Truth DB Lookup | **~ 8–12 ms** | ~5% of high-impact traffic |

*Latency figures represent prototype measurements in local demo execution. Average end-to-end API latency across all scenarios is <15ms.*

---

## 9. Human-in-the-Loop: The Control Desk

For scenarios where automated algorithms cannot make a risk-free determination (e.g., demographic bias in candidate evaluation), ControlPlane activates the **Human Control Desk**:
- Displays full context: User prompt, AI response, detected policy concern, and business impact.
- Provides authoritative supervisor action buttons:
  - `APPROVE_RELEASE`
  - `APPROVE_WITH_EDIT` (with editable text area)
  - `CONFIRM_BLOCK`
  - `ADD_NOTE`
- Synchronizes case status from `PENDING` to `RESOLVED` and updates dashboard metrics in real time.
- Emits a tamper-evident audit record with reviewer ID and timestamp.

---

## 10. Security Baseline

- **Zero Dynamic Code Execution:** Completely free of `eval()`, `new Function()`, or dynamic script injection.
- **SQL Injection Immunity:** 100% parameterized queries via SQLite prepared statements (`@param` binding).
- **Synthetic Test Data:** Zero real PII, credentials, or actual customer data present in repository or demo fixtures.
- **Fail-Safe Defaults:** System errors or unhandled edge cases default to conservative `BLOCK` or `ESCALATE` actions.

---

## 11. Testing & Verification

- **Test Suite:** 81 automated tests across 9 test suites using Vitest.
- **Coverage:** Unit tests for all 3 engines, risk fusion, decision engine, verification orchestrator, API routes, and 10 consecutive Golden Path reliability runs.
- **Type Safety:** 100% TypeScript strict mode compliance with zero compiler errors.
- **Code Quality:** 0 ESLint warnings or errors across the entire codebase.

---

## 12. Limitations of Current Prototype

1. **Deterministic Heuristic Detectors:** Pattern recognition is executed using deterministic TypeScript algorithms rather than fine-tuned SLM classifier models.
2. **Local SQLite Architecture:** Database is a single-node embedded SQLite instance rather than a distributed cloud datastore.
3. **Estimated Cost Metrics:** Token cost savings are calculated via standardized GPT-4o pricing formulas rather than live cloud billing APIs.
4. **Mocked Enterprise Integrations:** Ground-truth database cross-checks utilize built-in fixture databases rather than live enterprise ERP/CRM webhooks.

---

## 13. Production Evolution Plan

```
Current Prototype                    Production Target Architecture
──────────────────────────────────────────────────────────────────────────────────────────
Next.js API Routes (Node.js)    ──►   Rust / Go Edge Proxy (Cloudflare Workers / Envoy)
Local SQLite Database           ──►   Distributed ClickHouse (Audit) + PostgreSQL (Control Desk)
Regex & Heuristic Detectors     ──►   Specialized 100M SLM Guardrail Classifiers (ONNX Runtime)
Mock Enterprise DB Records      ──►   Real-time gRPC connectors to SAP, Salesforce, Postgres
In-App Control Desk UI          ──►   Enterprise SSO (SAML/OIDC), RBAC, Slack/Teams Action Cards
```
