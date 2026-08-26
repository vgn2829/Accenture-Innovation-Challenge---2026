// ============================================================
// ControlPlane.ai — Responsibility Engine
// ============================================================

import { PIIDetector } from './pii-detector';
import { InjectionDetector } from './injection-detector';
import { SafetyPolicyDetector } from './safety-policy';
import type { DetectionResult, ResponsibilitySignal, TaskType } from '@/types';

export interface ResponsibilityAnalysis {
  signal: ResponsibilitySignal;
  detections: DetectionResult[];
  sanitizedText: string;
}

export class ResponsibilityEngine {
  private piiDetector: PIIDetector;
  private injectionDetector: InjectionDetector;
  private safetyPolicyDetector: SafetyPolicyDetector;

  constructor() {
    this.piiDetector = new PIIDetector();
    this.injectionDetector = new InjectionDetector();
    this.safetyPolicyDetector = new SafetyPolicyDetector();
  }

  public analyze(aiResponse: string, taskType: TaskType = 'general'): ResponsibilityAnalysis {
    const piiRes = this.piiDetector.detect(aiResponse);
    const injectionRes = this.injectionDetector.detect(aiResponse);
    const safetyRes = this.safetyPolicyDetector.detect(aiResponse, taskType);

    const detections: DetectionResult[] = [
      ...piiRes.detections,
      ...injectionRes.detections,
      ...safetyRes.detections,
    ];

    // Compute Responsibility Risk Score (0-100: higher = more risk)
    let responsibilityScore = 0;

    if (injectionRes.hasInjection) {
      responsibilityScore = Math.max(responsibilityScore, 90);
    }
    if (safetyRes.hasFairnessConcern) {
      responsibilityScore = Math.max(responsibilityScore, 75);
    }
    if (safetyRes.hasPolicyViolation) {
      responsibilityScore = Math.max(responsibilityScore, 60);
    }
    if (piiRes.hasPII) {
      const hasCriticalPII = piiRes.detections.some(
        d => d.type === 'PII_CREDIT_CARD' || d.type === 'PII_AADHAAR'
      );
      responsibilityScore = Math.max(responsibilityScore, hasCriticalPII ? 80 : 50);
    }

    responsibilityScore = Math.min(100, Math.max(0, responsibilityScore));

    const signal: ResponsibilitySignal = {
      piiDetected: piiRes.hasPII,
      injectionDetected: injectionRes.hasInjection,
      policyViolation: safetyRes.hasPolicyViolation,
      fairnessConcern: safetyRes.hasFairnessConcern,
      responsibilityScore,
    };

    return {
      signal,
      detections,
      sanitizedText: piiRes.sanitizedText,
    };
  }
}
