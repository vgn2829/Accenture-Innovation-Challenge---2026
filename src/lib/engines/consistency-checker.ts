// ============================================================
// ControlPlane.ai — Consistency Checker (Performance Engine)
// ============================================================

import type { DetectionResult, Evidence } from '@/types';

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  score: number; // 0-100, 100 = perfectly consistent, 0 = severe contradiction
  detections: DetectionResult[];
  evidence: Evidence[];
}

export class ConsistencyChecker {
  /**
   * Evaluates text for internal logical self-contradictions and conflicting assertions.
   */
  public check(aiResponse: string): ConsistencyCheckResult {
    const detections: DetectionResult[] = [];
    const evidence: Evidence[] = [];
    const lower = aiResponse.toLowerCase();

    // 1. Direct polarity contradictions (Yes and No to the same subject)
    const refundApproval = /(?:refund (?:is|has been) approved|eligible for a full refund)/i.test(lower);
    const refundDenial = /(?:cannot provide a refund|not eligible for (?:a )?refund|refund is denied|no refund will be issued)/i.test(lower);

    if (refundApproval && refundDenial) {
      const ev: Evidence = {
        label: 'Internal Self-Contradiction',
        claimed: 'Simultaneous refund approval and denial in single response',
        detail: 'AI response explicitly states both that a refund is approved and that the user is not eligible for a refund.',
      };
      evidence.push(ev);
      detections.push({
        type: 'CONSISTENCY_FAILURE',
        severity: 'high',
        detector: 'ConsistencyChecker',
        description: 'Response contains self-contradictory claims regarding refund eligibility.',
        evidence: [ev],
        editSafe: false,
      });
    }

    // 2. Cancellation status contradictions
    const cancelConfirmed = /(?:order (?:has been|is) cancelled|cancellation confirmed)/i.test(lower);
    const cancelDenied = /(?:order cannot be cancelled|unable to cancel your order|already dispatched)/i.test(lower);

    if (cancelConfirmed && cancelDenied) {
      const ev: Evidence = {
        label: 'Order Action Contradiction',
        claimed: 'Order cancelled vs cannot cancel',
        detail: 'Response states order is cancelled while also stating it cannot be cancelled.',
      };
      evidence.push(ev);
      detections.push({
        type: 'CONSISTENCY_FAILURE',
        severity: 'high',
        detector: 'ConsistencyChecker',
        description: 'Response asserts mutually exclusive order cancellation states.',
        evidence: [ev],
        editSafe: false,
      });
    }

    const isConsistent = detections.length === 0;
    const score = isConsistent ? 95 : Math.max(10, 95 - detections.length * 40);

    return {
      isConsistent,
      score,
      detections,
      evidence,
    };
  }
}
