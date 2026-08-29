# Evaluation Results Audit

## Data Flow Trace

### 1. Dataset upload
POST /api/evaluation/datasets
→ parses CSV/JSON/JSONL
→ profiles dataset (DatasetProfile)
→ stores in in-memory Map (TTL=30min, max 10 datasets)
→ returns: datasetId, profile, validation, trustClass='USER_UPLOADED'

### 2. Evaluation run
POST /api/evaluation/datasets/[id]/run
→ normalizeAndMap() → produces CanonicalEvaluationCase[]
→ evaluateCanonicalCases() → runs VerificationOrchestrator for each case
→ computes decisionDistribution {RELEASE, EDIT, BLOCK, ESCALATE}
→ computes failures[] (rows where predicted ≠ expected)
→ computes metrics (accuracy|null, falseReleaseRate|null, etc.)
→ writes to evaluation/results/dataset-[runId].json (WITHOUT raw responses)
→ returns: { result: DatasetRunResult, comparisons, modeComparison }

**CRITICAL: allRows is computed internally but NOT returned in the API response.**
Only failures[] is in the response. All 4 decision counts are in decisionDistribution.
The full per-case breakdown is NOT available from the API response.

### 3. Result persistence
- DatasetRunResult is stored in the in-memory dataset store (via addRun)
- Individual row decisions are NOT written to the SQLite decisions table
- Therefore, /decisions/[requestId] does NOT exist for dataset evaluation cases
- The Inspect button CANNOT link to /decisions/[id] for dataset evaluation rows

### 4. What IS available from the run result

DatasetRunResult contains:
- runId, datasetId, fileName, trustClass, profile, policyVersion, mode, splitName
- timestamp, caseCount, labeledCount, unlabeledCount
- metrics: { accuracy, falseReleaseRate, falseBlockRate, escalationRecall, ... } — all nullable
- tierDistribution: { tier0, tier1, tier2 }
- decisionDistribution: { RELEASE, EDIT, BLOCK, ESCALATE } — ALWAYS present, real counts
- latency: { averageMs, p50Ms, p95Ms, p99Ms }
- failures: DatasetRunRow[] — only rows where predicted ≠ expected (labeled mismatches)
- limitations: string[]

DatasetRunRow contains:
- caseId, expectedDecision?, predictedDecision, expectedVerificationState?, predictedVerificationState
- verificationTier (0|1|2), risk { performance, cost, responsibility, composite, businessImpact }
- evidenceSource, policyVersion, latencyMs, evaluatorCalls
- passedDecision (null if no label), passedVerificationState (null if no label)
- originalResponse, reason

**THERE IS NO allRows IN THE API RESPONSE.** Only failures.

## Gaps identified

| Gap | Severity |
|-----|----------|
| Full case list not returned from run API — only failures | HIGH |
| No per-case decisions DB row for dataset evaluations | HIGH |
| Inspect button cannot link to /decisions/[id] (no record) | HIGH |
| No filter by decision (no data to filter on UI) | HIGH |
| decisionDistribution is present but used only for tier tiles | MEDIUM |
| Result section doesn't jump to top after run completes | MEDIUM |
| Previous result persists when new dataset uploaded | LOW (fixed) |

## Fix strategy

1. **Modify run API to return allRows** (not just failures) — truncated to first 200 for UI
2. **Simulate API already writes to decisions DB**, so dataset eval cases can optionally be persisted too — but this conflicts with the "uploaded data never becomes trusted evidence" rule. Best approach: **don't persist to decisions DB; instead show inline per-case detail in the results UI without requiring a /decisions/[id] link**.
3. **Inspect button** should open an inline case detail panel in the results UI, or navigate to /decisions/[id] only if the record was previously persisted by simulate (impossible for dataset eval cases). Safest: inline modal with all available data.
4. **Decision filter tabs** driven by decisionDistribution + allRows
