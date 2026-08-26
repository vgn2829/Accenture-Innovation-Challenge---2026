# ControlPlane.ai

> **An intelligent runtime decision layer that sits between AI models and business systems to deterministically RELEASE, EDIT, BLOCK, or ESCALATE AI responses.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat&logo=sqlite)](https://github.com/WiseLibs/better-sqlite3)
[![Tests](https://img.shields.io/badge/Tests-168%2F168%20Passing-emerald?style=flat)](https://vitest.dev/)

---

## The Problem

Enterprises are rapidly deploying Large Language Models (LLMs) into customer service, financial operations, recruitment, and internal workflows. However, existing safety approaches fail in production:

1. **Passive Logging & Tracing** (e.g., LangSmith, Langfuse) observe errors *after* they have already reached customers.
2. **Static Guardrails** (e.g., AWS Bedrock Guardrails, Guardrails AI) apply binary regex filters or run expensive, slow LLM-as-a-judge evaluators on *every single request*, adding unacceptable latency (300ms–2000ms) and multiplying token costs.
3. **Lack of Decisioning**: Traditional guardrails only know how to block or pass. They cannot perform safe automated repairs or orchestrate human-in-the-loop escalations with business context.

---

## The Core Idea: Risk-Adaptive Verification

ControlPlane.ai introduces **Risk-Adaptive Verification**: the depth and computational cost of safety verification automatically scales with the detected risk and business impact of the response.

Instead of running slow, expensive verification on every interaction:
- **Low-Risk Responses** use Tier 0 deterministic classification and pattern checks.
- **PII Responses** trigger Tier 1 structural/policy evaluation and safe redaction.
- **High-Impact Financial, Order, and Hiring Assertions** trigger Tier 2 trusted-evidence or fairness verification.

```
AI Model Response
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Tier 0: Fast Deterministic Scan (local prototype)     │
│  - Regex PII & Token Analysis                          │
│  - Prompt Injection Delimiter Detection                │
└───────────────────────┬────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │ Risk Threshold Triggered?   │
         ├──────────────┬──────────────┤
         │ NO (Low)     │ YES (Elevated)
         │              ▼
         │  ┌───────────────────────────────────────────┐
         │  │  Tier 1: Structural & Policy Eval (~5ms)  │
         │  │  - PII Classification & Safe Redaction    │
         │  │  - Infinite Loop & Retry Thrash Detection │
         │  └───────────────────┬───────────────────────┘
         │                      │
         │       ┌──────────────┴──────────────┐
         │       │ High Impact / Contradiction?│
         │       ├──────────────┬──────────────┤
         │       │ NO           │ YES
         │       │              ▼
         │       │  ┌───────────────────────────────────────────┐
         │       │  │  Tier 2: Deep Ground-Truth Cross-Check    │
         │       │  │  - Enterprise DB Record Comparison        │
         │       │  │  - Factual Assertion Verification         │
         │       │  └───────────────────┬───────────────────────┘
         │       │                      │
         ▼       ▼                      ▼
┌────────────────────────────────────────────────────────┐
│  Risk Fusion Engine (Weighted Composite Risk 0–100)    │
│  Performance (40%) + Responsibility (40%) + Cost (20%) │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  Deterministic Decision Engine                         │
│  Priority Rule: BLOCK > ESCALATE > EDIT > RELEASE      │
└───────────────────────┬────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
   [ RELEASE ]       [ EDIT ]        [ BLOCK ]     [ ESCALATE ]
   Clean output   Auto-redacted    Prevented risk    Dispatched to
   to user        safe delivery    to business       Control Desk
```

---

## What It Does: The 3 Core Engines

ControlPlane.ai unifies three critical operational dimensions into a single decisioning pipeline:

### 1. Performance Engine (Grounding & Factual Integrity)
- **EvidenceVerifier**: Extracts factual and financial claims (e.g., refund amounts, order status, account IDs) and cross-checks them directly against enterprise database records.
- **ConsistencyChecker**: Identifies polarity reversals, direct contradictions, and structural reasoning mismatches within the response.

### 2. Cost Engine (Token Economics & Waste Prevention)
- **TokenAnalyzer**: Analyzes prompt-to-completion ratios and flags token bloat (*labeled as estimated metrics*).
- **LoopDetector**: Detects cyclic tool calls, repetitive sequences, and agent thrashing before runaway API costs accrue.
- **RetryDetector**: Flags redundant retries and decaying progress loops.

### 3. Responsibility Engine (Privacy, Safety & Policy)
- **PIIDetector**: Deterministic regex and Luhn-validated detection of Indian Phone Numbers, Emails, Credit Cards, PAN Cards, and Aadhaar numbers with automated safe redaction.
- **InjectionDetector**: Detects prompt injection attempts, system prompt overrides, delimiter attacks, and roleplay jailbreaks.
- **SafetyPolicyDetector**: Evaluates discriminatory hiring bias, demographic steering, and unauthorized financial guarantees.

### 4. Risk Fusion & Decision Engine
- Scales raw engine scores by **effective Business Impact** (`low` = 1.0×, `medium` = 1.15×, `high` = 1.35×, `critical` = 1.6×); claim type can raise the impact floor.
- Enforces strict safety floors (Critical severity automatically elevates composite risk ≥85/100).
- Deterministic Priority Matrix:
  $$\text{BLOCK} \succ \text{ESCALATE} \succ \text{EDIT} \succ \text{RELEASE}$$

### 5. Human Control Desk
- When an AI response carries high-liability ambiguity or fairness concerns, it is routed to the **Control Desk**.
- Human supervisors inspect the context, evidence contradiction, and detector signals, and issue authoritative overrides (`APPROVE_RELEASE`, `APPROVE_WITH_EDIT`, `CONFIRM_BLOCK`, `ADD_NOTE`).

---

## Four Concrete Governance Decisions

| Decision | When Applied | Action Taken |
| :--- | :--- | :--- |
| **RELEASE** | Low composite risk ($<30$), no unsafe detections, and `VERIFIED`/`NOT_APPLICABLE` state. | Response is forwarded without modification. |
| **EDIT** | PII or repairable formatting detected ($25 \le \text{Risk} < 65$) where safe redaction is possible. | Sensitive tokens are automatically sanitized (e.g., `[PHONE REDACTED]`) and the safe response is delivered. |
| **BLOCK** | Critical factual contradiction, prompt injection, or severe financial risk ($\text{Risk} \ge 75$ or Critical). | Response is halted immediately; error or fallback message is returned; prevented waste is logged. |
| **ESCALATE** | High-impact fairness policy concern, demographic bias, or ambiguous business claims. | Output is withheld and routed to the Human Control Desk for supervisor adjudication. |

---

## Verification Tiers

| Tier | Name | Latency (Local) | Trigger Condition | Checks Executed |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 0** | Fast Deterministic Scan | Local prototype measurement | 100% of incoming responses | PII, injection, token, claim classification |
| **Tier 1** | Structural & Policy Eval | Local prototype measurement | PII, policy, or policy minimum | PII, loop/retry, responsibility checks |
| **Tier 2** | Deep Verification | Local prototype measurement | Financial/order/hiring policy | Trusted evidence, consistency, semantic fairness screen |

*Note: Latency numbers represent local prototype execution measurements.*

---

## Interactive Demo Scenarios

The built-in **Scenario Simulator** (`/simulate`) demonstrates all 4 decisions deterministically:

1. **Scenario A — Clean E-Commerce Fulfillment**:
   - Clean order confirmation (#ORD-4492). Zero PII or financial conflict.
   - *Outcome:* **Tier 2 trusted order verification → RELEASE**.
2. **Scenario B — Customer Support PII Leak**:
   - AI response includes customer phone (`+91 9876543210`) and email (`priya.nair@example.com`).
   - *Outcome:* **Tier 1 → EDIT (Auto-redacted output delivered)**.
3. **Scenario C — Hero Scenario: ₹24,500 Refund Dispute**:
   - AI falsely asserts: *"Your refund of ₹24,500 has been processed successfully."*
   - Tier 2 resolves trusted fixture `REFUND_8921`, which shows `Status: REJECTED`.
   - *Outcome:* **Tier 2 → Factual Contradiction Detected → BLOCK**.
4. **Scenario D — Demographic Hiring Bias**:
   - Candidate assessment recommends prioritizing specific demographic cohorts for culture balance.
   - *Outcome:* **Tier 2 → Fairness Concern → ESCALATE (Dispatched to Human Control Desk)**.

---

## Tech Stack

- **Framework**: Next.js 16.3.2 (App Router; webpack production build verified, Turbopack is environment-blocked here)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons, Recharts
- **Database & Storage**: SQLite via Node-20-compatible `better-sqlite3` 9.6.0 (WAL mode, parameterized statements, indexed audit logs)
- **Testing**: Vitest 4.1.11 (135 unit, integration, adversarial, evaluation, and reliability tests)
- **Language**: TypeScript 5.0 (Strict mode, zero `any`)

---

## Getting Started

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/username/controlplane-ai.git
cd controlplane-ai

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Reset/initialize the demo database
npm run demo:reset

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on `http://localhost:3000` |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts production server |
| `npm test` | Runs the full Vitest suite (168 tests across 16 test files) |
| `npm run evaluate` | Runs the offline 320-case synthetic corpus with a 64-case held-out split and writes evaluation artifacts |
| `/evaluation/datasets` | Dataset Lab for temporary CSV/JSON/JSONL profiling, explicit mapping, policy runs, feedback, and adaptive/deep comparison |
| `npm run lint` | Runs ESLint checks |
| `npm run typecheck` | Runs TypeScript compiler validation (`tsc --noEmit`) |
| `npm run demo:reset` | Resets the SQLite demo database to a clean, fresh state |

---

## Environment Variables (`.env.example`)

```ini
# Database Path (defaults to ./data/controlplane.db)
DATABASE_PATH=./data/controlplane.db

# Application Configuration
NEXT_PUBLIC_APP_NAME=ControlPlane.ai
DEMO_MODE=false
# Reserved deployment setting; no rate limiter is implemented in this prototype.
RATE_LIMIT_RPM=100

# Optional OpenAI API Key (Demo functions 100% offline without this key)
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Security & Architecture Baseline

- **Zero Untrusted Code Execution**: No `eval()`, `Function()`, or `dangerouslySetInnerHTML`.
- **SQL Injection Prevention**: 100% of SQLite database interactions use parameterized prepared statements.
- **Privacy & PII Protection**: All demo scenarios utilize synthetic fixtures. No real customer PII or API credentials exist in the codebase.
- **Fail-Safe Decisioning**: Any uncaught engine anomaly defaults to safe policy enforcement (`BLOCK` or `ESCALATE`).

---

## Limitations (Prototype Scope)

- **Deterministic Detectors**: Pattern recognition and ground-truth comparisons are implemented via deterministic TypeScript engines and specialized heuristics rather than multi-billion parameter foundation models.
- **Local SQLite Storage**: The prototype utilizes a local single-node SQLite database rather than a distributed PostgreSQL/ClickHouse cluster.
- **Synthetic Data**: All transaction IDs, customer names, and phone numbers are fictional demonstration fixtures.
- **Cost Estimations**: Token counts and cost metrics represent estimated calculations based on standard GPT-4o pricing schemas.

---

## Future Roadmap

*(See `docs/ROADMAP.md` and `docs/FUTURE_IDEAS.md` for extended design specs)*

- **Distributed Architecture**: Multi-region edge deployment via Cloudflare Workers / Fly.io.
- **Streaming Interception**: Token-by-token streaming verification using WebSockets and SSE.
- **Enterprise Integrations**: Bi-directional connectors for Slack, Microsoft Teams, Zendesk, and ServiceNow.
- **Multi-Tenant RBAC**: Enterprise SSO (SAML/OIDC), organization workspaces, and custom regulatory policy packs (EU AI Act, HIPAA, RBI AI Guidelines).

---

## License

This project is developed for the **Accenture Innovation Challenge 2026**. All rights reserved.
