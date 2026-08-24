# Technical Research

**Research Date:** 2026-08-24  
**Purpose:** Current best practices for all technical areas relevant to ControlPlane.ai

---

## 1. LLM Evaluation & Hallucination Detection

### Claim: NLI-based models outperform LLM-as-judge for deterministic grounding checks
- **Evidence:** DeBERTa-v3-MNLI (NLI = Natural Language Inference) provides entailment scoring between source context and model output. Faster and cheaper than calling a large LLM evaluator.
- **Source:** futureagi.com, machinelearningmastery.com (August 2026)
- **Implication for ControlPlane:** Use NLI-style semantic similarity for Tier 1 grounding. Reserve LLM evaluator for Tier 2 only when risk is high. This directly implements Risk-Adaptive Verification.

### Claim: Self-consistency / multi-sample consensus ("ChainPoll") improves hallucination detection
- **Evidence:** Running the same query multiple times and checking for output consistency is a reliable signal — inconsistent outputs indicate uncertain/unreliable responses.
- **Source:** futureagi.com (2026)
- **Implication for ControlPlane:** Consistency check is a Tier 1 mechanism for the Performance Engine. Cheap to run (no external model call needed).

### Claim: Forced citation + post-processing citation verification is best practice for RAG
- **Evidence:** Requiring models to cite retrieved chunks + verifying those citations against source documents during post-processing.
- **Source:** futureagi.com, parasoft.com (2026)
- **Implication for ControlPlane:** When source documents are available, citation verification is a deterministic, high-confidence grounding check. Should run at Tier 0.

---

## 2. PII Detection

### Claim: Layered PII detection (regex → NER → specialist API) is current best practice
- **Evidence:** 
  - Tier 1: Regex/checksums for structured PII (SSN, credit card numbers, phone, email)
  - Tier 2: NER models for unstructured PII (names, addresses)
  - Tier 3: Specialist PII APIs for compliance-grade requirements
- **Source:** truefoundry.com, gravitee.io, wso2.com (2026)
- **Implication for ControlPlane:** Regex-based PII detection is Tier 0 (always runs). NER models are Tier 1. This aligns perfectly with our latency architecture.

### Claim: Bidirectional scanning (input AND output) is required
- **Evidence:** Models can "echo" or infer PII from retrieved documents even when the original prompt didn't contain it. Scanning only outputs is insufficient.
- **Source:** openlayer.com, truefoundry.com (2026)
- **Implication for ControlPlane:** Responsibility Engine must scan both the AI response AND the retrieved context used to generate it.

---

## 3. Prompt Injection

### Claim: Prompt injection remains #1 LLM vulnerability (OWASP LLM01:2025/2026)
- **Evidence:** OWASP GenAI LLM Top 10 (2026 edition) lists prompt injection as the top threat. LLMs cannot inherently distinguish between data and instructions.
- **Source:** owasp.org, introl.com (2026)
- **Implication for ControlPlane:** Responsibility Engine must include prompt injection detection. Should run at Tier 0 (always).

### Claim: Structured tool calls + typed schemas reduce injection risk vs. natural language
- **Evidence:** Using typed function/tool calls restricts the model to a predefined schema, limiting injection attack surface.
- **Source:** futureagi.com, parasoft.com (2026)
- **Implication for ControlPlane:** When ControlPlane itself calls AI systems, use typed schemas. In detection, flag responses that appear to be trying to override system behavior.

---

## 4. Agent Loop Detection

### Claim: "Excessive Agency" is a top-tier risk as of 2026 (OWASP)
- **Evidence:** OWASP GenAI LLM Top 10 (2026) identifies excessive agency as critical — agents granted ability to perform real-world actions (send emails, modify files) require human-in-the-loop checkpoints.
- **Source:** OWASP GenAI Security Project (2026)
- **Implication for ControlPlane:** Agent loop detection is Tier 0. Any repeated tool call pattern, budget overrun, or agentic cycle exceeding threshold → BLOCK or ESCALATE.

---

## 5. AI Safety Classification

### Claim: Purpose-built small adversarially-trained guards outperform LLM-as-judge for inline filtering
- **Evidence:** "Adversarially trained custom guards — purpose-built, small, fast classifiers (often milliseconds) hardened against specific adversarial attacks" — contrasted with LLM-as-judge which is "slow and expensive."
- **Source:** OpenAI ecosystem research, futureagi.com (2026)
- **Implication for ControlPlane:** For Tier 0 checks, use lightweight classifiers or rule-based systems. LLM evaluator only at Tier 2.

---

## 6. LLM-as-Judge Limitations

### Claim: LLM-as-judge has known biases (position, verbosity, self-enhancement)
- **Evidence:** Widely documented in academic literature. LLMs tend to prefer longer outputs (verbosity bias), outputs in certain positions (position bias), and their own outputs (self-enhancement bias).
- **Source:** Multiple academic papers (not LLM-searched — well-documented limitation)
- **Implication for ControlPlane:** 
  - Trust hierarchy: deterministic > evidence > specialist classifier > LLM evaluator > model self-confidence
  - When using LLM-as-judge at Tier 2, acknowledge limitations explicitly
  - Calibrate against ground truth where possible

---

## 7. AI Cost Optimization

### Claim: Retries, redundant tool calls, and agent loops are primary sources of AI cost waste
- **Evidence:** Standard patterns identified across multiple cloud providers and cost optimization frameworks. Oversized context, excessive generation, and unnecessary expensive model usage are compounding factors.
- **Source:** AWS, Azure, Google cloud cost optimization documentation (2026)
- **Implication for ControlPlane:** Cost Engine must track: retry count, tool call count per session, context token usage, model tier used, estimated cost per successful task. These are MEASURABLE telemetry signals.

---

## 8. Human-in-the-Loop AI Systems

### Claim: HITL checkpoints are mandatory for consequential agentic actions
- **Evidence:** "Mandatory pauses for security reviews" for high-capability models. Real-world action agents (email, file modification) require HITL.
- **Source:** OpenAI Preparedness Framework (2026), OWASP (2026)
- **Implication for ControlPlane:** Control Desk is not an optional feature — it is architecturally required for enterprise governance credibility.

---

## 9. Observability & Audit

### Claim: Guardrail verdicts should be recorded as scored events in tracing systems
- **Evidence:** "Guardrail triggers treated with same rigor as standard application errors" — logged as scores on traces with timestamps.
- **Source:** LangSmith, Langfuse documentation (2026)
- **Implication for ControlPlane:** Every ControlPlane decision must produce a structured audit event (requestId, timestamp, model, risk scores, decision, evidence). This is our observability requirement.

---

## 10. Technology Stack Research

### Claim: Next.js 14/15 + TypeScript is current standard for enterprise dashboard prototypes
- **Evidence:** Dominant framework choice for full-stack TypeScript applications. App Router, Server Components, and API Routes support our architecture cleanly.
- **Source:** Vercel documentation, Next.js official docs (2026)
- **Implication for ControlPlane:** Use Next.js with TypeScript. Avoids separate frontend/backend deployment complexity.

### Claim: SQLite (via better-sqlite3) is sufficient for prototype persistence, no external DB required
- **Evidence:** SQLite is production-grade for read-heavy workloads under moderate concurrency. For a competition prototype, eliminates all database setup complexity.
- **Source:** SQLite official documentation (2026)
- **Implication for ControlPlane:** Use SQLite for audit log persistence. Simple, zero-config, ships with the repo. Noted limitation: not suitable for production multi-node deployment.

### Claim: Tailwind CSS v3/v4 is standard for rapid enterprise UI development
- **Evidence:** Widespread adoption, utility-first approach enables rapid prototyping without CSS debt.
- **Source:** Tailwind CSS official documentation (2026)
- **Implication for ControlPlane:** Use Tailwind for all UI styling.

---

## 11. OWASP GenAI LLM Top 10 (2026) — Relevant Items

| Rank | Risk | ControlPlane Response |
|------|------|----------------------|
| LLM01 | Prompt Injection | Responsibility Engine: injection pattern detection |
| LLM02 | Sensitive Information Disclosure | Responsibility Engine: PII detection + EDIT/BLOCK |
| LLM03 | Supply Chain | Architecture: explicit model abstraction layer |
| LLM06 | Excessive Agency | Cost Engine: agent loop detection → BLOCK |
| LLM08 | Vector and Embedding Weaknesses | Performance Engine: grounding verification |
| LLM09 | Misinformation | Performance Engine: evidence-based verification |

---

## 12. Regulatory Context

### EU AI Act (2024/2026 implementation)
- High-risk AI systems require audit trails, human oversight, and risk management
- ControlPlane's audit log + Control Desk directly supports EU AI Act compliance narrative

### NIST AI RMF
- Govern, Map, Measure, Manage framework
- ControlPlane's three engines map to Measure (detect) and Manage (decide + act)

**Implication for ControlPlane:** Compliance narrative (EU AI Act, NIST AI RMF) strengthens business case in competition. Add to ROUND2_TECHNICAL_BRIEF.md.
