// ============================================================
// ControlPlane.ai — GET /api/decisions
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDecisions, getTotalDecisions } from '@/lib/db/operations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const filter = searchParams.get('filter') || 'ALL';

    const offset = (page - 1) * limit;
    const decisions = getDecisions(limit, offset, filter);
    const total = getTotalDecisions(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    // Return lightweight summary for list views
    const sanitizedDecisions = decisions.map(d => ({
      requestId: d.requestId,
      timestamp: d.timestamp,
      decision: d.decision,
      decisionReason: d.decisionReason,
      confidence: d.confidence,
      risk: d.risk,
      model: d.model,
      taskType: d.taskType,
      verificationTier: d.verificationTier,
      latencyMs: d.latencyMs,
      detectionCount: d.detections.length,
      evidenceCount: d.evidence.length,
      demoMode: d.demoMode,
      scenario: d.scenario,
      hasEditedResponse: Boolean(d.editedResponse),
    }));

    return NextResponse.json(
      {
        decisions: sanitizedDecisions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API Error] /api/decisions failure:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve decision records' },
      { status: 500 }
    );
  }
}
