# ControlPlane.ai — Future Ideas

> Ideas that are out of scope for Round 2 prototype.  
> Preserved here to prevent feature creep while maintaining strategic thinking.  
> Do NOT build these in Round 2.

---

## Deferred Features

### AI/ML Enhancements
- NER-based PII detection (spaCy/Hugging Face) — catches unstructured PII (names, addresses)
- Adversarially-trained lightweight safety classifier (fast, millisecond-level)
- Sentence-transformers-based semantic similarity for grounding
- Multi-sample consensus ("ChainPoll") for consistency verification
- Model reliability history database (per-model failure rates over time)
- Automated bias testing pipeline (fairness benchmarking)

### Cost Engine Enhancements
- Real provider cost API integration (OpenAI billing API, Anthropic billing API)
- Statistical process control for cost anomaly detection
- Per-session budget enforcement with real-time alerts
- Model routing recommendations (suggest cheaper model when safe)

### Enterprise Features
- Policy-as-code engine (YAML-based business rules, hot-reload)
- Multi-tenant data isolation (per-org database schemas)
- Real OAuth 2.0 / OIDC authentication
- Role-based access control (reviewer, admin, read-only)
- Webhook system (notify downstream systems on BLOCK/ESCALATE)
- Slack/Teams Control Desk notifications
- SLA tracking for review queue (time-to-review metrics)
- SIEM integration (Splunk, Datadog export)
- Compliance report export (EU AI Act audit format)

### Observability
- Real-time WebSocket decision feed (sub-second latency)
- Risk drift monitoring (automatic alerts when model behavior shifts)
- Evaluation dataset builder (capture decisions as labeled examples)
- A/B comparison (compare decision outcomes before/after policy change)
- Latency percentile dashboard (P50/P95/P99 per tier)

### Deployment
- Kubernetes deployment manifests
- Docker Compose for local multi-service
- Terraform infrastructure-as-code
- Health check endpoints
- Graceful shutdown handling
- Database migration tooling (Flyway/Drizzle)

### Provider Support
- Anthropic Claude adapter (ModelProvider implementation)
- Google Gemini adapter
- Azure OpenAI adapter
- AWS Bedrock adapter
- Open-source model adapter (Ollama)

### UI/UX
- Dark mode toggle
- Custom risk weight configuration UI
- Policy rule builder (drag-and-drop)
- Decision export (CSV, JSON)
- Team management UI
- Notification preferences

---

## Research Ideas (Not Validated)

- Latent-space similarity for detecting rephrased but identical claims
- Graph-based evidence linking (connect related claims across a session)
- Calibration curves for decision engine confidence scores
- RL-based verification depth optimizer (learns optimal tier thresholds from feedback)
