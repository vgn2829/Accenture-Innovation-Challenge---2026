// ============================================================
// ControlPlane.ai — Safety & Policy Detector (Responsibility Engine)
// ============================================================

import type { DetectionResult, TaskType } from '@/types';

export interface SafetyPolicyResult {
  hasPolicyViolation: boolean;
  hasFairnessConcern: boolean;
  detections: DetectionResult[];
}

export class SafetyPolicyDetector {
  /**
   * Checks for enterprise policy violations, protected attribute discrimination (e.g. hiring bias in Scenario D),
   * and unsafe legal/financial commitments.
   */
  public detect(text: string, taskType: TaskType = 'general'): SafetyPolicyResult {
    const detections: DetectionResult[] = [];
    const lower = text.toLowerCase();

    // 1. Hiring / Evaluation Fairness (Hero Scenario D)
    if (taskType === 'hiring' || /candidate|applicant|hiring|interview/i.test(lower)) {
      const demographicBiasRegex = /(?:prefer|preferring|recommend|recommending|favour|favouring|prioritize|prioritizing|reject|rejecting|avoid|avoiding|filter\s+out|filtering\s+out)[\w\s,.-]{0,30}?(?:female|male|women|men|older|younger|pregnant|married|unmarried)\s+(?:candidates|applicants|hires|engineers|workers)/i;
      const biasMatch = demographicBiasRegex.exec(text);

      if (biasMatch) {
        detections.push({
          type: 'FAIRNESS_CONCERN',
          severity: 'high',
          detector: 'SafetyPolicyDetector',
          description: `Discriminatory hiring recommendation based on demographic attribute: "${biasMatch[0]}"`,
          matchedText: biasMatch[0],
          editSafe: false, // Subjective policy judgments require human escalation
        });
      }

      // Demographic attribute weighting in scoring
      if (/gender|ethnicity|caste|marital status|age bracket/i.test(lower) && /score|weight|criterion|ranking|balance|reject/i.test(lower) && detections.length === 0) {
        detections.push({
          type: 'FAIRNESS_CONCERN',
          severity: 'high',
          detector: 'SafetyPolicyDetector',
          description: 'Candidate evaluation directly incorporates protected demographic characteristics.',
          editSafe: false,
        });
      }
    }

    // 2. Unsafe Financial / Legal Guarantees
    if (taskType === 'financial' || taskType === 'customer-support') {
      const guaranteeRegex = /(?:we guarantee|100% guaranteed|we legally promise|absolute return of \d+%)/i;
      const guaranteeMatch = guaranteeRegex.exec(text);
      if (guaranteeMatch) {
        detections.push({
          type: 'POLICY_VIOLATION',
          severity: 'medium',
          detector: 'SafetyPolicyDetector',
          description: `Unauthorized financial/legal guarantee detected: "${guaranteeMatch[0]}"`,
          matchedText: guaranteeMatch[0],
          editSafe: false,
        });
      }
    }

    const hasFairnessConcern = detections.some(d => d.type === 'FAIRNESS_CONCERN');
    const hasPolicyViolation = detections.some(d => d.type === 'POLICY_VIOLATION' || d.type === 'UNSAFE_CONTENT');

    return {
      hasPolicyViolation,
      hasFairnessConcern,
      detections,
    };
  }
}
