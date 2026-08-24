# ControlPlane.ai — Test Plan

**Version:** 1.0  
**Date:** 2026-08-24  
**Test Framework:** Vitest

---

## Testing Philosophy

- Unit test every detector in isolation
- Integration test the full request → decision pipeline
- Scenario test all four demo scenarios for deterministic outcomes
- Failure test system resilience (fail-safe behavior)

**Target:** ≥90% pass rate before declaring any milestone complete.

---

## Unit Tests

### `PIIDetector`

```
✓ detects email address: basic (user@domain.com)
✓ detects email address: subdomain (user@sub.domain.co.in)
✓ detects phone: E.164 format (+91-98765-43210)
✓ detects phone: local Indian format (98765 43210)
✓ detects credit card: 16-digit Luhn-valid
✓ detects credit card: spaced format (4111 1111 1111 1111)
✓ rejects non-Luhn credit card number
✓ detects Aadhaar: 12-digit pattern
✓ detects PAN: AAAA9999A format
✓ returns empty array for clean text
✓ detects multiple PII in same text
✓ returns correct severity (critical for phone/email)
✓ does not throw on empty string
✓ does not throw on very long string (10,000 chars)
```

### `InjectionDetector`

```
✓ detects "Ignore previous instructions"
✓ detects "You are now [role]" override patterns
✓ detects "Forget your system prompt" patterns
✓ detects nested instruction patterns
✓ returns NONE for clean response
✓ returns NONE for legitimate role mentions ("you are a helpful assistant")
✓ returns correct severity (critical for override patterns)
✓ handles empty string
```

### `EvidenceVerifier`

```
✓ detects refund amount conflict (AI claims processed, record shows not)
✓ detects status conflict (AI claims confirmed, record shows pending)
✓ returns CONSISTENT when AI matches record
✓ returns UNCERTAIN when no matching record provided
✓ extracts amount from "₹24,500" correctly
✓ extracts amount from "$24,500" correctly
✓ extracts amount from "24500" correctly
✓ handles missing businessRecords gracefully (returns UNCERTAIN, not error)
✓ detects numerical discrepancy (claimed 24500, record 0)
✓ does not throw on malformed business record
```

### `LoopDetector`

```
✓ detects same tool called 4+ times in session history
✓ detects session cost over budget threshold
✓ returns NORMAL for single tool call
✓ returns NORMAL for different tool calls
✓ handles empty session history
✓ handles null session history
```

### `TokenAnalyzer`

```
✓ correctly estimates token count for English text
✓ correctly estimates cost for given model + token count
✓ labels cost estimates as ESTIMATED
✓ flags extremely large responses (>2000 tokens)
✓ flags extremely large context (>8000 tokens input)
✓ handles empty response
```

### `RiskFusion`

```
✓ produces composite score weighted by business impact
✓ critical businessImpact amplifies composite score
✓ low businessImpact reduces composite score
✓ all-zero signals produce near-zero composite
✓ single critical signal produces high composite
✓ composite is always between 0 and 100
✓ returns dominant signals (top 3 by severity)
```

### `DecisionEngine`

```
✓ produces RELEASE for low composite risk
✓ produces BLOCK for critical evidence conflict + HIGH impact
✓ produces BLOCK for critical PII + HIGH impact
✓ produces EDIT for PII + MEDIUM impact (edit safe)
✓ produces ESCALATE for uncertain + HIGH impact
✓ produces ESCALATE for detector disagreement + HIGH impact
✓ produces ESCALATE by default when uncertain (fail-safe)
✓ BLOCK rules take priority over ESCALATE rules
✓ ESCALATE rules take priority over EDIT rules
✓ never produces RELEASE for critical PII
✓ never produces EDIT when editIsSafe = false
✓ decision includes humanReadable reason
✓ decision includes confidence score
```

---

## Integration Tests

### `POST /api/analyze` — Full Pipeline

```
✓ returns 200 for valid request body
✓ returns 400 for missing aiResponse
✓ returns 400 for missing model field
✓ returns requestId in response (generated if not provided)
✓ returns decision field (one of RELEASE/EDIT/BLOCK/ESCALATE)
✓ returns risk object with performance/cost/responsibility
✓ returns detections array (may be empty)
✓ returns verificationTier (0, 1, or 2)
✓ returns latencyMs > 0
✓ writes audit record to database
✓ returns editedResponse when decision = EDIT
✓ does not return editedResponse when decision = RELEASE
```

### `POST /api/controldesk/[id]` — Reviewer Action

```
✓ returns 200 for valid reviewer action on escalated case
✓ returns 404 for non-existent case ID
✓ returns 400 for invalid action type
✓ records reviewer action in database with timestamp
✓ marks case as RESOLVED after action
✓ does not allow action on already-resolved case
```

### `GET /api/decisions` — List

```
✓ returns paginated list of decisions
✓ default page size is 20
✓ filters by decision type (RELEASE/EDIT/BLOCK/ESCALATE)
✓ returns decisions in reverse chronological order
✓ returns empty array when no decisions exist
```

### `GET /api/metrics` — Dashboard

```
✓ returns total count
✓ returns breakdown by decision type
✓ returns verification tier distribution
✓ returns values as numbers, not strings
```

---

## Scenario Tests (Deterministic Outcomes Required)

### Scenario A — RELEASE

```
Input: fixture.scenarioA
Expected decision: RELEASE
Expected verificationTier: 0
Expected performanceRisk: < 30
Expected costRisk: < 20
Expected responsibilityRisk: < 20
Expected editedResponse: undefined
✓ passes deterministically across 10 consecutive runs
```

### Scenario B — EDIT

```
Input: fixture.scenarioB
Expected decision: EDIT
Expected verificationTier: 0
Expected detections: contains PIIDetection with type "phone"
Expected detections: contains PIIDetection with type "email"
Expected editedResponse: not null
Expected editedResponse: does not contain "+91-98765-43210"
Expected editedResponse: does not contain "ramesh.kumar@example.com"
Expected editedResponse: contains "[PHONE REDACTED]"
Expected editedResponse: contains "[EMAIL REDACTED]"
✓ passes deterministically across 10 consecutive runs
```

### Scenario C — BLOCK

```
Input: fixture.scenarioC
Expected decision: BLOCK
Expected verificationTier: 2
Expected performanceRisk: > 85
Expected detections: contains EvidenceConflict with type "FACTUAL_CONFLICT"
Expected evidence: contains claim "refund processed"
Expected evidence: contains record value "NOT_PROCESSED"
Expected editedResponse: undefined
✓ passes deterministically across 10 consecutive runs
```

### Scenario D — ESCALATE

```
Input: fixture.scenarioD
Expected decision: ESCALATE
Expected verificationTier: >= 1
Expected decisionReason: contains "uncertainty" or "disagreement" or "human review"
Expected: case appears in control desk queue after analysis
✓ passes deterministically across 10 consecutive runs
```

---

## Failure Tests

### External API Unavailable

```
✓ when OpenAI API returns 500: falls back to fixture provider
✓ when OpenAI API times out (>5s): falls back to fixture provider
✓ when OpenAI API returns malformed JSON: falls back to fixture provider
✓ response still returns a valid decision (ESCALATE by default)
```

### Malformed Input

```
✓ extremely long response (50,000 chars): truncated to maxLength, still processed
✓ null aiResponse: returns 400 with clear error message
✓ aiResponse with only whitespace: treated as empty, returns ESCALATE (uncertain)
✓ businessRecords with circular references: serialization handled safely
✓ unknown taskType: defaults to "general", continues processing
✓ unknown businessImpact: defaults to "medium", continues processing
```

### Database Failure

```
✓ when SQLite write fails: decision still returned to caller, error logged
✓ when SQLite read fails for metrics: returns cached/empty metrics, does not crash
✓ when database file corrupted: migration creates fresh schema on next start
```

### Concurrent Requests

```
✓ 10 concurrent /api/analyze requests: all complete successfully
✓ no race conditions in SQLite writes (better-sqlite3 is synchronous)
```

### Agent Loop Fixture

```
✓ session with 5 identical tool calls: LoopDetector returns CRITICAL signal
✓ decision for loop: BLOCK (cost > budget threshold)
```

---

## Performance Sanity Tests

```
✓ Tier 0 only path: latencyMs < 100ms
✓ Tier 0+1 path: latencyMs < 300ms
✓ Tier 0+1+2 path: latencyMs < 500ms
✓ Scenario C (BLOCK): latencyMs < 200ms
✓ Metrics endpoint: latencyMs < 50ms
✓ Decisions list endpoint (20 items): latencyMs < 100ms
```

---

## Security Tests

```
✓ SQL injection in aiResponse: parameterized query, no injection possible
✓ XSS in aiResponse displayed in UI: React escaping, no raw HTML
✓ Very large request body (>50KB): rejected with 413
✓ Missing Content-Type header: still handled or rejected cleanly
✓ Requests exceeding rate limit: returns 429
✓ .env file not in git (check .gitignore)
✓ No API keys in any committed file
✓ No real PII in fixture data (all synthetic)
```

---

## Test Execution Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/lib/engines/__tests__/PIIDetector.test.ts

# Run scenario tests only
npx vitest run src/lib/__tests__/scenarios.test.ts

# Watch mode during development
npx vitest
```

---

## Minimum Pass Thresholds

| Category | Minimum Pass Rate |
|----------|------------------|
| Unit tests | 95% |
| Integration tests | 90% |
| Scenario tests | 100% (all four must be deterministic) |
| Failure tests | 90% |
| Performance tests | 80% |
| Security tests | 100% |
