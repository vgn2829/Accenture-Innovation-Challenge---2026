// ============================================================
// ControlPlane.ai — POST /api/analyze
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';
import { getDecisionById, persistDecision } from '@/lib/db/operations';
import type { AnalyzeRequest, BusinessImpact, TaskType, UseCaseProfileId } from '@/types';

const orchestrator = new VerificationOrchestrator();

const VALID_TASK_TYPES: TaskType[] = ['customer-support', 'financial', 'hiring', 'general'];
const VALID_IMPACTS: BusinessImpact[] = ['low', 'medium', 'high', 'critical'];
const VALID_PROFILES: UseCaseProfileId[] = ['customer_support', 'knowledge_assistant', 'decision_support'];

export async function POST(req: NextRequest) {
  try {
    let body: AnalyzeRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    // 1. Validation
    if (!body.aiResponse || typeof body.aiResponse !== 'string' || body.aiResponse.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: "aiResponse" must be a non-empty string' },
        { status: 400 }
      );
    }

    if (body.aiResponse.length > 100000) {
      return NextResponse.json(
        { error: 'Input text exceeds maximum allowed character length (100,000 chars)' },
        { status: 413 }
      );
    }

    const context = body.context;
    if (context) {
      const history = context.sessionHistory || [];
      const docs = context.retrievedDocs || [];
      const tools = context.toolCallHistory || [];
      if (history.length > 100 || docs.length > 50 || tools.length > 100) {
        return NextResponse.json({ error: 'Context exceeds bounded history, document, or tool-call limits' }, { status: 413 });
      }
      const contextChars = history.reduce((n, m) => n + (m?.content?.length || 0), 0) + docs.reduce((n, d) => n + (d?.length || 0), 0) + tools.reduce((n, t) => n + (t?.length || 0), 0);
      if (contextChars > 250000) {
        return NextResponse.json({ error: 'Context exceeds maximum allowed size' }, { status: 413 });
      }
      if (context.entityRef && (typeof context.entityRef !== 'string' || context.entityRef.length > 100)) {
        return NextResponse.json({ error: 'Invalid entityRef' }, { status: 400 });
      }
    }

    if (!body.model || typeof body.model !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: "model" must be specified (e.g. "gpt-4o")' },
        { status: 400 }
      );
    }

    if (body.taskType && !VALID_TASK_TYPES.includes(body.taskType)) {
      return NextResponse.json(
        { error: `Invalid "taskType". Allowed values: ${VALID_TASK_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.businessImpact && !VALID_IMPACTS.includes(body.businessImpact)) {
      return NextResponse.json(
        { error: `Invalid "businessImpact". Allowed values: ${VALID_IMPACTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.profile && !VALID_PROFILES.includes(body.profile)) {
      return NextResponse.json({ error: `Invalid "profile". Allowed values: ${VALID_PROFILES.join(', ')}` }, { status: 400 });
    }

    if (body.region && (typeof body.region !== 'string' || body.region.length > 12)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    // Idempotent replay: an existing request ID returns its persisted decision.
    if (body.requestId) {
      const existing = getDecisionById(body.requestId);
      if (existing) return NextResponse.json(existing, { status: 200 });
    }

    // 2. Execute Verification Orchestrator
    const result = await orchestrator.run(body);

    // 3. Persist to Audit Log & Control Desk
    try {
      persistDecision(result);
    } catch (dbErr) {
      // Concurrent retries can race between the preflight lookup and INSERT.
      // If another request won that race, return its canonical persisted result.
      if (body.requestId) {
        const persisted = getDecisionById(body.requestId);
        if (persisted) return NextResponse.json(persisted, { status: 200 });
      }
      console.error('[Database Error] Failed to persist decision record:', dbErr);
      return NextResponse.json({ error: 'Decision could not be durably recorded' }, { status: 503 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[API Error] /api/analyze failure:', err);
    return NextResponse.json(
      { error: 'Internal server error while processing verification request' },
      { status: 500 }
    );
  }
}
