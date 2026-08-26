import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeAndMap } from '@/lib/dataset-lab/normalize';
import { evaluateCanonicalCases } from '@/lib/dataset-lab/evaluate';
import { addRun, getDataset, setCanonical } from '@/lib/dataset-lab/store';
import type { DatasetFieldMapping, DatasetSplitConfig, DatasetSplitName } from '@/lib/dataset-lab/types';
import type { UseCaseProfileId } from '@/types';
import { datasetDemoError } from '@/lib/dataset-lab/access';

const profiles: UseCaseProfileId[] = ['customer_support', 'knowledge_assistant', 'decision_support'];
const defaultSplit: DatasetSplitConfig = { development: 0.8, validation: 0.1, evaluation: 0.1 };

function resolveSplit(input?: Partial<DatasetSplitConfig>): DatasetSplitConfig | null {
  const split = { ...defaultSplit, ...input };
  const values = Object.values(split);
  if (values.some(value => !Number.isFinite(value) || value < 0 || value > 1) || Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) > 0.0001) return null;
  return split;
}

function casesForSplit<T>(cases: T[], splitName: DatasetSplitName, split: DatasetSplitConfig): T[] {
  const start = splitName === 'development' ? 0 : splitName === 'validation' ? Math.floor(cases.length * split.development) : Math.floor(cases.length * (split.development + split.validation));
  const end = splitName === 'development' ? Math.floor(cases.length * split.development) : splitName === 'validation' ? Math.floor(cases.length * (split.development + split.validation)) : cases.length;
  return cases.slice(start, Math.max(start, end));
}

function contaminationWarnings(cases: Array<{ aiResponse: string; caseId: string }>): string[] {
  const warnings: string[] = [];
  const fixtureResponses = ['Your order #ORD-4492 has been shipped', 'Your refund of ₹24,500 has been processed successfully', 'prioritizing younger male candidates'];
  for (const item of cases) if (fixtureResponses.some(fixture => item.aiResponse.toLowerCase().includes(fixture.toLowerCase()))) warnings.push(`Case ${item.caseId} resembles a demo fixture; do not use it as independent benchmark evidence.`);
  return Array.from(new Set(warnings));
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = datasetDemoError(request);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
  const { id } = await context.params;
  const dataset = getDataset(id);
  if (!dataset) return NextResponse.json({ error: 'Dataset session expired or was deleted.' }, { status: 404 });
  try {
    const body = await request.json() as { mapping?: DatasetFieldMapping; profile?: UseCaseProfileId; mode?: 'adaptive' | 'deep'; compareAll?: boolean; compareModes?: boolean; splitName?: DatasetSplitName; split?: Partial<DatasetSplitConfig> };
    const mapping = body.mapping || dataset.mapping;
    if (!mapping) return NextResponse.json({ error: 'A field mapping is required before evaluation.' }, { status: 400 });
    const normalized = normalizeAndMap(dataset.rows, { format: dataset.profile.format, rows: dataset.rows, malformedRows: dataset.profile.malformedRows, columns: dataset.profile.columns, errors: [] }, dataset.profile, mapping);
    const contamination = contaminationWarnings(normalized.cases);
    normalized.validation.contaminationWarnings = contamination;
    setCanonical(id, mapping, normalized.cases, normalized.validation);
    if (!normalized.validation.valid) return NextResponse.json({ validation: normalized.validation, error: 'Dataset validation failed. Correct mapping or rejected rows before running.' }, { status: 422 });
    const selectedProfile = body.profile && profiles.includes(body.profile) ? body.profile : 'customer_support';
    const mode = body.mode === 'deep' ? 'deep' : 'adaptive';
    const split = resolveSplit(body.split);
    if (!split) return NextResponse.json({ error: 'Split ratios must be between 0 and 1 and sum to 1.' }, { status: 400 });
    const splitName: DatasetSplitName = body.splitName === 'development' || body.splitName === 'validation' ? body.splitName : 'evaluation';
    const selectedCases = casesForSplit(normalized.cases, splitName, split);
    const selected = await evaluateCanonicalCases(id, dataset.profile.fileName, selectedCases, selectedProfile, mode, contamination, splitName, split);
    addRun(id, selected);
    let comparisons: typeof selected[] = [];
    if (body.compareAll) {
      comparisons = [selected];
      for (const profile of profiles.filter(item => item !== selectedProfile)) {
        const result = await evaluateCanonicalCases(id, dataset.profile.fileName, selectedCases, profile, mode, contamination, splitName, split);
        addRun(id, result);
        comparisons.push(result);
      }
    }
    let modeComparison: typeof selected[] = [];
    if (body.compareModes) {
      modeComparison = [selected];
      const alternateMode = mode === 'adaptive' ? 'deep' : 'adaptive';
      const alternate = await evaluateCanonicalCases(id, dataset.profile.fileName, selectedCases, selectedProfile, alternateMode, contamination, splitName, split);
      addRun(id, alternate);
      modeComparison.push(alternate);
    }
    const resultPath = path.join(process.cwd(), 'evaluation/results');
    fs.mkdirSync(resultPath, { recursive: true });
    // Historical artifact intentionally excludes raw uploaded responses.
    fs.writeFileSync(path.join(resultPath, `dataset-${selected.runId}.json`), `${JSON.stringify({ datasetId: selected.datasetId, fileName: selected.fileName, trustClass: selected.trustClass, profile: selected.profile, policyVersion: selected.policyVersion, mode: selected.mode, splitName: selected.splitName, split: selected.split, timestamp: selected.timestamp, caseCount: selected.caseCount, labeledCount: selected.labeledCount, metrics: selected.metrics, tierDistribution: selected.tierDistribution, decisionDistribution: selected.decisionDistribution, latency: selected.latency, evaluatorInvocationCount: selected.evaluatorInvocationCount, contaminationWarnings: selected.contaminationWarnings }, null, 2)}\n`);
    return NextResponse.json({ validation: normalized.validation, result: selected, comparisons, modeComparison }, { status: 200 });
  } catch (error) {
    console.error('[API Error] dataset evaluation failure:', error);
    return NextResponse.json({ error: 'Dataset evaluation failed safely.' }, { status: 400 });
  }
}
