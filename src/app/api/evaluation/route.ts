import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getFeedbackEvents, getTrustEvaluationMetrics } from '@/lib/db/operations';

export async function GET() {
  try {
    const metrics = getTrustEvaluationMetrics();
    const resultPath = path.join(process.cwd(), 'evaluation/results/latest.json');
    const evaluation = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : null;
    return NextResponse.json({ metrics, evaluation, feedback: getFeedbackEvents(20) }, { status: 200 });
  } catch (error) {
    console.error('[API Error] /api/evaluation failure:', error);
    return NextResponse.json({ error: 'Evaluation data is unavailable' }, { status: 500 });
  }
}
