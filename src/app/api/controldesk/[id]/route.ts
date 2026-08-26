// ============================================================
// ControlPlane.ai — GET / POST /api/controldesk/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { addControlDeskNote, getControlDeskCaseById, resolveControlDeskCase } from '@/lib/db/operations';
import type { ControlDeskAction, ControlDeskActionRequest, Decision } from '@/types';

const VALID_ACTIONS: ControlDeskAction[] = [
  'APPROVE_RELEASE',
  'APPROVE_WITH_EDIT',
  'CONFIRM_BLOCK',
  'ADD_NOTE',
];

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const deskCase = getControlDeskCaseById(id);

    if (!deskCase) {
      return NextResponse.json(
        { error: `Control Desk case with ID "${id}" was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(deskCase, { status: 200 });
  } catch (err) {
    console.error('[API Error] GET /api/controldesk/[id] failure:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve control desk case' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    let rawAction = String(body.action || '').trim().toUpperCase();
    // Normalize alias APPROVE_EDIT -> APPROVE_WITH_EDIT
    if (rawAction === 'APPROVE_EDIT') {
      rawAction = 'APPROVE_WITH_EDIT';
    }

    if (!VALID_ACTIONS.includes(rawAction as ControlDeskAction)) {
      return NextResponse.json(
        {
          error: `Invalid reviewer action "${body.action}". Allowed actions: ${VALID_ACTIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const deskCase = getControlDeskCaseById(id);
    if (!deskCase) {
      return NextResponse.json(
        { error: `Control Desk case with ID "${id}" was not found or has already been resolved` },
        { status: 404 }
      );
    }

    const actionRequest: ControlDeskActionRequest = {
      action: rawAction as ControlDeskAction,
      reviewerId: process.env.DEMO_REVIEWER_ID || 'demo-supervisor',
      note: typeof body.note === 'string' ? body.note : undefined,
      editedResponse: typeof body.editedResponse === 'string' ? body.editedResponse : undefined,
      correctedLabel: ['RELEASE', 'EDIT', 'BLOCK', 'ESCALATE'].includes(String(body.correctedLabel)) ? String(body.correctedLabel) as Decision : undefined,
    };

    if (actionRequest.action === 'ADD_NOTE') {
      if (!actionRequest.note?.trim()) return NextResponse.json({ error: 'A note is required for ADD_NOTE.' }, { status: 400 });
      const saved = addControlDeskNote(id, actionRequest.reviewerId || 'system', actionRequest.note);
      if (!saved) return NextResponse.json({ error: 'Failed to save note; case may already be resolved.' }, { status: 409 });
      return NextResponse.json({ success: true, caseId: id, status: 'PENDING', action: 'ADD_NOTE', reviewerId: actionRequest.reviewerId, noteSaved: true }, { status: 200 });
    }

    const resolved = resolveControlDeskCase(id, actionRequest);

    if (!resolved) {
      return NextResponse.json(
        { error: 'Failed to resolve case (case may already be resolved or locked)' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        caseId: id,
        status: 'RESOLVED',
        action: actionRequest.action,
        reviewerId: actionRequest.reviewerId,
        resolvedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API Error] POST /api/controldesk/[id] failure:', err);
    return NextResponse.json(
      { error: 'Internal server error resolving Control Desk case' },
      { status: 500 }
    );
  }
}
