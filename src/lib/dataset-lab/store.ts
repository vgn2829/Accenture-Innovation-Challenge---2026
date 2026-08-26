import { randomUUID } from 'node:crypto';
import type { DatasetFeedbackEvent, DatasetProfile, DatasetRunResult, DatasetValidation, CanonicalEvaluationCase, DatasetFieldMapping } from './types';

interface StoredDataset {
  id: string;
  profile: DatasetProfile;
  rows: Array<Record<string, unknown>>;
  canonicalCases?: CanonicalEvaluationCase[];
  validation?: DatasetValidation;
  mapping?: DatasetFieldMapping;
  runs: DatasetRunResult[];
  feedback: DatasetFeedbackEvent[];
  createdAt: number;
}

const datasets = new Map<string, StoredDataset>();
const MAX_DATASETS = 10;
const TTL_MS = 30 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [id, dataset] of datasets) if (now - dataset.createdAt > TTL_MS) datasets.delete(id);
  while (datasets.size > MAX_DATASETS) {
    const oldest = Array.from(datasets.values()).sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) datasets.delete(oldest.id); else break;
  }
}

export function createDataset(profile: DatasetProfile, rows: Array<Record<string, unknown>>): string {
  prune();
  const id = randomUUID();
  datasets.set(id, { id, profile: { ...profile, datasetId: id }, rows, runs: [], feedback: [], createdAt: Date.now() });
  return id;
}

export function getDataset(id: string): StoredDataset | undefined { prune(); return datasets.get(id); }
export function deleteDataset(id: string): boolean { return datasets.delete(id); }
export function setCanonical(id: string, mapping: DatasetFieldMapping, cases: CanonicalEvaluationCase[], validation: DatasetValidation) { const dataset = getDataset(id); if (!dataset) return; dataset.mapping = mapping; dataset.canonicalCases = cases; dataset.validation = validation; }
export function addRun(id: string, run: DatasetRunResult) { const dataset = getDataset(id); if (dataset) dataset.runs.unshift(run); }
export function addFeedback(id: string, feedback: DatasetFeedbackEvent) { const dataset = getDataset(id); if (dataset) dataset.feedback.unshift(feedback); }
export function listDatasets() { prune(); return Array.from(datasets.values()).map(dataset => ({ id: dataset.id, profile: dataset.profile, validation: dataset.validation, runs: dataset.runs.map(run => ({ runId: run.runId, timestamp: run.timestamp, profile: run.profile, caseCount: run.caseCount, labeledCount: run.labeledCount })) })); }
