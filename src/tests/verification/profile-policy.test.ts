import { describe, expect, it } from 'vitest';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';
import { VerificationPolicyEngine } from '@/lib/verification/verification-policy';

describe('use-case-aware policy profiles', () => {
  it('assigns different tiers and budgets to the same material claim', () => {
    const engine = new VerificationPolicyEngine();
    const support = engine.select('POLICY', 'medium', 'customer_support', 'IN');
    const knowledge = engine.select('POLICY', 'medium', 'knowledge_assistant', 'IN');
    const decision = engine.select('POLICY', 'medium', 'decision_support', 'EU');
    expect(support.minimumTier).toBe(1);
    expect(knowledge.minimumTier).toBe(1);
    expect(decision.minimumTier).toBe(2);
    expect(support.maxLatencyBudget).toBe(100);
    expect(decision.maxLatencyBudget).toBe(1000);
    expect(decision.region).toBe('EU');
  });

  it('forces conversation cost checks when tool history exists', async () => {
    const result = await new VerificationOrchestrator().run({
      model: 'gpt-4o', taskType: 'customer-support', aiResponse: 'The agent is checking again.',
      context: { toolCallHistory: ['lookup', 'lookup', 'lookup'] },
    });
    expect(result.verificationTier).toBe(1);
    expect(result.detections.some(d => d.type === 'AGENT_LOOP')).toBe(true);
    expect(result.decision).toBe('ESCALATE');
  });
});
