import { NextRequest, NextResponse } from 'next/server';
import { deleteDataset, getDataset } from '@/lib/dataset-lab/store';
import { datasetDemoError } from '@/lib/dataset-lab/access';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = datasetDemoError(request);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
  const { id } = await context.params;
  const dataset = getDataset(id);
  if (!dataset) return NextResponse.json({ error: 'Dataset session expired or was deleted.' }, { status: 404 });
  return NextResponse.json({ datasetId: dataset.id, profile: dataset.profile, mapping: dataset.mapping, validation: dataset.validation, runs: dataset.runs, feedback: dataset.feedback, trustClass: 'USER_UPLOADED' }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = datasetDemoError(request);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
  const { id } = await context.params;
  return NextResponse.json({ deleted: deleteDataset(id) }, { status: 200 });
}
