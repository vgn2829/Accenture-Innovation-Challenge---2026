// ============================================================
// ControlPlane.ai — Retry Detector (Cost Engine)
// ============================================================

import type { DetectionResult, Message } from '@/types';

export interface RetryDetectionResult {
  retryCount: number;
  hasUnnecessaryRetries: boolean;
  detections: DetectionResult[];
}

export class RetryDetector {
  /**
   * Examines session history for repeated identical or near-identical prompts/errors indicating a retry storm.
   */
  public detect(sessionHistory?: Message[]): RetryDetectionResult {
    const detections: DetectionResult[] = [];
    if (!sessionHistory || sessionHistory.length < 3) {
      return { retryCount: 0, hasUnnecessaryRetries: false, detections };
    }

    let retryCount = 0;
    const userMessages = sessionHistory.filter(m => m.role === 'user').map(m => m.content.trim().toLowerCase());

    // Check for repetitive user submissions or automated retries
    for (let i = 1; i < userMessages.length; i++) {
      if (userMessages[i] === userMessages[i - 1] && userMessages[i].length > 5) {
        retryCount++;
      }
    }

    if (retryCount >= 2) {
      detections.push({
        type: 'HIGH_RETRY_COUNT',
        severity: retryCount >= 4 ? 'high' : 'medium',
        detector: 'RetryDetector',
        description: `Detected ${retryCount} consecutive duplicate query attempts in session context.`,
        editSafe: false,
      });
    }

    return {
      retryCount,
      hasUnnecessaryRetries: retryCount >= 2,
      detections,
    };
  }
}
