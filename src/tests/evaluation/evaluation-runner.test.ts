import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadEvaluationCases, runEvaluation } from '@/lib/evaluation/evaluation-runner';

describe('deterministic evaluation runner', () => {
  it('loads a held-out, non-demo corpus with valid splits', () => {
    const cases = loadEvaluationCases();
    expect(cases).toHaveLength(320);
    expect(cases.filter(item => item.split === 'evaluation')).toHaveLength(64);
    expect(cases.every(item => item.source === 'synthetic')).toBe(true);
  });

  it('writes reproducible machine and human reports', async () => {
    const report = await runEvaluation();
    fs.mkdirSync(path.join(process.cwd(), 'evaluation/results'), { recursive: true });
    fs.mkdirSync(path.join(process.cwd(), 'evaluation/reports'), { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), 'evaluation/results/latest.json'), `${JSON.stringify(report, null, 2)}\n`);
    const markdown = `# Evaluation Report\n\nGenerated: ${report.generatedAt}\n\n- Corpus: ${report.corpus.total} synthetic cases; held-out: ${report.corpus.heldOutEvaluation}\n- Accuracy: ${report.metrics.accuracy}\n- False release rate: ${report.metrics.falseReleaseRate}\n- False block rate: ${report.metrics.falseBlockRate}\n- High-impact escalation recall: ${report.metrics.highImpactEscalationRecall}\n- Verification coverage: ${report.metrics.verificationCoverage}\n- Tier distribution: ${JSON.stringify(report.tierDistribution)}\n- Calibration: ${report.metrics.calibration}\n\n## Use-case policy comparison\n\n${report.policyComparison.map(row => `- ${row.profile}: Tier ${row.tier}, ${row.decision}, ${row.state}, budget ${row.budgetMs}ms`).join('\n')}\n\n## Limitations\n\n${report.limitations.map(item => `- ${item}`).join('\n')}\n`;
    fs.writeFileSync(path.join(process.cwd(), 'evaluation/reports/latest.md'), markdown);
    expect(report.corpus.heldOutEvaluation).toBe(64);
    expect(report.metrics.calibration).toBe('NOT ESTABLISHED');
    expect(report.rows).toHaveLength(64);
  });
});
