# ControlPlane.ai — Judge Q&A & Technical Defense Guide

## Brief-alignment honesty note

The current evaluation corpus is synthetic and mechanism-oriented: 320 generated cases with 64 held out. Its metrics are regression evidence, not production accuracy or calibration. Public datasets, real customer traffic, production security, and regulatory compliance are not claimed.

**Accenture Innovation Challenge 2026**  
**Document Purpose:** Direct, technically honest, and rigorous answers to potential jury questions.  
**Rule:** Clearly distinguish **[Implemented Now in Prototype]** from **[Future Production Architecture]**.

---

## Category 1: Product & Value Proposition

### 1. What exactly is ControlPlane.ai?
**Answer:**
ControlPlane.ai is a runtime decision and governance layer for enterprise AI systems. It intercepts AI model completions before they reach end-users or downstream systems, evaluates their risk across Performance, Cost, and Responsibility, and deterministically executes one of four actions: RELEASE, EDIT, BLOCK, or ESCALATE.

### 2. Why isn't this just another AI guardrail?
**Answer:**
Traditional guardrails (e.g., Guardrails AI, AWS Bedrock Guardrails) are binary filters: they either block a request or pass it through. ControlPlane.ai is a **decision layer** that:
- Executes **Risk-Adaptive Verification** (scaling verification compute based on risk).
- Performs automated safe repair (**EDIT** for PII redaction).
- Provides an integrated **Human Control Desk** for complex policy edge cases.
- Unifies factual performance, token waste, and privacy into a single composite risk score.

### 3. What is actually novel about this architecture?
**Answer:**
The core novelty is **Risk-Adaptive Verification tied to a multi-engine Decision Hierarchy**:
- *Implemented Now:* Sub-millisecond Tier 0 pattern scans for all requests, escalating to Tier 1 (policy/loops) or Tier 2 (ground-truth database cross-checks) only when risk triggers fire.
- *Implemented Now:* Deterministic prioritization ($\text{BLOCK} \succ \text{ESCALATE} \succ \text{EDIT} \succ \text{RELEASE}$) rather than subjective model scoring.

### 4. Why do enterprises need another layer in their AI stack?
**Answer:**
Directly exposing LLM outputs to business systems or customers exposes enterprises to financial hallucinations, PII breaches, prompt injection, and regulatory fines. ControlPlane provides an immutable, transparent governance boundary that decouples safety policy from model vendor choice.

---

## Category 2: Performance & Hallucination Verification

### 5. How do you detect a confidently wrong response?
**Answer:**
- *Implemented Now:* We extract factual claims (e.g., *"Your refund of ₹24,500 has been processed"*) and cross-check them against the enterprise's authoritative ground-truth database (e.g., Order #ORD-8921 -> `Status: REJECTED`). When there is a contradiction, the claim is flagged regardless of the model's high self-confidence.
- *Implemented Now:* `ConsistencyChecker` detects intra-sentence logical contradictions and polarity reversals.

### 6. Why not simply use an LLM-as-a-judge for everything?
**Answer:**
LLM judges introduce three severe problems in production:
1. **Extreme Latency:** Adding 500ms–2000ms to every interaction.
2. **Double Cost:** Doubling or tripling API token consumption.
3. **Circular Epistemology:** Asking a probabilistic LLM to verify a probabilistic LLM. Deterministic database records provide ground truth.

### 7. What happens when ground-truth evidence is unavailable?
**Answer:**
- *Implemented Now:* If an assertion cannot be matched to a database record, it is flagged as an `UNVERIFIED RECORD`. If the business impact is low, it passes at Tier 0; if the business impact is high or critical, the unverified claim elevates composite risk and routes to the Control Desk (`ESCALATE`).

### 8. What happens if the verifier itself makes a mistake?
**Answer:**
- *Implemented Now:* Our verifiers follow fail-safe defaults: any internal exception or ambiguity automatically escalates to a supervisor (`ESCALATE`) or conservative `BLOCK` rather than silently releasing ungrounded claims.

---

## Category 3: Cost Engine & Waste Prevention

### 9. How do you detect agent loops and token waste?
**Answer:**
- *Implemented Now:* `LoopDetector` inspects tool-call signatures and message delta history. If identical tool calls or alternating cyclic state changes are detected within a session, the request is flagged with elevated Cost Risk.
- *Implemented Now:* `RetryDetector` flags repeated retry sequences where the similarity delta between attempts is below threshold.

### 10. How do you calculate estimated cost savings?
**Answer:**
- *Implemented Now:* `TokenAnalyzer` calculates prompt-to-completion token counts and estimates avoided API costs based on standard GPT-4o pricing schemas ($2.50 / 1M prompt, $10.00 / 1M completion).
- *Implemented Now:* All cost and savings figures in the UI are explicitly tagged with `ESTIMATE`.

### 11. How would this integrate with real cloud provider billing?
**Answer:**
- *Future Production:* In production, ControlPlane connects to provider billing webhooks (AWS CloudWatch, Azure Cost Management, OpenAI Usage API) to ingest exact billed usage alongside our runtime token counter.

---

## Category 4: Responsibility, Privacy & Safety

### 12. How do you detect and redact PII without adding latency?
**Answer:**
- *Implemented Now:* `PIIDetector` uses optimized regex patterns combined with algorithmic checksums (Luhn algorithm for credit cards, format checks for Indian phone numbers, PAN cards, and Aadhaar numbers). It runs in **<1ms** and provides exact character offsets for safe string slicing and redaction.

### 13. How do you detect bias and fairness policy violations?
**Answer:**
- *Implemented Now:* `SafetyPolicyDetector` evaluates responses against explicit enterprise compliance rules (e.g., demographic preference keywords in hiring, unauthorized financial guarantees).
- *Implemented Now:* Detected demographic steering triggers `ESCALATE` to the Human Control Desk.

### 14. How do you minimize false positives in PII detection?
**Answer:**
- *Implemented Now:* We enforce algorithmic validation (e.g., Luhn checksum for 16-digit credit cards, area code validations for phone numbers) rather than pure arbitrary digit matching.

### 15. How does ControlPlane handle prompt injection?
**Answer:**
- *Implemented Now:* `InjectionDetector` scans for known jailbreak markers, delimiter escaping (`---`, ````system````), instruction override phrases (`Ignore previous instructions`), and roleplay bypass sequences. High-severity injection attempts trigger an immediate `BLOCK`.

---

## Category 5: Decisioning & Policy Enforcement

### 16. Why four distinct actions (RELEASE, EDIT, BLOCK, ESCALATE)?
**Answer:**
Two actions (Block/Pass) are insufficient for enterprise operations:
- `RELEASE`: Clean, fast pass.
- `EDIT`: Solves minor privacy infractions without frustrating users.
- `BLOCK`: Protects against critical financial or safety hazards.
- `ESCALATE`: Bridges automated AI with human supervisor judgment for complex edge cases.

### 17. Why does BLOCK take priority over ESCALATE?
**Answer:**
Safety-first fail-safe principle: If a response contains a known critical risk (e.g., confirmed severe factual contradiction or active prompt injection), it must be stopped immediately. We do not burden human supervisors with cases that are objectively dangerous.

### 18. When is an EDIT considered safe?
**Answer:**
`EDIT` is only permitted when:
1. All detected issues have the `editSafe: true` property (e.g., PII token replacements).
2. The overall composite risk remains below the critical threshold ($<65$).
3. No factual contradictions or structural loop failures exist in the response.

### 19. How do you determine business impact?
**Answer:**
- *Implemented Now:* Passed in the `AnalyzeRequest` metadata (`low`, `medium`, `high`, `critical`) based on task type (e.g., casual FAQ is `low`; refund processing or hiring evaluation is `high`/`critical`).
- *Future Production:* Contextual policy router that automatically infers business impact from authenticated tenant policies and downstream API targets.

---

## Category 6: Latency Strategy & Overhead

### 20. Doesn't adding a governance layer slow down AI interactions?
**Answer:**
- *Implemented Now:* Tier 0 scans execute in **<2ms** (sub-millisecond regex & pattern pass). For the 80%+ of enterprise traffic that is low-risk, the latency overhead is completely imperceptible to users compared to model generation time (which is typically 800ms–3000ms).
- *Implemented Now:* Heavyweight Tier 2 checks only run on the small fraction of requests that actually warrant deep verification.

### 21. Why not run deep verification on every single request?
**Answer:**
Running deep database lookups, entity extraction, and multi-engine verification on trivial responses wastes server resources, increases cloud latency, and creates unnecessary database load. Risk-adaptive tiering solves this.

---

## Category 7: Architecture & Scaling

### 22. Why did you use SQLite for the prototype?
**Answer:**
- *Implemented Now:* SQLite with WAL mode (`better-sqlite3`) provides zero-setup, self-contained, high-performance local persistence (<1ms read/write) with zero external database dependencies during judging.
- *Future Production:* Distributed ClickHouse for append-only audit event logs and PostgreSQL for Control Desk state.

### 23. Why Next.js App Router?
**Answer:**
- *Implemented Now:* Enables full-stack unification — compiled API route handlers and a server-rendered, responsive dashboard in a single codebase with unified TypeScript types.

### 24. How would ControlPlane scale to millions of requests per day?
**Answer:**
- *Future Production:* Deploying the stateless Tier 0/1 verification pipeline as a Rust/Wasm or Go edge worker (Cloudflare Workers / Envoy proxy) at the network edge, with asynchronous audit event streaming via Kafka to an analytical datastore.

### 25. How would you support multi-tenancy and RBAC?
**Answer:**
- *Future Production:* Partitioning data by `tenant_id` and `organization_id`, integrating SAML 2.0 / OIDC for enterprise SSO, and defining role-based access for Control Desk supervisors, compliance officers, and developers.

### 26. What happens if an internal detector crashes?
**Answer:**
- *Implemented Now:* Each detector is isolated in try-catch blocks. If a single detector throws an exception, it logs an anomaly and elevates the risk score to a conservative default (`ESCALATE`), preventing silent bypass.

---

## Category 8: AI & Intelligence Design

### 27. Where is AI used in ControlPlane vs. deterministic algorithms?
**Answer:**
- *Implemented Now:* We deliberately prioritize deterministic algorithms (regex, checksums, graph cycle detection, database foreign-key grounding) for safety-critical checks.
- *Implemented Now:* AI foundation models are the **objects of governance** (intercepted outputs from GPT-4o, Claude, etc.).
- *Future Production:* Embedding similarity models for semantic claim extraction and lightweight 100M SLM classifiers for nuanced tone and brand compliance.

### 28. Why are deterministic checks superior for enterprise governance?
**Answer:**
Deterministic rules are:
1. **Explainable:** Exact regex matches or database query results can be audited by human compliance officers.
2. **Reproducible:** 100% testable across automated CI/CD pipelines.
3. **Zero-Latency:** Microsecond execution times compared to multi-second LLM calls.

### 29. What components would you upgrade with ML in production?
**Answer:**
- *Future Production:* Named Entity Recognition (NER) models for international multi-lingual PII, fine-tuned cross-encoder models for semantic claim-evidence entailment, and anomaly detection models for novel prompt injection vectors.

---

## Category 9: Business Model & ROI

### 30. Who buys ControlPlane.ai?
**Answer:**
Chief Information Security Officers (CISOs), Heads of AI Platform Engineering, and Chief Compliance Officers in regulated industries (FinTech, Healthcare, Insurance, Customer Experience, and HR Tech).

### 31. What direct financial losses does ControlPlane prevent?
**Answer:**
1. **Financial Misinformation & Chargebacks:** Blocking false refund/transaction commitments (e.g., our ₹24,500 refund dispute scenario).
2. **Regulatory & Privacy Penalties:** Preventing GDPR, DPDP, and HIPAA fines from leaked customer PII.
3. **Token & Infrastructure Waste:** Terminating runaway autonomous agent loops and redundant retries.

### 32. How do you measure and prove ROI to customers?
**Answer:**
Through the ControlPlane Executive Dashboard:
- **Prevented Liability:** Total value of blocked hallucinated financial claims.
- **Privacy Compliance Score:** Volume of PII auto-redacted without human intervention.
- **Compute Efficiency Gain:** Sub-millisecond latency preserved on 80%+ of traffic via Risk-Adaptive Tiering compared to 100% heavyweight guardrails.
