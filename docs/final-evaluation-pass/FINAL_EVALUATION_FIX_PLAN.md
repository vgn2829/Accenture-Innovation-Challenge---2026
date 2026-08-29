# Final Evaluation Fix Plan

## Changes Required

### BACKEND: Run API — return allRows

**File:** src/app/api/evaluation/datasets/[id]/run/route.ts

The `evaluateCanonicalCases` function computes `allRows` internally but only exposes `failures` in the returned `DatasetRunResult`. To support the full case list in the UI without DB persistence:

- Modify `evaluateCanonicalCases` to return `allRows` as an additional field (capped at 200 for performance)
- The existing `failures` field stays for backward compat
- Raw `originalResponse` is already included in the row (it comes from `result.originalResponse`, the governed output, not the user's uploaded text)

**File:** src/lib/dataset-lab/types.ts  
Add `allRows?: DatasetRunRow[]` to `DatasetRunResult` (optional to preserve backward compat with tests)

**File:** src/lib/dataset-lab/evaluate.ts  
Return `allRows: allRows.slice(0, 200)` in the result object

### FRONTEND: Dataset Lab page — results console

**File:** src/app/evaluation/datasets/page.tsx

Complete rewrite of the results section to show:

1. EVALUATION COMPLETE banner with dataset, cases, profile, policy, run, source
2. Four decision count cards (RELEASE/EDIT/BLOCK/ESCALATE) from decisionDistribution — clickable to filter
3. Active filter tabs: All | Release | Edit | Block | Escalate
4. Search bar: case ID, claim type
5. Case list table with: caseId, claimType, impact, tier, verificationState, risk, decision, [Inspect]
6. Inspect button → inline case detail panel (NOT /decisions/[id] — dataset cases aren't in the DB)
7. Prominent ESCALATE badge "HUMAN REVIEW REQUIRED"
8. Trust & Quality metrics section (NOT ESTABLISHED when null)
9. Clear state: upload new file → clears result immediately
10. Delete dataset → clears result + upload state
11. Data provenance notice: dataset name + USER_UPLOADED source

### FRONTEND: Global Toast system

**File:** src/components/Toast.tsx (NEW)
**File:** src/lib/toast.ts (NEW context/hook)

A fixed top-right toast stack:
- Uses `aria-live="assertive"` for errors, `aria-live="polite"` for success
- SUCCESS: green icon + message
- ERROR: red icon + message  
- Auto-dismiss after 4s (success) / 6s (error)
- Manual dismiss X button
- z-index: 9999, position: fixed, top-right
- Stack multiple toasts

### FRONTEND: Control Desk page — use global toast

**File:** src/app/controldesk/page.tsx

Replace inline actionSuccess/actionError banners with global toast calls.
Show caseId in each toast message.

### FRONTEND: Case list not jumping to results after run

After `setResult(data.result)`, scroll to the results section using a ref.

### TESTING

**File:** src/tests/final-pass/final-integrity.test.ts (extend existing)
- Test allRows present in run result
- Test decisionDistribution sums to caseCount
- Test filter state

## Priority Order

1. Backend: add allRows to evaluate.ts + types.ts + run route response
2. Frontend: global Toast component + hook
3. Frontend: Control Desk use Toast
4. Frontend: Dataset Lab results console (major rewrite)
5. Tests
