# Competitive Landscape Research

**Research Date:** 2026-08-24  
**Purpose:** Understand what exists, what we should NOT claim as novel, and where ControlPlane remains differentiated.

---

## 1. AWS Bedrock Guardrails

### What it actually does
- Cross-account policy enforcement for AWS-native teams
- `InvokeGuardrailChecks` API for agentic loops (numeric severity scores, not binary pass/fail)
- PII filtering, topic denial, content filtering
- Code generation security scanning (secrets, insecure patterns)
- Multi-model support (Claude, Llama, Titan, etc.)

### Current features (2026)
- Configurable guardrails per model deployment
- Cross-organizational unit enforcement
- Numeric severity scores enable custom adaptive logic

### Overlap with ControlPlane
- PII detection ✓
- Content policy enforcement ✓
- Agentic loop monitoring ✓

### What we should NOT claim as novel
- Basic PII redaction
- Content filtering per category
- Policy rules

### Where ControlPlane remains differentiated
- Multi-engine risk fusion (Performance + Cost + Responsibility together)
- Risk-Adaptive Verification (tiered verification depth, not uniform)
- Business-impact weighting in decisions
- Evidence-based verification (checking FACTS against source data, e.g., refund verification)
- Unified decision layer across any AI, not just AWS models
- Human Control Desk with structured escalation workflow
- Cost waste detection (beyond API spend to operational waste patterns)

---

## 2. Azure AI Content Safety / Prompt Shields

### What it actually does
- Prompt Shields: detects direct jailbreaks AND indirect prompt injection (documents, web content)
- Task Adherence: monitors agents for task deviation / misaligned tool usage
- Multimodal analysis (text + image combined)
- Unified API for text/image risk classification

### Current features (2026)
- Best-in-class prompt injection defense
- Mature content classification APIs
- Deep Microsoft Azure Foundry integration

### Overlap with ControlPlane
- Prompt injection detection ✓
- Safety classification ✓
- Agent monitoring ✓

### What we should NOT claim as novel
- Prompt injection detection as a standalone feature
- Basic content safety classification

### Where ControlPlane remains differentiated
- Evidence verification (fact-checking against business records)
- Risk-Adaptive tiered verification (not every response gets deep check)
- Cost waste detection
- Multi-engine fusion with explainable scoring
- Control Desk escalation workflow
- Provider-agnostic (works with any AI, not just Azure-hosted)

---

## 3. Google Vertex AI Safety / Model Armor

### What it actually does
- Configurable + non-configurable content filters on Gemini models
- Model Armor: security gatekeeper for inputs/outputs
- Security Command Center integration for real-time monitoring
- BigQuery integration for ML-heavy workflows

### Current features (2026)
- Category-level filter configuration (harassment, hate, dangerous)
- Near real-time monitoring via Security Command Center

### Overlap with ControlPlane
- Output content filtering ✓
- Policy-based blocking ✓

### Where ControlPlane remains differentiated
- Same as above: evidence verification, risk-adaptive tiering, cost engine, control desk

---

## 4. LangSmith

### What it actually does
- Deep LangChain/LangGraph ecosystem integration
- Production evals library (safety, hallucination, quality)
- Managed deployment + tracing
- Evaluation datasets / golden set management

### Overlap with ControlPlane
- LLM evaluation ✓
- Tracing + observability ✓
- Hallucination detection ✓

### What we should NOT claim as novel
- LLM-as-judge evaluation
- Tracing and observability dashboards
- Evaluation scoring frameworks

### Where ControlPlane remains differentiated
- Decision layer (ControlPlane ACTS on detections — block/edit/escalate — LangSmith observes)
- Business impact integration in decisions
- Human Control Desk for escalation
- Risk-adaptive verification depth
- Cost waste engine (beyond API telemetry)

---

## 5. Langfuse

### What it actually does
- Framework-agnostic (OpenTelemetry-based)
- Tracing for any LLM framework
- Self-hostable for compliance
- Guardrail verdicts as scores on traces

### Overlap with ControlPlane
- Observability ✓
- Framework-agnostic approach ✓

### Where ControlPlane remains differentiated
- Same as LangSmith: ControlPlane is a decision/action layer, not an observation layer

---

## 6. Guardrails AI

### What it actually does
- Runtime input/output validation
- Schema enforcement, type checking, format repair
- Validators as composable components
- Python library for wrapping LLM calls

### Overlap with ControlPlane
- Output validation ✓
- EDIT action (format repair) ✓
- PII detection ✓

### What we should NOT claim as novel
- Composable validators
- Output format repair

### Where ControlPlane remains differentiated
- Risk-adaptive tiering (Guardrails AI applies ALL validators to ALL responses)
- Business impact-weighted decisions
- Performance Engine (hallucination/grounding verification)
- Cost Engine (waste detection)
- Control Desk escalation workflow
- Multi-engine risk fusion

---

## 7. NeMo Guardrails (NVIDIA)

### What it actually does
- Conversation flow control via Colang
- Topic guardrailing (prevent off-topic discussions)
- Safety dialogue policies

### Overlap with ControlPlane
- Policy-based response control ✓

### Where ControlPlane remains differentiated
- Not a conversation flow tool — operates on any AI response
- Evidence-based verification
- Cost and performance dimensions

---

## Summary: ControlPlane's Genuine Differentiators

| Differentiator | Status vs. Market |
|----------------|-------------------|
| **Risk-Adaptive Verification** (tiered cost of verification) | **NOVEL** — No competitor adapts verification depth to risk |
| **Three-Engine Fusion** (Performance + Cost + Responsibility) | **NOVEL** — Cost waste detection is unique |
| **Evidence-Based Verification** (fact-checking against business records) | **NOVEL** — Competitors classify, not verify against source of truth |
| **Decision Layer** (RELEASE/EDIT/BLOCK/ESCALATE) | **Differentiated** — Competitors observe; ControlPlane acts |
| **Human Control Desk** (structured escalation) | **Differentiated** — No competitor provides this workflow |
| **Business Impact Integration** | **Differentiated** — Risk = technical risk × business impact |
| **Provider-Agnostic** | **Present in some competitors** (Langfuse, Guardrails AI) — table stakes |

### Claims to avoid (NOT novel)
- PII detection (AWS, Azure, all competitors have this)
- Content safety classification (everyone has this)
- LLM-as-judge evaluation (widespread)
- Tracing and observability (LangSmith, Langfuse)
- Prompt injection detection (Azure Prompt Shields is strong here)
