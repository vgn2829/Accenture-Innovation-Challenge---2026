// ============================================================
// ControlPlane.ai — GET /api/metrics
// ============================================================

import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/db/operations';

export async function GET() {
  try {
    const metrics = getDashboardMetrics();
    return NextResponse.json(metrics, { status: 200 });
  } catch (err) {
    console.error('[API Error] /api/metrics failure:', err);
    return NextResponse.json(
      { error: 'Failed to compute dashboard metrics' },
      { status: 500 }
    );
  }
}
