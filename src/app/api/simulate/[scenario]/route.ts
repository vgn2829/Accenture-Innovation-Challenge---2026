// ============================================================
// ControlPlane.ai — POST /api/simulate/[scenario]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { SCENARIO_FIXTURES } from '@/lib/fixtures/scenarios';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';
import { persistDecision } from '@/lib/db/operations';
import type { ScenarioId, UseCaseProfileId } from '@/types';

const orchestrator = new VerificationOrchestrator();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ scenario: string }> }
) {
  try {
    const { scenario: rawScenario } = await context.params;
    const scenarioId = (rawScenario || '').toUpperCase() as ScenarioId;

    if (!['A', 'B', 'C', 'D'].includes(scenarioId)) {
      return NextResponse.json(
        {
          error: `Invalid scenario identifier "${rawScenario}". Supported scenarios: A, B, C, D`,
        },
        { status: 400 }
      );
    }

    const fixture = SCENARIO_FIXTURES[scenarioId];
    if (!fixture) {
      return NextResponse.json(
        { error: `Fixture definition for Scenario ${scenarioId} not found` },
        { status: 404 }
      );
    }

    let options: { profile?: UseCaseProfileId; region?: string } = {};
    try { options = await req.json(); } catch { /* fixture execution does not require a body */ }
    const validProfiles: UseCaseProfileId[] = ['customer_support', 'knowledge_assistant', 'decision_support'];
    if (options.profile && !validProfiles.includes(options.profile)) return NextResponse.json({ error: `Invalid profile. Allowed values: ${validProfiles.join(', ')}` }, { status: 400 });
    const result = await orchestrator.run({ ...fixture.request, profile: options.profile || fixture.request.profile, region: options.region || fixture.request.region });

    // Persist to audit log & control desk queue
    try {
      persistDecision(result);
    } catch (dbErr) {
      console.error('[Database Error] Failed to persist simulated scenario decision:', dbErr);
      return NextResponse.json({ error: 'Simulated decision could not be durably recorded' }, { status: 503 });
    }

    return NextResponse.json(
      {
        ...result,
        scenarioInfo: {
          id: fixture.id,
          title: fixture.title,
          category: fixture.category,
          expectedDecision: fixture.expectedDecision,
          description: fixture.description,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API Error] /api/simulate/[scenario] failure:', err);
    return NextResponse.json(
      { error: 'Internal server error executing scenario simulation' },
      { status: 500 }
    );
  }
}
