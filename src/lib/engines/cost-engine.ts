// ============================================================
// ControlPlane.ai — Cost Engine
// ============================================================

import { TokenAnalyzer } from './token-analyzer';
import { RetryDetector } from './retry-detector';
import { LoopDetector } from './loop-detector';
import type { CostSignal, DetectionResult, Message } from '@/types';

export interface CostAnalysis {
  signal: CostSignal;
  detections: DetectionResult[];
}

export class CostEngine {
  private tokenAnalyzer: TokenAnalyzer;
  private retryDetector: RetryDetector;
  private loopDetector: LoopDetector;

  constructor() {
    this.tokenAnalyzer = new TokenAnalyzer();
    this.retryDetector = new RetryDetector();
    this.loopDetector = new LoopDetector();
  }

  public analyze(
    aiResponse: string,
    model = 'gpt-4o',
    context?: {
      sessionHistory?: Message[];
      retrievedDocs?: string[];
      toolCallHistory?: string[];
    }
  ): CostAnalysis {
    const tokenRes = this.tokenAnalyzer.analyze(
      aiResponse,
      model,
      context?.sessionHistory,
      context?.retrievedDocs
    );
    const retryRes = this.retryDetector.detect(context?.sessionHistory);
    const loopRes = this.loopDetector.detect(context?.toolCallHistory);

    const detections: DetectionResult[] = [
      ...tokenRes.detections,
      ...retryRes.detections,
      ...loopRes.detections,
    ];

    // Compute Cost Risk Score (0-100: higher = greater waste/runaway cost risk)
    let costScore = 5; // Baseline low risk

    if (loopRes.loopDetected) {
      costScore = Math.max(costScore, 85);
    }
    if (retryRes.hasUnnecessaryRetries) {
      costScore = Math.max(costScore, 45 + retryRes.retryCount * 10);
    }
    if (tokenRes.estimatedOutputTokens > 3000) {
      costScore = Math.max(costScore, 50);
    }

    costScore = Math.min(100, Math.max(0, costScore));

    const signal: CostSignal = {
      estimatedInputTokens: tokenRes.estimatedInputTokens,
      estimatedOutputTokens: tokenRes.estimatedOutputTokens,
      estimatedCostUsd: tokenRes.estimatedCostUsd,
      isEstimated: true,
      retryCount: retryRes.retryCount,
      loopDetected: loopRes.loopDetected,
      costScore,
    };

    return {
      signal,
      detections,
    };
  }
}
