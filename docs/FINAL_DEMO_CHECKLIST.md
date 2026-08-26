# Final Demo Checklist

## Before recording or judging

- Run `npm install` on Node 20.x or use the pinned `better-sqlite3` compatibility.
- Run `npm test`, `npm run typecheck`, `npm run lint`.
- Use `npx next build --webpack` for the verified production build in this environment.
- Set `DEMO_MODE=true` only for the local demo and keep the reset token private.
- Confirm `/api/metrics` and `/api/controldesk` return 200.
- Start from a clean demo database or use the authorized reset control.

## 90-second path

1. Open `/simulate`; start on Scenario C.
2. Execute it and point to: intercepted response, `REFUND_8921` trusted record, Tier 2, `CONFLICT`, and BLOCK.
3. Open the audit case file and point to claim type, evidence state, business impact, and canonical evidence.
4. Run Scenario B and show safe PII EDIT.
5. Run Scenario D or a hiring proxy and open `/controldesk`.
6. Resolve one case once; mention replay protection returns 409.
7. Return to Overview and describe the four actions, not a fabricated latency number.

## Do not say

- “Production-ready.”
- “Comprehensive fairness detection.”
- “80% of traffic is under 2ms.”
- “The API is authenticated or rate-limited.”
- “The current competition rules are verified.”
