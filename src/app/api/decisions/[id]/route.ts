// ============================================================
// ControlPlane.ai — GET /api/decisions/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDecisionById } from '@/lib/db/operations';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid decision request ID' },
        { status: 400 }
      );
    }

    const decision = getDecisionById(id);

    if (!decision) {
      return NextResponse.json(
        { error: `Decision record with ID "${id}" was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(decision, { status: 200 });
  } catch (err) {
    console.error('[API Error] /api/decisions/[id] failure:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve decision detail record' },
      { status: 500 }
    );
  }
}
