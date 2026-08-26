// ============================================================
// ControlPlane.ai — Loop & Budget Detector (Cost Engine)
// ============================================================

import type { DetectionResult } from '@/types';

export interface LoopDetectionResult {
  loopDetected: boolean;
  repeatedToolCount: number;
  detections: DetectionResult[];
}

export class LoopDetector {
  /**
   * Analyzes tool call history or conversational cyclical patterns to detect runaway agent loops.
   */
  public detect(toolCallHistory?: string[]): LoopDetectionResult {
    const detections: DetectionResult[] = [];

    if (!toolCallHistory || toolCallHistory.length < 3) {
      return { loopDetected: false, repeatedToolCount: 0, detections };
    }

    // Count frequency of sequential identical tool calls
    let maxConsecutiveIdentical = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < toolCallHistory.length; i++) {
      if (toolCallHistory[i] === toolCallHistory[i - 1]) {
        currentConsecutive++;
        if (currentConsecutive > maxConsecutiveIdentical) {
          maxConsecutiveIdentical = currentConsecutive;
        }
      } else {
        currentConsecutive = 1;
      }
    }

    // Check for 2-element cycle (A -> B -> A -> B -> A -> B)
    let cycleCount = 0;
    if (toolCallHistory.length >= 6) {
      const len = toolCallHistory.length;
      if (
        toolCallHistory[len - 1] === toolCallHistory[len - 3] &&
        toolCallHistory[len - 3] === toolCallHistory[len - 5] &&
        toolCallHistory[len - 2] === toolCallHistory[len - 4]
      ) {
        cycleCount = 3;
      }
    }

    const loopDetected = maxConsecutiveIdentical >= 3 || cycleCount >= 3 || toolCallHistory.length > 15;

    if (loopDetected) {
      detections.push({
        type: 'AGENT_LOOP',
        severity: maxConsecutiveIdentical >= 5 || toolCallHistory.length > 20 ? 'critical' : 'high',
        detector: 'LoopDetector',
        description: `Agent loop detected: ${maxConsecutiveIdentical} consecutive identical tool calls or cyclical tool oscillation.`,
        editSafe: false,
      });
    }

    return {
      loopDetected,
      repeatedToolCount: maxConsecutiveIdentical,
      detections,
    };
  }
}
