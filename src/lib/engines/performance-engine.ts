// ============================================================
// ControlPlane.ai — Performance Engine
// ============================================================

import { EvidenceVerifier } from './evidence-verifier';
import { ConsistencyChecker } from './consistency-checker';
import type { BusinessRecord, ClaimType, DetectionResult, Evidence, PerformanceSignal } from '@/types';

export interface PerformanceAnalysis {
  signal: PerformanceSignal;
  detections: DetectionResult[];
  evidence: Evidence[];
}

export class PerformanceEngine {
  private evidenceVerifier: EvidenceVerifier;
  private consistencyChecker: ConsistencyChecker;

  constructor() {
    this.evidenceVerifier = new EvidenceVerifier();
    this.consistencyChecker = new ConsistencyChecker();
  }

  public analyze(
    aiResponse: string,
    context?: {
      businessRecords?: Record<string, BusinessRecord>;
      retrievedDocs?: string[];
      claimType?: ClaimType;
    }
  ): PerformanceAnalysis {
    const evidenceRes = this.evidenceVerifier.verify(aiResponse, context?.businessRecords, context?.claimType);
    const consistencyRes = this.consistencyChecker.check(aiResponse);

    const detections: DetectionResult[] = [
      ...evidenceRes.detections,
      ...consistencyRes.detections,
    ];
    const evidence: Evidence[] = [
      ...evidenceRes.evidence,
      ...consistencyRes.evidence,
    ];

    // Compute Performance Risk Score (0-100: higher = more risk)
    let performanceScore = 5; // Baseline low risk for clean grounded output

    if (evidenceRes.status === 'CONFLICT') {
      performanceScore = Math.max(performanceScore, 85);
    } else if (evidenceRes.status === 'UNVERIFIED') {
      performanceScore = Math.max(performanceScore, 35);
    }

    if (!consistencyRes.isConsistent) {
      performanceScore = Math.max(performanceScore, 75);
    }

    // Adjust score based on severe detections
    for (const d of detections) {
      if (d.severity === 'critical') performanceScore = Math.max(performanceScore, 95);
      else if (d.severity === 'high') performanceScore = Math.max(performanceScore, 75);
      else if (d.severity === 'medium') performanceScore = Math.max(performanceScore, 50);
    }

    performanceScore = Math.min(100, Math.max(0, performanceScore));

    const signal: PerformanceSignal = {
      grounded: evidenceRes.status === 'VERIFIED' || evidenceRes.status === 'NOT_APPLICABLE',
      verificationState: evidenceRes.status,
      consistencyScore: consistencyRes.score,
      evidenceConflict: evidenceRes.status === 'CONFLICT',
      evidenceDetails: evidence,
      performanceScore,
    };

    return {
      signal,
      detections,
      evidence,
    };
  }
}
