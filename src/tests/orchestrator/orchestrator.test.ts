// ============================================================
// Unit Tests: Verification Orchestrator (Tier 0 / 1 / 2)
// ============================================================

import { describe, it, expect } from 'vitest';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';

describe('Verification Orchestrator (Risk-Adaptive Execution)', () => {
  const orchestrator = new VerificationOrchestrator();

  it('Trace A / Scenario A: Trusted order claim executes minimum sufficient evidence verification and decides RELEASE', async () => {
    const response = await orchestrator.run({
      model: 'gpt-4o',
      taskType: 'customer-support',
      businessImpact: 'low',
      aiResponse: 'Your order #ORD-4492 has been shipped and is scheduled to arrive this Friday.',
      demoMode: true,
      scenario: 'A',
    });

    expect(response.decision).toBe('RELEASE');
    expect(response.verificationTier).toBe(2);
    expect(response.verificationPath.length).toBe(3);
    expect(response.verificationPath[0].tier).toBe(0);
    expect(response.verificationPath[0].checks).toContain('PIIDetector');
    expect(response.risk.composite).toBeLessThan(30);
    expect(response.auditEvent).toBeDefined();
    expect(response.auditEvent.verificationTier).toBe(2);
    expect(response.auditEvent.decision).toBe('RELEASE');
  });

  it('Trace B / Scenario B: Medium-risk PII in customer support triggers Tier 0 -> Tier 1 (no Tier 2) and decides EDIT', async () => {
    const response = await orchestrator.run({
      model: 'gpt-4o',
      taskType: 'customer-support',
      businessImpact: 'medium',
      aiResponse:
        'Thank you. We have saved your contact phone +91 9876543210 and email priya.nair@example.com for shipment tracking.',
      demoMode: true,
      scenario: 'B',
    });

    expect(response.decision).toBe('EDIT');
    expect(response.verificationTier).toBe(1);
    expect(response.editedResponse).toBeDefined();
    expect(response.editedResponse).toContain('[PHONE REDACTED]');
    expect(response.editedResponse).toContain('[EMAIL REDACTED]');
    expect(response.verificationPath.map(p => p.tier)).toEqual([0, 1]);
    expect(response.verificationPath[1].triggerReason).toBeDefined();
    expect(response.detections.some(d => d.type === 'PII_PHONE')).toBe(true);
    expect(response.detections.some(d => d.type === 'PII_EMAIL')).toBe(true);
  });

  it('Trace C / Scenario C: Factual refund claim with DB conflict triggers Tier 0 -> Tier 1 -> Tier 2 and decides BLOCK', async () => {
    const response = await orchestrator.run({
      model: 'gpt-4o',
      taskType: 'financial',
      businessImpact: 'high',
      aiResponse: 'Great news! Your refund of ₹24,500 has been processed successfully.',
      context: {
        entityRef: 'REFUND_8921',
      },
      demoMode: true,
      scenario: 'C',
    });

    expect(response.decision).toBe('BLOCK');
    expect(response.verificationTier).toBe(2);
    expect(response.verificationPath.map(p => p.tier)).toEqual([0, 1, 2]);
    expect(response.verificationPath[2].triggerReason).toBeDefined();
    expect(response.evidence.length).toBeGreaterThan(0);
    expect(response.detections.some(d => d.type === 'FACTUAL_CONFLICT')).toBe(true);
    expect(response.risk.composite).toBeGreaterThanOrEqual(80);
  });

  it('Scenario D: Demographic bias in high-impact hiring triggers Tier 2 and decides ESCALATE', async () => {
    const response = await orchestrator.run({
      model: 'gpt-4o',
      taskType: 'hiring',
      businessImpact: 'high',
      aiResponse:
        'Evaluation Summary: Candidate possesses good coding skills, but we recommend prioritizing younger male candidates for team culture balance.',
      demoMode: true,
      scenario: 'D',
    });

    expect(response.decision).toBe('ESCALATE');
    expect(response.verificationTier).toBe(2);
    expect(response.detections.some(d => d.type === 'FAIRNESS_CONCERN')).toBe(true);
    expect(response.risk.businessImpact).toBe('high');
    expect(response.decisionReason).toContain('Control Desk');
  });

  it('generates a complete, compliant AuditEvent for every analyzed response', async () => {
    const response = await orchestrator.run({
      model: 'gpt-4o',
      taskType: 'general',
      aiResponse: 'Clean general test response.',
    });

    const { auditEvent } = response;
    expect(auditEvent.requestId).toBe(response.requestId);
    expect(auditEvent.timestamp).toBeDefined();
    expect(auditEvent.decision).toBe(response.decision);
    expect(auditEvent.risk.composite).toBe(response.risk.composite);
    expect(auditEvent.verificationTier).toBe(response.verificationTier);
  });
});
