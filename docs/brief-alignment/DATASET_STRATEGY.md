# Dataset Strategy

## Corpus composition

The runnable corpus is intentionally synthetic and deterministic for this prototype. It contains generated cases across financial, order, PII, injection, policy, hiring, agent-loop, missing-evidence, and clean-response categories. Synthetic labels are explicit and are not presented as customer or production data.

Public/open dataset candidates are recorded for future expansion only: TruthfulQA (factuality), HaluEval (hallucination), BIPIA (prompt injection), Civil Comments/BBQ (bias), and public PII benchmark material. Before importing any of these, the team must verify the exact artifact license, access date, label semantics, and redistribution conditions. No public dataset is counted in the current benchmark without that verification.

## Provenance registry (researched 2026-08-25)

| Dataset | Source | Candidate task | License/provenance observation | Current use |
|---|---|---|---|---|
| TruthfulQA | [official repository](https://github.com/sylinrl/TruthfulQA) | factuality/hallucination | Repository includes a license; exact artifact and downstream use still require review | Candidate only |
| BIPIA | [Microsoft repository](https://github.com/microsoft/BIPIA) | indirect prompt injection | Code license is visible, but some source data requires separate terms; do not redistribute blindly | Candidate only |
| BBQ | [NYU repository](https://github.com/nyu-mll/BBQ) | social bias | Repository identifies CC-BY-4.0; check attribution and task fit | Candidate only |
| HaluEval | official paper/repository not pinned in this prototype | hallucination | Exact license/artifact provenance not verified in this pass | Candidate only |

These sources are not part of the measured 600-case result. Their labels, domains, language coverage, and contamination risk would require a separate import audit.

## Splits

- Development: 80% by default for Dataset Lab uploads; configurable through the run API.
- Validation: 10% by default.
- Held-out evaluation: 10% by default. The existing synthetic mechanism runner remains a separate 60/20/20 artifact and must not be conflated with uploaded-data results.
- Demo fixtures A–D are excluded from evaluation to avoid contamination.

## Quality controls

The generator checks duplicate case IDs, duplicate input/response pairs, missing labels, contradictory expected labels, and class distribution. Cases include `source: synthetic` and `split` fields. The runner never tunes thresholds or mutates policy based on the held-out set.

## Limitations

Synthetic cases measure mechanism behavior, not real-world prevalence, linguistic diversity, or production calibration. Public dataset metrics remain NOT ESTABLISHED until licensed artifacts are imported and audited.
