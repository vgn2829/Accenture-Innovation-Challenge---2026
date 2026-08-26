# ControlPlane.ai — Decision Log

**Note:** Every significant architecture or product decision must be recorded here.  
**Format enforced:** DATE / DECISION / OPTIONS / CHOSEN / WHY / TRADEOFF / CONSEQUENCE

---

## DL-001: Technology Stack

**DATE:** 2026-08-24  
**DECISION:** Choose full-stack framework for prototype  
**OPTIONS CONSIDERED:**
- A: Python FastAPI backend + React frontend (two deployments)
- B: Next.js full-stack TypeScript (single deployment)
- C: Express.js + React (two deployments)

**CHOSEN:** B — Next.js 14 with TypeScript  
**WHY:**
- Single codebase, single deployment, faster to build
- TypeScript across frontend and backend enables shared types for engine interfaces
- API Routes provide clean backend without separate server
- Competition judges can run with one command
- App Router + Server Components enable data-dense UI efficiently

**TRADEOFF:** Next.js adds complexity vs. pure Express; server/client component boundaries require care  
**CONSEQUENCE:** All backend logic lives in `/src/lib/` and `/src/app/api/`. Types shared via `/src/types/`.

---

## DL-002: Database Choice

**DATE:** 2026-08-24  
**DECISION:** Choose persistence layer  
**OPTIONS CONSIDERED:**
- A: PostgreSQL (requires Docker or external service)
- B: Supabase (external dependency)
- C: SQLite via better-sqlite3
- D: In-memory only (no persistence)

**CHOSEN:** C — SQLite via better-sqlite3  
**WHY:**
- Zero external dependencies; runs anywhere Node.js runs
- Competition judges need only `npm install && npm run dev`
- Synchronous API simplifies server logic (no async DB calls at API layer)
- Sufficient for prototype read/write volumes
- Audit trail persists between server restarts

**TRADEOFF:** Not suitable for production multi-node deployment (documented limitation)  
**CONSEQUENCE:** DB migrations run at startup. File-based at `./data/controlplane.db`. Listed as limitation in README.

---

## DL-003: Verification Tier Thresholds

**DATE:** 2026-08-24  
**DECISION:** Define numeric thresholds for tier escalation  
**OPTIONS CONSIDERED:**
- A: Static thresholds (fixed numbers)
- B: Configurable per task type
- C: Machine-learned thresholds

**CHOSEN:** A — Static thresholds, with businessImpact modifier  
**WHY:**
- Explainable to judges in Round 3 discussion
- Deterministic and testable
- No ML training required for prototype
- Can document exact decision path

**THRESHOLDS:**
```
Tier 0 → Tier 1: Any Tier 0 risk signal present (not all-clear)
Tier 1 → Tier 2: compositeRisk > 50 OR businessImpact ∈ {high, critical}
```

**TRADEOFF:** May over-escalate to Tier 2 for some medium-risk cases; acceptable for prototype  
**CONSEQUENCE:** Thresholds documented in RiskFusion module. Can be changed via constants file.

---

## DL-004: PII Detection Method

**DATE:** 2026-08-24  
**DECISION:** Choose PII detection approach for Tier 0  
**OPTIONS CONSIDERED:**
- A: Call external PII API (Microsoft Presidio, AWS Comprehend)
- B: Regex patterns only
- C: NER model (spaCy, Hugging Face)
- D: LLM-based PII detection

**CHOSEN:** B — Regex patterns (with Indian-market patterns)  
**WHY:**
- Research confirms regex is Tier 1 best practice for structured PII
- Zero latency overhead
- Zero external dependency
- Deterministic and testable
- Sufficient for demo scenario (phone + email)
- Acknowledges NER would be Tier 2 in production (documented in FUTURE_IDEAS.md)

**TRADEOFF:** Will miss unstructured/contextual PII (e.g., "my friend John at 42 Main Street")  
**CONSEQUENCE:** PIIDetector is regex-only. Limitation explicitly documented.

---

## DL-005: Evidence Verification Approach

**DATE:** 2026-08-24  
**DECISION:** How to implement the hero BLOCK scenario (refund verification)  
**OPTIONS CONSIDERED:**
- A: Real database lookup against fixture business records
- B: LLM comparison of AI claim vs. source text
- C: Keyword matching only

**CHOSEN:** A — In-memory fixture records with claim extraction  
**WHY:**
- Deterministic (no LLM randomness)
- Follows Trust Hierarchy: deterministic evidence over LLM evaluator
- Fast (<2ms for in-memory lookup)
- Directly demonstrates the core thesis: verify facts against source of truth
- Fixture records simulate realistic enterprise data

**HOW:** EvidenceVerifier:
1. Extracts numerical claims (amounts, IDs) and status claims from AI response via regex
2. Looks up corresponding record in business data store (fixture)
3. Compares claim vs. record → CONFLICT or CONSISTENT

**TRADEOFF:** In production would need real DB integration; acceptable as labeled demo fixture  
**CONSEQUENCE:** businessRecords in request context are used by EvidenceVerifier. Demo fixtures pre-populate these.

---

## DL-006: LLM Usage Policy

**DATE:** 2026-08-24  
**DECISION:** When and how to use external LLM models in the prototype  
**OPTIONS CONSIDERED:**
- A: Use LLM for all verification (simple but expensive)
- B: Use LLM only at Tier 2 for deep evaluation
- C: Never use LLM in verification

**CHOSEN:** B — LLM optional at Tier 2 only  
**WHY:**
- Demonstrates Trust Hierarchy principle (deterministic first)
- Reduces API costs and latency
- Demo works entirely without LLM API key (fixtures + rules)
- Tier 2 LLM evaluator adds credibility for non-fixture scenarios

**RULE:** LLM model calls are:
- Never made at Tier 0
- Optional at Tier 1 (rule-based preferred)
- Available at Tier 2 for contested/complex cases only
- Never made when `demoMode = true` (fixture provider used instead)

**TRADEOFF:** Less "AI-native" at lower tiers; this is correct by design (Trust Hierarchy)  
**CONSEQUENCE:** ModelProvider abstraction with FixtureProvider + OpenAIProvider. Documented in ARCHITECTURE.md.

---

## DL-007: Demo Mode Strategy

**DATE:** 2026-08-24  
**DECISION:** How to make demo reliable without live API dependency  
**OPTIONS CONSIDERED:**
- A: Record + replay all API calls
- B: Fixture data with real engines on fixed inputs
- C: Pure mock (skip all engine logic)

**CHOSEN:** B — Real engines, fixed inputs  
**WHY:**
- Maintains technical credibility (real detection logic runs)
- Deterministic output
- No live API required
- Shows actual risk scoring and decision logic
- Judges can inspect the real code path

**HOW:** Each scenario fixture contains:
- Fixed `aiResponse` text
- Fixed `context.businessRecords`
- Fixed `businessImpact`
- Fixed `taskType`
Real PII detector, evidence verifier, and decision engine process these fixed inputs.

**TRADEOFF:** Must ensure fixtures are realistic enough to impress judges  
**CONSEQUENCE:** `/src/lib/fixtures/` contains scenario data. Scenario simulator uses these directly.

---

## DL-008: Human Control Desk UX

**DATE:** 2026-08-24  
**DECISION:** How to design the Control Desk reviewer experience  
**OPTIONS CONSIDERED:**
- A: Simple approve/reject buttons
- B: Full review workflow with case context, actions, and notes
- C: Email-based notification (out of scope)

**CHOSEN:** B — Full review workflow  
**WHY:**
- Demonstrates that ESCALATE is a real workflow, not a dead end
- Shows human-in-the-loop capability convincingly to judges
- Differentiates from competitors that just block/allow
- Makes the competition demo more impressive

**UI DESIGN:**
- Left panel: case list with priority + risk + reason
- Right panel: case detail with AI response, evidence, available actions
- Action buttons: Approve Release / Approve with Edit / Confirm Block / Add Note
- All actions logged with timestamp in audit trail

**TRADEOFF:** More complex to build; worth the investment for competition impact  
**CONSEQUENCE:** /controldesk page with full review UI. Database records reviewer actions.

---

## DL-009: Chart/Analytics Library

**DATE:** 2026-08-24  
**DECISION:** Choose charting library for dashboard  
**OPTIONS CONSIDERED:**
- A: Chart.js
- B: Recharts
- C: D3.js
- D: No charts (tables only)

**CHOSEN:** B — Recharts  
**WHY:**
- React-native (no imperative DOM)
- Lightweight
- Sufficient for line chart (risk trend) + bar chart (decision counts)
- TypeScript types included
- No additional configuration

**TRADEOFF:** Less customizable than D3; sufficient for prototype  
**CONSEQUENCE:** Recharts installed. Used in Overview Dashboard only.

---

## DL-010: Styling Approach

**DATE:** 2026-08-24  
**DECISION:** Choose UI styling approach  
**OPTIONS CONSIDERED:**
- A: Tailwind CSS + custom components
- B: shadcn/ui component library
- C: Material UI
- D: Plain CSS

**CHOSEN:** A — Tailwind CSS with custom components  
**WHY:**
- Research confirms Tailwind is current standard for rapid enterprise UI
- Full design control without library component constraints
- No version conflict risk
- Competition instructions mention Tailwind as default

**CONSEQUENCE:** All UI is custom-built with Tailwind. No external component library dependency. Lucide React for icons.

---

## Future Decision Log Entries

Subsequent decisions during implementation will be added here following the same format.

---

## DL-011: Next.js Version — Installed 16.3.2 vs Planned 14

**DATE:** 2026-08-24  
**DECISION:** Evaluate and accept (or downgrade) the Next.js version installed by create-next-app  
**ORIGINAL PLAN:** DL-001 specified "Next.js 14" based on planning-phase knowledge  
**ACTUAL INSTALLED:** Next.js 16.3.2 (installed by `npx create-next-app@latest` on 2026-08-24)

**OPTIONS CONSIDERED:**
- A: Downgrade to Next.js 14 (explicit version pin)
- B: Keep Next.js 16.3.2 (latest stable as of installation date)

**CHOSEN:** B — Keep Next.js 16.3.2  

**WHY:**
1. **Compatibility verified:** The architecture uses App Router, API Routes, Server/Client Components, and `next/font` — all of which are fully supported in Next.js 16.3.2 with no breaking changes relative to our use case (confirmed via official docs in `node_modules/next/dist/docs/`)
2. **No deprecated APIs used:** ControlPlane.ai does not use `pages/` router, `getServerSideProps`, or any other pre-App Router pattern
3. **Security:** Newer stable version includes security patches absent in 14
4. **Competition benefit:** A later stable version signals engineering currency
5. **No functional reason to downgrade:** All planned features work identically on 16.3.2

**COMPATIBILITY CHECK (performed 2026-08-24):**
- `npm run build` ✅ passes on 16.3.2 with App Router
- `npm run typecheck` ✅ 0 errors
- `npm run lint` ✅ 0 errors
- `npm test` ✅ 8/8 pass
- Route Handlers (`app/api/.../route.ts`) ✅ supported
- `next/font/google` ✅ supported
- Dynamic routes (`[id]`) ✅ supported
- Server/Client component split ✅ supported
- `better-sqlite3` (synchronous) ✅ works in Node.js Route Handlers

**TRADEOFF:**  
Minor: Future Next.js patch versions may introduce changes before the competition deadline. Mitigated by pinning exact version in `package.json` (16.3.2 currently pinned by npm).

**CONSEQUENCE:**  
DL-001 is updated in intent: "Next.js 14+" → "Next.js 16.3.2". All architectural decisions remain valid. No downgrade will occur unless a blocking incompatibility is discovered during M2–M7.

---

## DL-012: Directory Structure — Adopted `src/` Layout

**DATE:** 2026-08-24  
**DECISION:** Move project files from root-level `app/`, `lib/`, `types/` to `src/app/`, `src/lib/`, `src/types/`  
**TRIGGER:** Architecture documentation specified `src/` structure; M1 initially deployed without it; corrected before M2

**OPTIONS CONSIDERED:**
- A: Keep root-level layout (current state after create-next-app)
- B: Move to `src/` structure as documented in ARCHITECTURE.md

**CHOSEN:** B — Move to `src/` structure

**WHY:**
- ARCHITECTURE.md and PRODUCT_SPEC.md both specify `src/` paths explicitly
- Next.js 16 official docs confirm `src/` folder is fully supported (verified at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/src-folder.md`)
- Prevents drift between documentation and implementation
- Industry convention for separating application code from root config files
- No architectural impact — purely a file organization change

**CHANGES REQUIRED:**
- `tsconfig.json` `@/*` alias updated from `"./*"` to `"./src/*"` (required per Next.js docs)
- `vitest.config.mts` `include` patterns and `alias` updated to `src/`
- `.next/` cache cleared to remove stale type references to old paths
- `next.config.ts`, `package.json`, `.env.example`, `postcss.config.mjs` remain at root (correct per docs)
- Tailwind v4 does not require explicit content path — automatic detection works with `src/`

**TRADEOFF:**  
Small migration cost (performed in ~5 min). No ongoing tradeoffs.  

**CONSEQUENCE:**  
All source files now live under `src/`. Tests in `src/tests/`. All `@/` imports resolve to `src/`. This is the permanent structure going forward.
