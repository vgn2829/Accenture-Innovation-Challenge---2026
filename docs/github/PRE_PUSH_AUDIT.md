# ControlPlane.ai Pre-Push Repository Audit

Date: 2026-08-27
Branch: `main`
Scope: local repository preparation only. No files were staged, committed, deleted, remote-configured, or pushed by this audit.

## Working-tree inventory

### Modified tracked files

- `.gitignore`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISION_LOG.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/SECURITY.md`
- `package-lock.json`
- `package.json`
- `tsconfig.json`

### Deleted tracked files

| File | Assessment | Evidence |
| --- | --- | --- |
| `app/favicon.ico` | KEEP DELETED | Matching replacement exists at `src/app/favicon.ico`. |
| `app/globals.css` | KEEP DELETED | Matching replacement exists at `src/app/globals.css`; project uses `src/app`. |
| `app/layout.tsx` | KEEP DELETED | Replaced by the ControlPlane layout at `src/app/layout.tsx`. |
| `app/page.tsx` | KEEP DELETED | Replaced by the ControlPlane application page at `src/app/page.tsx`. |

These deletions are consistent with the documented migration from the Create Next App root layout to the application under `src/app`. They do not appear accidental. Do not restore automatically.

### Untracked files

#### Application and configuration candidates — KEEP

- `.env.example`
- `.nvmrc`
- `DESIGN-mastercard.md`
- `vitest.config.mts`
- `scripts/reset-demo.mjs`
- `scripts/reset-demo.ts`
- `src/app/api/analyze/route.ts`
- `src/app/api/controldesk/[id]/route.ts`
- `src/app/api/controldesk/route.ts`
- `src/app/api/decisions/[id]/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/demo/reset/route.ts`
- `src/app/api/evaluation/datasets/[id]/feedback/route.ts`
- `src/app/api/evaluation/datasets/[id]/route.ts`
- `src/app/api/evaluation/datasets/[id]/run/route.ts`
- `src/app/api/evaluation/datasets/route.ts`
- `src/app/api/evaluation/route.ts`
- `src/app/api/metrics/route.ts`
- `src/app/api/simulate/[scenario]/route.ts`
- `src/app/controldesk/page.tsx`
- `src/app/decisions/[id]/page.tsx`
- `src/app/decisions/page.tsx`
- `src/app/evaluation/datasets/page.tsx`
- `src/app/evaluation/page.tsx`
- `src/app/favicon.ico`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/simulate/page.tsx`
- `src/components/DecisionBadge.tsx`
- `src/components/EvidenceCard.tsx`
- `src/components/Navbar.tsx`
- `src/components/RiskMeter.tsx`
- `src/components/VerificationPathStepper.tsx`
- `src/design/tokens.ts`
- `src/lib/ai/semantic-evaluator.ts`
- `src/lib/dataset-lab/access.ts`
- `src/lib/dataset-lab/adapters.ts`
- `src/lib/dataset-lab/evaluate.ts`
- `src/lib/dataset-lab/normalize.ts`
- `src/lib/dataset-lab/profile.ts`
- `src/lib/dataset-lab/store.ts`
- `src/lib/dataset-lab/types.ts`
- `src/lib/db/client.ts`
- `src/lib/db/operations.ts`
- `src/lib/db/schema.ts`
- `src/lib/decision/decision-engine.ts`
- `src/lib/decision/risk-fusion.ts`
- `src/lib/engines/consistency-checker.ts`
- `src/lib/engines/cost-engine.ts`
- `src/lib/engines/evidence-verifier.ts`
- `src/lib/engines/injection-detector.ts`
- `src/lib/engines/loop-detector.ts`
- `src/lib/engines/performance-engine.ts`
- `src/lib/engines/pii-detector.ts`
- `src/lib/engines/responsibility-engine.ts`
- `src/lib/engines/retry-detector.ts`
- `src/lib/engines/safety-policy.ts`
- `src/lib/engines/token-analyzer.ts`
- `src/lib/evaluation/evaluation-runner.ts`
- `src/lib/evidence/trusted-records.ts`
- `src/lib/fixtures/scenarios.ts`
- `src/lib/orchestrator/verification-orchestrator.ts`
- `src/lib/verification/claim-classifier.ts`
- `src/lib/verification/use-case-profiles.ts`
- `src/lib/verification/verification-policy.ts`
- `src/proxy.ts`
- `src/types/index.ts`

#### Tests — KEEP, pending review/staging

- `src/tests/adversarial/api-hardening.test.ts`
- `src/tests/adversarial/brief-alignment.test.ts`
- `src/tests/adversarial/remediation.test.ts`
- `src/tests/api/api-routes.test.ts`
- `src/tests/dataset-lab/dataset-lab.test.ts`
- `src/tests/decision/decision-engine.test.ts`
- `src/tests/decision/risk-fusion.test.ts`
- `src/tests/e2e/golden-path.test.ts`
- `src/tests/engines/cost.test.ts`
- `src/tests/engines/performance.test.ts`
- `src/tests/engines/responsibility.test.ts`
- `src/tests/evaluation/evaluation-runner.test.ts`
- `src/tests/final-pass/final-integrity.test.ts`
- `src/tests/m1-foundation.test.ts`
- `src/tests/orchestrator/orchestrator.test.ts`
- `src/tests/verification/profile-policy.test.ts`

#### Documentation — KEEP, pending review/staging

- `docs/COMPETITIVE_POSITIONING.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`
- `docs/FINAL_COMPETITION_READINESS.md`
- `docs/FINAL_DEMO_CHECKLIST.md`
- `docs/FINAL_JUDGE_SHEET.md`
- `docs/FINAL_VERIFICATION_REPORT.md`
- `docs/JUDGE_QA.md`
- `docs/ROUND2_TECHNICAL_BRIEF.md`
- `docs/audit/AUDIT_PLAN.md`
- `docs/audit/CLAIM_VERIFICATION.md`
- `docs/audit/COMPETITIVE_NOVELTY_AUDIT.md`
- `docs/audit/FINAL_AUDIT_SCORECARD.md`
- `docs/audit/FIX_PLAN.md`
- `docs/audit/MASTER_AUDIT_REPORT.md`
- `docs/audit/PERFORMANCE_AUDIT.md`
- `docs/audit/REPOSITORY_MAP.md`
- `docs/audit/RISK_SCORE_AUDIT.md`
- `docs/brief-alignment/ACCENTURE_BRIEF_MAPPING.md`
- `docs/brief-alignment/DATASET_LAB_REPORT.md`
- `docs/brief-alignment/DATASET_STRATEGY.md`
- `docs/brief-alignment/EVALUATION_ARCHITECTURE.md`
- `docs/brief-alignment/EVALUATION_REPORT.md`
- `docs/brief-alignment/FEEDBACK_LOOP_DESIGN.md`
- `docs/brief-alignment/FINAL_BRIEF_SCORECARD.md`
- `docs/brief-alignment/FINAL_DATASET_LAB_SCORECARD.md`
- `docs/brief-alignment/FINAL_IMPLEMENTATION_PLAN.md`
- `docs/brief-alignment/FIX_PLAN.md`
- `docs/brief-alignment/GAP_ANALYSIS.md`
- `docs/brief-alignment/USE_CASE_POLICY_DESIGN.md`
- `docs/final-pass/BRIEF_GAP_AUDIT.md`
- `docs/final-pass/DATASET_SECURITY_AUDIT.md`
- `docs/final-pass/DESIGN_ALIGNMENT_AUDIT.md`
- `docs/final-pass/DESIGN_ALIGNMENT_FINAL.md`
- `docs/final-pass/FINAL_FIX_PLAN.md`
- `docs/final-pass/FINAL_PASS_REPORT.md`
- `docs/final-pass/INTERACTION_AUDIT.md`
- `docs/final-pass/INTERACTION_MATRIX.md`
- `docs/final-pass/STATE_AUDIT.md`
- `docs/final-pass/UX_AUDIT.md`
- `docs/production/COMPLIANCE_MATRIX.md`
- `docs/production/COST_MODEL.md`
- `docs/production/DATA_PROTECTION.md`
- `docs/production/DECISION_LOG.md`
- `docs/production/DISASTER_RECOVERY.md`
- `docs/production/IMPLEMENTATION_STATUS.md`
- `docs/production/MIGRATION_PLAN.md`
- `docs/production/OBSERVABILITY.md`
- `docs/production/OPERATIONS.md`
- `docs/production/PRODUCTION_ARCHITECTURE.md`
- `docs/production/PRODUCTION_GAP_ANALYSIS.md`
- `docs/production/PRODUCTION_MASTER_PLAN.md`
- `docs/production/PRODUCTION_TEST_PLAN.md`
- `docs/production/RELIABILITY_REQUIREMENTS.md`
- `docs/production/SECURITY_REQUIREMENTS.md`
- `docs/production/THREAT_MODEL.md`
- `docs/remediation/AI_EVALUATION_DESIGN.md`
- `docs/remediation/REMEDIATION_DECISION_LOG.md`
- `docs/remediation/REMEDIATION_PLAN.md`
- `docs/remediation/REMEDIATION_RESULTS.md`
- `docs/remediation/REMEDIATION_STATUS.md`
- `docs/remediation/SAFETY_SEMANTICS.md`
- `docs/remediation/TRUST_BOUNDARY.md`
- `docs/remediation/VERIFICATION_POLICY.md`
- `docs/github/PRE_PUSH_AUDIT.md`

#### Evaluation assets — KEEP core assets; USER DECISION for generated results

- `evaluation/README.md`
- `evaluation/datasets/synthetic-seeds.json`
- `evaluation/reports/latest.md`
- `evaluation/schema.json`
- `evaluation/results/latest.json`
- `evaluation/results/dataset-*.json` (generated result artifacts; review whether all historical runs belong in the public submission)

#### Agent/generated artifact — IGNORE

- `graphify-out/cache/stat-index.json` — generated graphify cache, not application source or competition documentation; `/graphify-out/` is now ignored.

## Files intended to ignore/remove

- `.env`, `.env.local`, and other environment secrets — already ignored.
- `data/` and local SQLite databases — already ignored.
- `node_modules/`, `.next/`, build output, logs, TypeScript build info, `.DS_Store` — already ignored.
- `graphify-out/` — generated tool cache; ignored by the updated `/graphify-out/` rule and not intended for the public repository.
- Generated `evaluation/results/dataset-*.json` files — not automatically ignored because they may be intended evidence; user must choose which results to publish.

## Repository checks

- Required public paths are present locally: `README.md`, `package.json`, `package-lock.json`, `.nvmrc`, `.env.example`, `src/`, tests under `src/tests/`, `scripts/`, `docs/`, and `evaluation/`.
- No local machine absolute path appears in application or documentation files.
- No `.env` or credential file is present; `.env.example` contains placeholders only.
- Local SQLite artifacts found under `data/` are ignored and must not be staged.

## Staging status

Nothing is staged. This document is an inventory and review aid, not an approval to stage or commit files.
