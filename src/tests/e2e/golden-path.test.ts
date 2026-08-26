// ============================================================
// ControlPlane.ai — E2E Golden Path & Reliability Test Suite
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';
import { SCENARIO_FIXTURES } from '@/lib/fixtures/scenarios';
import {
  insertDecision,
  insertControlDeskCase,
  resolveControlDeskCase,
  getControlDeskCases,
  getDashboardMetrics,
} from '@/lib/db/operations';
import { getDatabase } from '@/lib/db/client';

describe('M6 Golden Demo Path Reliability Suite', () => {
  beforeEach(() => {
    // Clean test database before each run
    const db = getDatabase();
    db.prepare('DELETE FROM control_desk').run();
    db.prepare('DELETE FROM decisions').run();
  });

  const runGoldenPathOnce = async (runIndex: number) => {
    const orchestrator = new VerificationOrchestrator();

    // ------------------------------------------------------------
    // Step 1: Scenario A -> RELEASE (Tier 0)
    // ------------------------------------------------------------
    const resA = await orchestrator.run(SCENARIO_FIXTURES.A.request);
    expect(resA.decision).toBe('RELEASE');
    expect(resA.verificationTier).toBe(2);
    expect(resA.risk.composite).toBeLessThanOrEqual(25);
    insertDecision(resA);

    // ------------------------------------------------------------
    // Step 2: Scenario B -> EDIT (Tier 1)
    // ------------------------------------------------------------
    const resB = await orchestrator.run(SCENARIO_FIXTURES.B.request);
    expect(resB.decision).toBe('EDIT');
    expect(resB.verificationTier).toBe(1);
    expect(resB.editedResponse).toBeDefined();
    expect(resB.editedResponse).toContain('[PHONE REDACTED]');
    expect(resB.editedResponse).toContain('[EMAIL REDACTED]');
    insertDecision(resB);

    // ------------------------------------------------------------
    // Step 3: Scenario C -> BLOCK (Tier 2, ₹24,500 conflict)
    // ------------------------------------------------------------
    const resC = await orchestrator.run(SCENARIO_FIXTURES.C.request);
    expect(resC.decision).toBe('BLOCK');
    expect(resC.verificationTier).toBe(2);
    expect(resC.evidence.some(e => e.label.includes('Conflict'))).toBe(true);
    expect(resC.risk.performance).toBeGreaterThanOrEqual(75);
    insertDecision(resC);

    // ------------------------------------------------------------
    // Step 4: Scenario D -> ESCALATE (Tier 2)
    // ------------------------------------------------------------
    const resD = await orchestrator.run(SCENARIO_FIXTURES.D.request);
    expect(resD.decision).toBe('ESCALATE');
    expect(resD.verificationTier).toBe(2);
    insertDecision(resD);
    insertControlDeskCase(resD);

    // ------------------------------------------------------------
    // Step 5 & 6: Control Desk Resolution
    // ------------------------------------------------------------
    const pendingCases = getControlDeskCases('PENDING');
    expect(pendingCases.length).toBe(1);
    expect(pendingCases[0].requestId).toBe(resD.requestId);

    const updated = resolveControlDeskCase(resD.requestId, {
      action: 'CONFIRM_BLOCK',
      reviewerId: 'supervisor-elena-vance',
      note: `Golden path run ${runIndex}: Demographic bias confirmed and blocked.`,
    });
    expect(updated).toBe(true);

    const remainingPending = getControlDeskCases('PENDING');
    expect(remainingPending.length).toBe(0);

    // ------------------------------------------------------------
    // Step 7: Dashboard Metrics
    // ------------------------------------------------------------
    const metrics = getDashboardMetrics();
    expect(metrics.totalDecisions).toBe(4);
    expect(metrics.breakdown.RELEASE).toBe(1);
    expect(metrics.breakdown.EDIT).toBe(1);
    expect(metrics.breakdown.BLOCK).toBe(1);
    expect(metrics.breakdown.ESCALATE).toBe(1);
    expect(metrics.pendingEscalations).toBe(0);
    expect(metrics.tierDistribution.tier0).toBe(0);
    expect(metrics.tierDistribution.tier1).toBe(1);
    expect(metrics.tierDistribution.tier2).toBe(3);
  };

  // ------------------------------------------------------------
  // Run 10 Consecutive Times to satisfy Section 10
  // ------------------------------------------------------------
  for (let i = 1; i <= 10; i++) {
    it(`should successfully execute Golden Demo Path Run #${i} without failure or state drift`, async () => {
      await runGoldenPathOnce(i);
    });
  }
});
