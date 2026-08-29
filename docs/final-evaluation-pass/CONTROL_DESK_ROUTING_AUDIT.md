# Control Desk Routing Audit

## Core Invariant
Only decisions where `decision === 'ESCALATE'` must enter the Human Control Desk queue.
- `RELEASE` -> Direct release to caller (Low risk / Verified)
- `EDIT` -> Safe automated remediation/redaction applied
- `BLOCK` -> Prohibited or policy violation response terminated
- `ESCALATE` -> High-impact uncertainty, missing required evidence, ambiguous high-impact cases, detector disagreement, or novel cases requiring human supervisor review.

## Verification of Backend Routing
1. In `src/lib/db/operations.ts`:
   ```ts
   export function persistDecision(response: AnalyzeResponse): void {
     const db = getDb();
     const transaction = db.transaction(() => {
       insertDecision(response);
       if (response.decision === 'ESCALATE') insertControlDeskCase(response);
     });
     transaction();
   }
   ```
2. The Control Desk queue query in `getControlDeskCases('PENDING')` retrieves only unadjudicated escalated records.
3. Adjudication actions (`APPROVE_RELEASE`, `APPROVE_WITH_EDIT`, `CONFIRM_BLOCK`, `ADD_NOTE`):
   - Mutates case status from `PENDING` to `RESOLVED` (except `ADD_NOTE` which keeps it pending).
   - Records feedback event in SQLite for continuous auditability.
   - Repeated resolution attempts on already-resolved cases return HTTP 409 Conflict.
