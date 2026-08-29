# FINAL UI FIX PLAN

## Priority Order

### CRITICAL (do first)
1. Create `middleware.ts` — proxy cookie is never invoked without it
2. Create `.env.local` with DEMO_MODE=true and DATASET_DEMO_TOKEN configured
3. Remove `NEXT_PUBLIC_DEMO_RESET_TOKEN` from env (token exposure)

### HIGH
4. Navbar: remove Reset button, OVERSIGHT LIVE pill, HERO DEMO badge
5. Navbar: add "Evaluate Your Data" or keep nav clean
6. Home page: fix Step 4 visual treatment (uniform with Steps 1–3)
7. Home page: add "Evaluate Your Data" CTA pointing to /evaluation/datasets
8. Control Desk: replace `alert()` with inline error banner (toast system)
9. Control Desk: improve error handling for 4xx/5xx
10. Create shared Toast/notification system

### MEDIUM
11. Dataset Lab: improve empty state messaging
12. Evaluation: add clear zero-state hero section
13. EM dash: fix user-facing occurrences in VerificationPathStepper, simulator

### VERIFICATION
- Run `npm test`
- Run `npm run typecheck`
- Run `npm run lint`
- Confirm dev server still running on port 3000
