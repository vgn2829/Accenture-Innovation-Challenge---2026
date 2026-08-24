# ControlPlane.ai — Security

**Version:** 1.0  
**Date:** 2026-08-24  
**Standard:** OWASP GenAI LLM Top 10 (2026), OWASP Web Top 10

---

## Security Posture

This is a competition prototype. The security posture is appropriate for:
- Local development
- Controlled demo environment
- Public code review (competition)

It is NOT hardened for:
- Internet-facing production deployment
- Multi-tenant environments
- Real customer PII processing

All limitations are documented.

---

## Secrets Management

### Rules
1. **NEVER commit API keys, passwords, or tokens to the repository.**
2. All secrets are loaded from environment variables only.
3. `.env` file is in `.gitignore`.
4. `.env.example` is committed with safe placeholder values.

### Environment Variables

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_PATH=./data/controlplane.db
DEMO_MODE=false
RATE_LIMIT_RPM=100
```

### Verification
Before any commit: `grep -r "sk-" . --include="*.ts"` must return empty.

---

## Input Validation

### API Request Validation
- All API endpoints validate request body schema using TypeScript types + runtime checks
- `aiResponse` field: max 50,000 characters; truncated if exceeded with logged warning
- `businessRecords`: parsed as JSON; malformed JSON returns 400
- All string fields sanitized of null bytes
- Unknown fields stripped (not passed to downstream systems)

### SQL Injection
- All database interactions use parameterized queries (better-sqlite3 `stmt.run(...)` pattern)
- No string concatenation in SQL
- ORM-style helper functions used for all DB operations

### XSS
- All user content rendered via React JSX (automatic escaping)
- No `dangerouslySetInnerHTML` with untrusted content
- AI response content is displayed as text, not HTML

### Request Size
- Maximum request body: 50KB
- Enforced via Next.js middleware before reaching API handlers
- Returns 413 Payload Too Large for oversized requests

---

## Rate Limiting

- 100 requests per minute per IP (configurable via `RATE_LIMIT_RPM`)
- Implemented in Next.js middleware
- Returns 429 Too Many Requests with `Retry-After` header
- Note: In-memory rate limiter (resets on server restart); acceptable for prototype

---

## AI Output Handling

### Untrusted Model Output Principle
AI-generated content is treated as untrusted until verified by ControlPlane engines.

### Specific Controls
1. **No eval() on model output** — model responses are never executed
2. **No dangerouslySetInnerHTML** — model responses displayed as plain text or escaped HTML
3. **Claim extraction via regex** — not by re-asking the model (eliminates LLM dependency in critical path)
4. **Evidence verification is deterministic** — business record lookup does not rely on model interpretation

### Prompt Injection Defense
- ControlPlane's own API prompts (for Tier 2 LLM eval) use structured system/user separation
- External content (AI responses being analyzed) passed as data, not instructions
- XML-style delimiters used in any LLM prompt constructed internally

---

## Authentication & Authorization

### Prototype State
No real authentication in this prototype. This is explicitly a demo limitation.

### What IS Implemented
- API routes are rate-limited
- Control Desk actions require a `reviewerId` field (simulated reviewer identity)
- Reviewer ID is logged in audit trail

### What Is NOT Implemented (documented limitation)
- Real OAuth / JWT authentication
- Role-based access control
- Session management
- Multi-user isolation

---

## PII in Prototype Data

### Fixture Data
All fixture data (Scenario A, B, C, D) uses **synthetic, fictional data only**:
- Phone numbers: follow E.164 format but are not real registered numbers
- Email addresses: use `@example.com` domain (RFC 2606 reserved)
- Names: fictional
- Financial amounts: illustrative only
- Business records: fictional

### No Real PII
The prototype never processes real customer PII.  
The database contains only demo/fixture records.

---

## SSRF Protection

The prototype does NOT make outbound HTTP requests based on user-supplied URLs.  
The only external HTTP call is to OpenAI API using a hardcoded endpoint.  
No URL is accepted as input and fetched.

---

## Dependency Security

### Policy
- Use only well-known, widely-adopted packages
- Pin exact versions in `package.json`
- Run `npm audit` before final submission
- No packages from unverified/unknown authors

### Key Dependencies (expected)
- `next` — Vercel, widely audited
- `react`, `react-dom` — Meta, widely audited
- `better-sqlite3` — SQLite binding, widely used
- `lucide-react` — Lucide team, icons only
- `recharts` — Recharts org, visualization only
- `openai` — OpenAI official SDK
- `vitest` — Vite team, test only

---

## Audit Log Security

- Audit records are **append-only** (no DELETE API exists)
- Audit records include all risk signals, evidence, and decisions
- No audit record contains real PII (only synthetic fixture data)
- Reviewer actions are logged with timestamp and reviewerId

---

## Known Limitations (Competition Prototype)

| Limitation | Risk Level | Mitigation |
|------------|------------|------------|
| No real authentication | MEDIUM | Documented; acceptable for demo |
| In-memory rate limiter | LOW | Sufficient for demo; noted in README |
| SQLite (single-node) | LOW | Documented; production would use PostgreSQL |
| API key in .env (not secrets manager) | LOW | Never committed; .env.example used |
| No TLS enforcement in dev | LOW | Not internet-facing in demo context |
| Control Desk has no real RBAC | MEDIUM | Documented limitation |

---

## Security Checklist (Pre-Submission)

- [ ] `git log --all --oneline | xargs git show | grep -i "sk-"` returns empty
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has only placeholder values
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] No `dangerouslySetInnerHTML` with model output
- [ ] No `eval()` anywhere in codebase
- [ ] All SQL uses parameterized queries (search for string concat with SQL keywords)
- [ ] Request size limit middleware is active
- [ ] Fixture data contains no real PII
- [ ] README clearly states: "This is a prototype; not production-ready"
