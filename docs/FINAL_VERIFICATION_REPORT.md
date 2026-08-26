# ControlPlane.ai — Final Competition Polish + Independent Verification

Date: 2026-08-24  
Scope: final remediation verification, new adversarial tests, local API load, UI truthfulness, packaging.

## Outcome

The prototype is materially stronger than the first audit baseline. The critical path now treats model output as untrusted data, resolves demo evidence only from an allow-listed `entityRef`, binds evidence to the named entity, uses explicit verification states, and collapses concurrent duplicate requests to one persisted result.

It is still a competition prototype. It is not ready for real enterprise traffic because authentication, tenant isolation, rate limiting, production persistence, broad PII coverage, and comprehensive fairness evaluation are absent.

## Verification evidence

- `npm test -- --reporter=dot`: **168/168 passed**, 16 test files, zero unhandled errors.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed; all expected pages and API routes compiled.
- Default Turbopack build: environment-blocked because its CSS worker cannot bind a port in this sandbox. It is not counted as verified.
- Secret pattern scan over tracked/unignored files: no key/private-key matches; `.env.example` contains placeholders only.
- Design source: internal design reference document (not included in this repository). The implemented design tokens and component styles are in `src/design/tokens.ts` and `src/app/globals.css`.

## New independent attack matrix

| Attack | Observed result | Verdict |
|---|---|---|
| Wrong trusted refund amount | BLOCK / CONFLICT | Pass |
| Trusted record + different order reference | BLOCK / CONFLICT | Pass after entity-binding fix |
| Unknown entity reference | ESCALATE / UNVERIFIED | Pass |
| Ambiguous financial wording | ESCALATE / UNVERIFIED | Pass |
| Zero-width prompt injection | BLOCK | Pass after normalization fix |
| Obfuscated email `[at]` / `[dot]` | RELEASE | Known P1 limitation |
| Duplicate financial amounts/currencies | BLOCK / CONFLICT | Pass for unsafe status |
| Subtle hiring proxy language | ESCALATE / Tier 2 | Pass after classifier broadening |
| `entityRef` over length bound | HTTP 400 | Pass |
| 100,001-character response | HTTP 413 | Pass |
| Ten simultaneous identical request IDs | Ten HTTP 200 responses, one request ID | Pass |
| Control Desk double resolution | First 200, replay 409 | Pass |
| Malformed/extra live evaluator fields | Uncertain fallback | Pass |

## Local load observation

Measured against local Next.js dev server on Node 22.22.3, macOS arm64, SQLite, clean general-information requests. This is not a production benchmark.

| Concurrent requests | Success | p50 | p95 | p99 |
|---:|---:|---:|---:|---:|
| 1 | 1/1 | 83.1ms | 83.1ms | 83.1ms |
| 10 | 10/10 | 26.2ms | 37.7ms | 37.7ms |
| 50 | 50/50 | 105.4ms | 168.3ms | 173.8ms |
| 100 | 100/100 | 200.9ms | 333.5ms | 344.1ms |

## Remaining trust risks

1. There is no real authentication, authorization, tenant isolation, or rate limiter.
2. SQLite and the in-process orchestration path are single-node prototype choices.
3. PII detection remains pattern-based; obfuscated and context-dependent PII can pass.
4. Offline fairness detection is a narrow heuristic. A semantically biased but novel phrase can pass unless the hiring policy gate itself forces review.
5. Live OpenAI evaluator behavior is schema-guarded but not independently benchmarked in this environment.
6. Competition rules and deliverable requirements for “Accenture Innovation Challenge 2026” were not found on a current official source; repository assumptions remain UNVERIFIED.
