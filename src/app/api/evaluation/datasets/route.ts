import { NextRequest, NextResponse } from 'next/server';
import { adapterFor } from '@/lib/dataset-lab/adapters';
import { createDataset, listDatasets } from '@/lib/dataset-lab/store';
import { profileDataset } from '@/lib/dataset-lab/profile';
import type { DatasetFormat } from '@/lib/dataset-lab/types';
import { datasetDemoError } from '@/lib/dataset-lab/access';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;

function formatFor(name: string, declared?: string): DatasetFormat | undefined {
  if (declared === 'csv' || declared === 'json' || declared === 'jsonl') return declared;
  const extension = name.toLowerCase().split('.').pop();
  return extension === 'csv' || extension === 'json' || extension === 'jsonl' ? extension : undefined;
}

export async function GET(request: NextRequest) {
  const accessError = datasetDemoError(request);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
  return NextResponse.json({ datasets: listDatasets() }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const accessError = datasetDemoError(request);
    if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Upload a CSV, JSON, or JSONL file using the file field.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Dataset file exceeds the 2MB prototype limit.' }, { status: 413 });
    const format = formatFor(file.name, typeof form.get('format') === 'string' ? String(form.get('format')) : undefined);
    if (!format) return NextResponse.json({ error: 'Only CSV, JSON, and JSONL inputs are supported.' }, { status: 415 });
    const text = await file.text();
    const parsed = adapterFor(format).parse(text);
    if (parsed.rows.length === 0) return NextResponse.json({ error: parsed.errors[0] || 'Dataset is empty or contains no valid rows.' }, { status: 422 });
    if (parsed.rows.length + parsed.malformedRows > MAX_ROWS) return NextResponse.json({ error: 'Dataset exceeds the 5,000-row prototype limit.' }, { status: 413 });
    const provisionalId = `upload_${Date.now()}`;
    const profile = profileDataset(provisionalId, file.name, parsed);
    const datasetId = createDataset(profile, parsed.rows);
    return NextResponse.json({ datasetId, profile: { ...profile, datasetId }, validation: { valid: false, errors: parsed.errors, warnings: profile.warnings, acceptedRows: parsed.rows.length, rejectedRows: parsed.malformedRows, piiRows: profile.piiCandidateRows, duplicateRows: profile.duplicateRows, contaminationWarnings: [] }, trustClass: 'USER_UPLOADED', warning: 'Prototype Dataset Lab: use synthetic/non-sensitive data only. Uploaded fields cannot become trusted evidence.' }, { status: 201 });
  } catch (error) {
    console.error('[API Error] dataset upload failure:', error);
    return NextResponse.json({ error: 'Dataset could not be profiled safely.' }, { status: 400 });
  }
}
