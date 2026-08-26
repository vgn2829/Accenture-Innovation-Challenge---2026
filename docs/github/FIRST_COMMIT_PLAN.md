# ControlPlane.ai — First Commit Plan

> **Audit Date:** 2026-08-27
> **Branch:** main
> **Status:** AUDIT COMPLETE — DO NOT STAGE/COMMIT UNTIL BLOCKING ITEMS AND USER DECISIONS ARE RESOLVED

---

## RESOLVED — Previous Blocking Items

### Tests: 168/168 PASSING ✅ (previously showed 22 failures)

**Root cause (resolved):** The 22-test failure was a `better-sqlite3` native ABI mismatch.
The `.node` binary was compiled for ABI 115 (Node 20) but the system was running Node 22
(ABI 127). Every test touching `new Database(...)` threw `Could not locate the bindings file`.

**Resolution:** `npm ci` on Node 22.22.3 recompiled the binding for ABI 127. All 22
previously-failing tests now pass. This was an infrastructure issue, not an application
regression.

**Additionally fixed:**
- `.nvmrc` updated from stale `20.13.1` → `22.22.3`
- `package.json` engines updated from `>=20.9.0 <21` → `>=22.12.0 <23`
- Dead links to `DESIGN-mastercard.md` removed from public docs
- Node version reference corrected in `FINAL_VERIFICATION_REPORT.md`

### Documentation claims — all accurate ✅

| File | Claim | Status |
|------|-------|--------|
| `README.md` badge | `Tests-168/168 Passing` | ✅ Verified current result |
| `docs/FINAL_VERIFICATION_REPORT.md` L14 | `168/168 passed` | ✅ Verified current result |
| `docs/FINAL_COMPETITION_READINESS.md` L20 | `168/168 tests` | ✅ Verified current result |

---


## COMMIT

Everything required for the working competition prototype:

### Core Application (all untracked — new files)
- `src/` — entire application source tree (app, components, lib, tests, types, proxy)
- `scripts/reset-demo.mjs` and `scripts/reset-demo.ts`
- `vitest.config.mts`

### Modified Tracked Files
- `.gitignore` — extended with data/, graphify-out/, env rules
- `README.md` — after correcting test-count badge
- `docs/ARCHITECTURE.md`
- `docs/DECISION_LOG.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/SECURITY.md`
- `package.json` and `package-lock.json`
- `tsconfig.json`

### New Documentation (untracked)
- `.env.example` — safe placeholders only, no real keys (verified)
- `.nvmrc`
- `docs/COMPETITIVE_POSITIONING.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`
- `docs/FINAL_COMPETITION_READINESS.md`
- `docs/FINAL_DEMO_CHECKLIST.md`
- `docs/FINAL_JUDGE_SHEET.md`
- `docs/FINAL_VERIFICATION_REPORT.md` (after correcting test count)
- `docs/JUDGE_QA.md`
- `docs/ROUND2_TECHNICAL_BRIEF.md`
- `docs/audit/` (all 8 documents)
- `docs/brief-alignment/` (all 12 documents)
- `docs/final-pass/` (all 9 documents)
- `docs/github/FIRST_COMMIT_PLAN.md` (this file)
- `docs/remediation/` (all 8 documents)

### Evaluation (core artifacts)
- `evaluation/README.md` — clearly discloses synthetic corpus
- `evaluation/schema.json`
- `evaluation/datasets/synthetic-seeds.json`
- `evaluation/reports/latest.md`

### Deletions to include
- `app/favicon.ico` (D) — replaced by `src/app/favicon.ico`
- `app/globals.css` (D) — replaced by `src/app/globals.css`
- `app/layout.tsx` (D) — replaced by `src/app/layout.tsx`
- `app/page.tsx` (D) — replaced by `src/app/page.tsx`

---

## IGNORE (covered by .gitignore — will not appear in commit)

- `node_modules/`
- `.next/`
- `data/` — all .db, .db-wal, .db-shm files
- `graphify-out/`
- `.env`, `.env.local`, `.env.*.local`
- `*.log`, `*.tmp`, `*.temp`
- `*.tsbuildinfo`
- `next-env.d.ts`
- `.DS_Store`
- `*.pem`
- `/coverage/`
- `.vercel`

---

## DELETE

No files recommended for automatic deletion at this time. All removals are USER DECISION items below.

---

## USER DECISION

### A. `DESIGN-mastercard.md` — Commit, rename, or exclude?

This file contains a detailed reverse-engineering analysis of Mastercard's visual design system, including proprietary font names (`MarkForMC`), brand colors, and layout methodology.

Referenced by:
- `docs/final-pass/DESIGN_ALIGNMENT_AUDIT.md` (as source)
- `docs/github/PRE_PUSH_AUDIT.md` (as listed file)
- `docs/FINAL_VERIFICATION_REPORT.md` (explains no `design.md` exists)

Options:
1. **COMMIT as-is** (`DESIGN-mastercard.md`) — no ref changes needed; exposes Mastercard brand analysis publicly
2. **RENAME to `DESIGN.md`** — update 3 reference files; reduces brand-specificity; advisable if judges inspect repo
3. **EXCLUDE** — add to `.gitignore` or delete; update 3 reference files; eliminates trademark exposure

Recommendation: Option 2 if judges inspect the repo. Option 3 if trademark sensitivity is a concern.

---

### B. `evaluation/results/` — 30 UUID-named dataset JSON files + `latest.json`

These are local dataset lab execution artifacts (~1KB each, 30 files covering Aug 25–27).

Options:
1. **COMMIT `latest.json` only** — keep canonical reproducible result; add `evaluation/results/dataset-*.json` to `.gitignore`
2. **COMMIT all 31 files** — full run history in repo
3. **COMMIT none** — exclude everything; runs reproducible via `npm run evaluate`

Recommendation: Option 1. The UUID files are scratch run artifacts with no documentary value beyond `latest.json`.

---

### C. `docs/production/` — 14 forward-looking production planning documents

Contains: production architecture, threat model, compliance matrix, cost model, disaster recovery, reliability requirements, migration plan, observability plan, operations runbook.

These describe a hypothetical future production deployment, not the current prototype.

Options:
1. **COMMIT all** — demonstrates ambition; risk of implying production readiness
2. **COMMIT with header caveat** — add note that these are planning documents, not deployed infrastructure
3. **EXCLUDE from first commit** — avoids over-claiming; can be added later

Recommendation: Option 2 — commit with a clear caveat note.

---

### D. `docs/audit/` — internal development process documents

Contains internal audit plans, master audit reports, fix plans, risk score audits, and repository maps generated during development. Not harmful but unusual as public-repo artifacts.

Options:
1. **COMMIT all** — fully transparent process
2. **EXCLUDE** — keep only external-facing documentation

---

## Pre-Commit Checklist

Before executing `git add` and `git commit`, verify all of the following:

```bash
npm test              # Must show 0 failed (currently 22 failing — BLOCKING)
npm run lint          # Must exit 0 (currently PASS)
npm run typecheck     # Must exit 0 (currently PASS)
npx next build        # Must complete successfully (currently PASS)
grep -r "168/168" README.md docs/  # Must return empty after doc corrections
```
