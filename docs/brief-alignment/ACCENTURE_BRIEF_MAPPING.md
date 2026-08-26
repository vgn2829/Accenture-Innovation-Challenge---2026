# Accenture Round 2 Brief Mapping

This is the implementation source of truth for the supplied company brief. Statuses are based on repository evidence, not intended architecture.

| Brief requirement | Current implementation | Gap | Planned implementation | Evidence | Status |
|---|---|---|---|---|---|
| Different use cases have different risk/latency budgets | Task type and business impact exist; one global policy | No reusable named profiles | Add Customer Support, Knowledge Assistant, Decision Support profiles | `src/lib/verification/verification-policy.ts` | PARTIAL |
| Overlapping bias, hallucination, privacy risks | Engines can emit multiple detections | No benchmark proving interactions | Add cross-risk synthetic corpus and metrics | orchestrator + tests | PARTIAL |
| Ground truth may be unavailable | Trusted resolver returns unavailable → UNVERIFIED | No explicit profile policy for missing evidence | Profile-specific uncertainty rules | trusted resolver | PARTIAL |
| Alert fatigue vs liability | Decision engine escalates high-impact uncertainty | No measured false-positive/escalation trade-off | Evaluation runner and held-out metrics | decision engine | PARTIAL |
| Multi-turn/agent compounding risk | Session history, retry and loop detectors exist | No corpus, report, or UI proof | Agent benchmark subset and report | cost engine | PARTIAL |
| Geography/industry variation | No geography field | No configurable regional policy | Add region-aware profile selection without compliance claims | types/policy | MISSING |
| Foundation models consumed via API | `/api/analyze` is the runtime boundary | No provider adapter contract | Document provider-neutral input boundary | API route | PARTIAL |
| Rule heuristics | PII/injection/policy detectors | Narrow patterns | Keep deterministic baseline; measure limits | engines | COMPLETE |
| Embedding/statistical anomaly detection | Not implemented | No embedding dependency or model | Explicitly mark as future/unverified; do not fake it | dependency scan | MISSING |
| AI-as-judge | Optional OpenAI semantic evaluator | Not benchmarked live | Keep optional and schema-guarded | semantic evaluator | PARTIAL |
| Retrieval/evidence verification | Allow-listed trusted demo records | No general connector | Add evidence-source attribution and missing evidence labels | evidence resolver | PARTIAL |
| Dedicated PII/entity detection | Pattern PII detector | Obfuscation/context gaps | Evaluation cases and limitations | PII engine | PARTIAL |
| Confidence and tiered responses | Risk scores, tier 0/1/2, four decisions | Confidence not calibrated | Report calibration as NOT ESTABLISHED unless measured | decision engine | PARTIAL |
| Pre-response gate/inline middleware | `/api/analyze` executes before persistence | No external SDK adapter | Document API boundary and latency path | route | PARTIAL |
| Parallel checks and latency protection | Tier 0 checks currently execute sequentially | No measured parallel implementation | Parallelize independent Tier 0 checks where safe and record timing | orchestrator | MISSING |
| Configurable governance | Business impact is configurable | No policy version/profile/region attribution | Add policy profile registry and audit fields | types/db/orchestrator | MISSING |
| Audit trail | Decisions, Control Desk, profile/policy/source metadata, and feedback persist | SQLite remains prototype storage | Keep append-oriented records and expose attribution | SQLite operations | VERIFIED |
| Feedback loops | Human action resolves cases | No automated policy updates by design | Feedback events, evaluation linkage, and review-only policy candidates | Control Desk + `/api/evaluation` | VERIFIED |
| False positive/negative metrics | None | No benchmark runner | Add deterministic evaluation runner and reports | new `evaluation/` | MISSING |
| Demo fixtures retained | A/B/C/D route through real orchestrator | No change required | Preserve as separate demo source | `src/lib/fixtures/scenarios.ts` | COMPLETE |
| Public/open data and synthetic cases | No evaluation corpus | No provenance registry | Build clearly labeled synthetic corpus; document public dataset candidates and licenses | new evaluation docs | MISSING |

## Dataset Lab / BYO data verification

| Brief requirement | Current implementation | Gap / limitation | Evidence | Status |
|---|---|---|---|---|
| CSV, JSON, and JSONL ingestion | Dedicated adapters with quoted CSV parsing, JSON arrays/objects, JSONL malformed-line accounting | 2MB / 5,000-row prototype limits | `src/lib/dataset-lab/adapters.ts`, upload route, tests | VERIFIED |
| Canonical evaluation schema | Normalizer maps IDs, prompts, responses, context, labels, impact, and expected outcomes | Mapping is explicit per upload; no automatic semantic schema inference | `src/lib/dataset-lab/types.ts`, `normalize.ts` | VERIFIED |
| Profile before evaluation | Counts, types, missingness, duplicates, malformed/nested rows, text length, PII candidates, response/id candidates | PII scan is deterministic pattern detection, not comprehensive entity recognition | `profile.ts`, Dataset Lab page | PARTIAL |
| Ambiguous mapping confirmation | Suggestions include candidates, confidence, and `ambiguous`; UI does not silently select ambiguous response fields | User must complete mappings manually | `profile.ts`, `/evaluation/datasets` | VERIFIED |
| Deterministic clean / raw-normalized provenance | NFKC and whitespace normalization; raw and normalized values retained only in process memory | No durable raw/normalized lineage store by design | `normalize.ts` | PARTIAL |
| Uploaded data trust boundary | All normalized cases are `USER_UPLOADED`; evaluator does not pass uploaded evidence/entity references to trusted resolver | No authentication/tenant isolation exists in this prototype route | `evaluate.ts`, trust-boundary tests | PARTIAL |
| BYO evaluation reports | Per-run profile, mode, split, latency, tiers, decisions, labels, failures, and metadata-only historical artifact | Raw responses are intentionally unavailable from historical artifacts | run route, `evaluation/results/dataset-*.json` | VERIFIED |
| Optional labels / unavailable metrics | Unrecognized or absent labels become `UNAVAILABLE`; metrics are null without labels | No statistical confidence intervals | `normalize.ts`, `evaluate.ts` | VERIFIED |
| Configurable 80/10/10 experiment | API and UI select development, validation, or evaluation; ratios can be supplied and validated | Small datasets can yield empty lower splits due deterministic floor slicing | run route, Dataset Lab page | PARTIAL |
| Full vs adaptive comparison | API/UI runs adaptive and deep on the same selected split and reports Tier 2, evaluator-call, and latency deltas | No significance testing | run route, Dataset Lab page | PARTIAL |
| Failure explorer and human feedback | Failed labeled rows can receive review labels; response is a review-only policy candidate | Feedback is in-memory for the temporary session; no automatic policy mutation | feedback route, Dataset Lab page | VERIFIED |
| Contamination controls | Demo-response resemblance warnings; demo fixtures excluded from synthetic runner | Heuristic similarity is not a full provenance proof | run route, `dataset-lab.test.ts` | PARTIAL |
