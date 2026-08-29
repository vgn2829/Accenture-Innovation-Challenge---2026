# UI Issues — Master List

## NAVBAR

| # | Issue | Severity |
|---|-------|----------|
| N1 | Reset button present in navbar — should be removed from user-facing nav | HIGH |
| N2 | "OVERSIGHT LIVE" status pill present — decorative, should be removed | HIGH |
| N3 | "HERO DEMO" badge on Simulator nav item — remove | HIGH |
| N4 | `NEXT_PUBLIC_DEMO_RESET_TOKEN` exposed in browser JS (`process.env.NEXT_PUBLIC_DEMO_RESET_TOKEN`) | CRITICAL |
| N5 | "Control Desk" can wrap on some mid-size viewports due to gap/flex settings | MEDIUM |
| N6 | Brand lockup + nav links + reset pill + OVERSIGHT LIVE all compete for the same horizontal space causing layout pressure | HIGH |

## HOME PAGE

| # | Issue | Severity |
|---|-------|----------|
| H1 | Step 4 (Authoritative Action) has black background (`bg-[#141413]`) making it look like a selected/active CTA — must be visually uniform with Steps 1–3 | HIGH |
| H2 | No "Bring Your Data / Evaluate Your Data" CTA on home page — Dataset Lab is buried in Evaluation nav | MEDIUM |
| H3 | "TRUST & EVALUATION" banner already links to /evaluation but not to Dataset Lab specifically | LOW |
| H4 | Hero CTA hierarchy is OK but can be made more dominant (primary button size acceptable) | LOW |

## SIMULATOR

| # | Issue | Severity |
|---|-------|----------|
| S1 | `result` starts as `null` — clean initial state is correct, no preloaded result ✓ | OK |
| S2 | Scenario card `onClick` calls `selectScenario()` (not `runSimulation`) — correct ✓ | OK |
| S3 | Changing profile calls `setResult(null)` — correct ✓ | OK |
| S4 | No double-click protection on Run button — `disabled={running}` handles this ✓ | OK |
| S5 | "HERO SCENARIO C — CONTRADICTION FLOW" label uses em dash | LOW |

## CONTROL DESK

| # | Issue | Severity |
|---|-------|----------|
| C1 | Error on action uses `alert()` — not a user-friendly toast, violates toast requirements | HIGH |
| C2 | No error handling for network failures (4xx/5xx) beyond a generic alert | HIGH |
| C3 | `actionSuccess` state is an inline banner, not a dismissible toast system | MEDIUM |
| C4 | No shared toast system — each page handles its own feedback differently | HIGH |

## DATASET LAB

| # | Issue | Severity |
|---|-------|----------|
| D1 | Cookie is set by `proxy()` function in `src/proxy.ts` — but there is NO `middleware.ts` file, so the proxy is NEVER called. The cookie is never set. This is the root cause of the "Dataset Lab is disabled" error | CRITICAL |
| D2 | When cookie is missing, error message is "A valid Dataset Lab demo token is required" — not informative enough | HIGH |
| D3 | No `.env.local` exists — DEMO_MODE and DATASET_DEMO_TOKEN are not configured, causing all dataset API calls to fail with 403 | CRITICAL |
| D4 | Upload area is present but hidden behind the 403 error that users see before upload can happen | HIGH |
| D5 | No "NO DATASET LOADED" explicit empty state — the upload area exists but has no explicit empty state label | MEDIUM |

## EVALUATION

| # | Issue | Severity |
|---|-------|----------|
| E1 | Evaluation page shows "NOT RUN" labels correctly — no hardcoded fake metrics ✓ | OK |
| E2 | `/api/evaluation` reads from `evaluation/results/latest.json` — file does not exist in fresh installs, returns null correctly ✓ | OK |
| E3 | When `evaluation` is null, metrics show "NOT RUN" — this is the correct zero state ✓ | OK |
| E4 | Evaluation page lacks a clear "NO EVALUATION RUN YET" hero state — just shows "NOT RUN" in small metric tiles | MEDIUM |
| E5 | No dataset provenance shown after a run | MEDIUM |

## COPY / EM DASHES

| # | Location | Em dash usage |
|---|----------|---------------|
| EM1 | `src/app/layout.tsx:20` | `'ControlPlane.ai — Enterprise AI Decision Layer'` (page title — acceptable in meta title) |
| EM2 | Comments in source files | `// ControlPlane.ai — X` (non-user-facing) |
| EM3 | `VerificationPathStepper.tsx:106` | `Skipped — risk threshold not reached` (user-facing) |
| EM4 | `simulate/page.tsx:308` | `HERO SCENARIO C — CONTRADICTION FLOW` (user-facing) |
| EM5 | Dataset page latency display | `p50 — ms` (fallback when null) |

## DEAD UI

| # | Issue |
|---|-------|
| DU1 | Reset button in navbar calls API but uses `NEXT_PUBLIC_DEMO_RESET_TOKEN` (publicly exposed) — needs to be removed from nav |
| DU2 | No other dead buttons found — all actions are wired |
