// ============================================================
// Unit Tests: Risk Fusion
// ============================================================

import { describe, it, expect } from 'vitest';
import { RiskFusion } from '@/lib/decision/risk-fusion';
import type { DetectionResult, PerformanceSignal, CostSignal, ResponsibilitySignal } from '@/types';

describe('Risk Fusion', () => {
  const fusion = new RiskFusion();

  const cleanPerf: PerformanceSignal = {
    grounded: true,
    consistencyScore: 95,
    evidenceConflict: false,
    performanceScore: 5,
  };

  const cleanCost: CostSignal = {
    estimatedInputTokens: 50,
    estimatedOutputTokens: 50,
    estimatedCostUsd: 0.001,
    isEstimated: true,
    retryCount: 0,
    loopDetected: false,
    costScore: 5,
  };

  const cleanResp: ResponsibilitySignal = {
    piiDetected: false,
    injectionDetected: false,
    policyViolation: false,
    fairnessConcern: false,
    responsibilityScore: 0,
  };

  it('produces low composite score for all clean signals', () => {
    const result = fusion.compute(cleanPerf, cleanCost, cleanResp, 'low', []);

    expect(result.risk.composite).toBeLessThan(20);
    expect(result.recommendedTier).toBe(0);
    expect(result.risk.businessImpact).toBe('low');
  });

  it('floors composite score at >= 85 if any critical detection is present', () => {
    const criticalDetections: DetectionResult[] = [
      {
        type: 'INJECTION_OVERRIDE',
        severity: 'critical',
        detector: 'InjectionDetector',
        description: 'System override',
        editSafe: false,
      },
    ];

    const result = fusion.compute(cleanPerf, cleanCost, cleanResp, 'low', criticalDetections);
    expect(result.risk.composite).toBeGreaterThanOrEqual(85);
  });

  it('amplifies composite risk proportionally with higher business impact', () => {
    const mediumResp: ResponsibilitySignal = {
      ...cleanResp,
      piiDetected: true,
      responsibilityScore: 50,
    };

    const lowImpactResult = fusion.compute(cleanPerf, cleanCost, mediumResp, 'low');
    const highImpactResult = fusion.compute(cleanPerf, cleanCost, mediumResp, 'high');
    const criticalImpactResult = fusion.compute(cleanPerf, cleanCost, mediumResp, 'critical');

    expect(highImpactResult.risk.composite).toBeGreaterThan(lowImpactResult.risk.composite);
    expect(criticalImpactResult.risk.composite).toBeGreaterThan(highImpactResult.risk.composite);
  });

  it('guarantees composite score is strictly bounded [0, 100]', () => {
    const maxPerf: PerformanceSignal = { ...cleanPerf, performanceScore: 100, evidenceConflict: true };
    const maxCost: CostSignal = { ...cleanCost, costScore: 100 };
    const maxResp: ResponsibilitySignal = { ...cleanResp, responsibilityScore: 100 };

    const maxResult = fusion.compute(maxPerf, maxCost, maxResp, 'critical');
    expect(maxResult.risk.composite).toBeLessThanOrEqual(100);
    expect(maxResult.risk.composite).toBeGreaterThanOrEqual(0);
  });
});
