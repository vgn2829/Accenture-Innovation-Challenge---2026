import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getDataset } from '@/lib/dataset-lab/store';
import type { DatasetFeedbackEvent } from '@/lib/dataset-lab/types';
import { datasetDemoError } from '@/lib/dataset-lab/access';

const labels: DatasetFeedbackEvent['label'][] = ['CORRECT', 'FALSE_POSITIVE', 'FALSE_NEGATIVE', 'WRONG_ESCALATION', 'WRONG_VERIFICATION_TIER'];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = datasetDemoError(request);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
  const { id } = await context.params;
  const dataset = getDataset(id);
  if (!dataset) return NextResponse.json({ error: 'Dataset session expired or was deleted.' }, { status: 404 });
  const body = await request.json() as { runId?: string; caseId?: string; label?: string; reason?: string };
  if (!body.runId || !body.caseId || !body.label || !labels.includes(body.label as DatasetFeedbackEvent['label'])) return NextResponse.json({ error: 'runId, caseId, and a valid feedback label are required.' }, { status: 400 });
  const run = dataset.runs.find(item => item.runId === body.runId);
  if (!run || !run.failures.some(item => item.caseId === body.caseId)) return NextResponse.json({ error: 'Feedback can only be attached to a known failed case in a known run.' }, { status: 400 });
  const feedback: DatasetFeedbackEvent = { id: randomUUID(), datasetId: id, runId: body.runId, caseId: body.caseId, label: body.label as DatasetFeedbackEvent['label'], reason: typeof body.reason === 'string' ? body.reason.slice(0, 2000) : undefined, timestamp: new Date().toISOString(), policyVersion: run.policyVersion };
  addFeedback(id, feedback);
  return NextResponse.json({ feedback, policyImprovementCandidate: { status: 'REVIEW_REQUIRED', supportingCases: [body.caseId], currentPolicy: run.policyVersion, suggestedChange: 'Human review required before any policy modification.', impact: 'UNESTABLISHED' } }, { status: 201 });
}
