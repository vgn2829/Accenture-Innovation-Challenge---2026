// ============================================================
// ControlPlane.ai — Risk Fusion
// ============================================================

import type {
  BusinessImpact,
  CostSignal,
  DetectionResult,
  PerformanceSignal,
  ResponsibilitySignal,
  RiskScores,
  VerificationTier,
} from '@/types';

export interface RiskFusionResult {
  risk: RiskScores;
  dominantSignals: DetectionResult[];
  recommendedTier: VerificationTier;
}

const IMPACT_MULTIPLIERS: Record<BusinessImpact, number> = {
  low: 1.0,
  medium: 1.15,
  high: 1.35,
  critical: 1.6,
};

export class RiskFusion {
  /**
   * Combines individual engine scores into an impact-adjusted composite risk score (0-100).
   */
  public compute(
    performance: PerformanceSignal,
    cost: CostSignal,
    responsibility: ResponsibilitySignal,
    businessImpact: BusinessImpact = 'low',
    detections: DetectionResult[] = []
  ): RiskFusionResult {
    const perfScore = Math.max(0, Math.min(100, performance.performanceScore));
    const costScore = Math.max(0, Math.min(100, cost.costScore));
    const respScore = Math.max(0, Math.min(100, responsibility.responsibilityScore));

    // Base weighted score: 40% Responsibility, 40% Performance, 20% Cost
    const rawWeighted = respScore * 0.4 + perfScore * 0.4 + costScore * 0.2;

    // Apply business impact multiplier
    const multiplier = IMPACT_MULTIPLIERS[businessImpact] || 1.0;
    let composite = rawWeighted * multiplier;

    // Critical detector override: Any critical detection floors composite at 85
    const hasCritical = detections.some(d => d.severity === 'critical');
    if (hasCritical) {
      composite = Math.max(composite, 85);
    }

    // High factual conflict floors at 80
    if (performance.evidenceConflict) {
      composite = Math.max(composite, 80);
    }

    // Clamp score to [0, 100]
    composite = Math.round(Math.max(0, Math.min(100, composite)));

    // Sort and extract dominant signals (highest severity first)
    const severityRank: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };
    const dominantSignals = [...detections].sort(
      (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
    );

    // Determine verification tier recommendation
    let recommendedTier: VerificationTier = 0;
    if (composite >= 60 || businessImpact === 'high' || businessImpact === 'critical' || performance.evidenceConflict) {
      recommendedTier = 2;
    } else if (composite >= 25 || businessImpact === 'medium' || responsibility.piiDetected) {
      recommendedTier = 1;
    }

    const risk: RiskScores = {
      performance: perfScore,
      cost: costScore,
      responsibility: respScore,
      composite,
      businessImpact,
    };

    return {
      risk,
      dominantSignals,
      recommendedTier,
    };
  }
}
