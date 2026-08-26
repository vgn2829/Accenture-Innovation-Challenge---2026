// ============================================================
// ControlPlane.ai — Token & Cost Analyzer (Cost Engine)
// ============================================================

import type { DetectionResult, Message } from '@/types';

export interface TokenAnalysisResult {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  isEstimated: true; // Mandatory honest labeling
  detections: DetectionResult[];
}

const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  'gpt-4o': { inputPerMillion: 5.0, outputPerMillion: 15.0 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'claude-3-5-sonnet': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-3-haiku': { inputPerMillion: 0.25, outputPerMillion: 1.25 },
  'gemini-1.5-pro': { inputPerMillion: 3.5, outputPerMillion: 10.5 },
  default: { inputPerMillion: 2.0, outputPerMillion: 8.0 },
};

export class TokenAnalyzer {
  /**
   * Estimates tokens based on character count and word boundary heuristics (~4 chars/token).
   */
  public estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;
    // Standard rule of thumb: ~4 characters per token in English text
    const charEstimate = Math.ceil(text.length / 4);
    const wordEstimate = Math.ceil(text.trim().split(/\s+/).length * 1.3);
    return Math.max(charEstimate, wordEstimate);
  }

  public analyze(
    aiResponse: string,
    model = 'gpt-4o',
    sessionHistory?: Message[],
    retrievedDocs?: string[]
  ): TokenAnalysisResult {
    const detections: DetectionResult[] = [];

    // Calculate input tokens
    let totalInputChars = 0;
    if (sessionHistory && sessionHistory.length > 0) {
      totalInputChars += sessionHistory.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    }
    if (retrievedDocs && retrievedDocs.length > 0) {
      totalInputChars += retrievedDocs.reduce((acc, doc) => acc + (doc?.length || 0), 0);
    }

    const estimatedInputTokens = this.estimateTokens(totalInputChars > 0 ? ' '.repeat(totalInputChars) : 'User prompt default');
    const estimatedOutputTokens = this.estimateTokens(aiResponse);
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;

    // Pricing calculation
    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING.default;
    const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPerMillion;
    const estimatedCostUsd = Number((inputCost + outputCost).toFixed(6));

    // Excessive token threshold warning
    if (estimatedOutputTokens > 4000) {
      detections.push({
        type: 'EXCESSIVE_TOKENS',
        severity: 'medium',
        detector: 'TokenAnalyzer',
        description: `Output token length (~${estimatedOutputTokens} tokens) is unusually high for standard conversational response.`,
        editSafe: false,
      });
    }

    return {
      estimatedInputTokens,
      estimatedOutputTokens,
      totalTokens,
      estimatedCostUsd,
      isEstimated: true,
      detections,
    };
  }
}
