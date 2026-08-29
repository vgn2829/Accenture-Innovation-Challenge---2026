# Evaluation State Audit

## Overview
This audit examines state lifecycle across Evaluation (`/evaluation` and `/evaluation/datasets`), data ingestion, evaluation execution, and cleanup.

## State Transitions
1. **Initial Unloaded State**:
   - `upload === null`, `result === null`
   - UI shows clear empty state without fabricated percentages or metrics.
2. **Ingested State**:
   - `upload !== null`, `result === null`
   - File metadata, column schema, PII detection, and mapping suggestions are visible.
   - Any prior run results must be cleared immediately.
3. **Evaluation Running State**:
   - `busy === true`
   - Interactive progress indicators; actions disabled to prevent race conditions.
4. **Evaluation Completed State (Results Console)**:
   - `result !== null`
   - Displays real data: filename, total cases, active profile, policy version, execution timestamp, source classification (`USER_UPLOADED`).
   - 4 Action Counters (RELEASE, EDIT, BLOCK, ESCALATE) populated directly from `result.decisionDistribution`.
   - Filterable and searchable per-case decision table with inspect capability.
   - Trust and evaluation metrics displayed with "NOT ESTABLISHED" when ground-truth labels are absent.
5. **Deletion State**:
   - Calling DELETE clears server-side memory for the dataset and resets local client state (`upload = null`, `result = null`, `mapping = {}`).
