// ============================================================
// Unit Tests: Cost Engine, Token Estimation & Loop Detection
// ============================================================

import { describe, it, expect } from 'vitest';
import { TokenAnalyzer } from '@/lib/engines/token-analyzer';
import { RetryDetector } from '@/lib/engines/retry-detector';
import { LoopDetector } from '@/lib/engines/loop-detector';
import { CostEngine } from '@/lib/engines/cost-engine';
import type { Message } from '@/types';

describe('Cost Engine', () => {
  const tokenAnalyzer = new TokenAnalyzer();
  const retryDetector = new RetryDetector();
  const loopDetector = new LoopDetector();
  const costEngine = new CostEngine();

  describe('TokenAnalyzer', () => {
    it('estimates tokens with honest isEstimated: true flag', () => {
      const response = 'This is a sample response from an AI model containing approximately sixteen words.';
      const result = tokenAnalyzer.analyze(response, 'gpt-4o');

      expect(result.isEstimated).toBe(true);
      expect(result.estimatedOutputTokens).toBeGreaterThan(10);
      expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0);
      expect(result.totalTokens).toBe(result.estimatedInputTokens + result.estimatedOutputTokens);
    });

    it('generates EXCESSIVE_TOKENS detection for unusually long responses', () => {
      const longResponse = 'word '.repeat(3500); // ~4000+ tokens
      const result = tokenAnalyzer.analyze(longResponse, 'gpt-4o');

      expect(result.detections.some(d => d.type === 'EXCESSIVE_TOKENS')).toBe(true);
    });
  });

  describe('RetryDetector', () => {
    it('detects repeated duplicate queries in session history', () => {
      const sessionHistory: Message[] = [
        { role: 'user', content: 'Generate quarterly report for 2026 Q1' },
        { role: 'assistant', content: 'Processing error occurred.' },
        { role: 'user', content: 'Generate quarterly report for 2026 Q1' },
        { role: 'assistant', content: 'Processing error occurred.' },
        { role: 'user', content: 'Generate quarterly report for 2026 Q1' },
      ];

      const result = retryDetector.detect(sessionHistory);
      expect(result.hasUnnecessaryRetries).toBe(true);
      expect(result.retryCount).toBeGreaterThanOrEqual(2);
      expect(result.detections.some(d => d.type === 'HIGH_RETRY_COUNT')).toBe(true);
    });

    it('passes clean non-repetitive conversation sessions', () => {
      const sessionHistory: Message[] = [
        { role: 'user', content: 'What is the refund policy?' },
        { role: 'assistant', content: 'Items can be returned within 30 days.' },
        { role: 'user', content: 'Can I exchange instead?' },
      ];

      const result = retryDetector.detect(sessionHistory);
      expect(result.hasUnnecessaryRetries).toBe(false);
      expect(result.detections).toHaveLength(0);
    });
  });

  describe('LoopDetector', () => {
    it('detects recursive sequential identical tool calls', () => {
      const toolHistory = [
        'searchDatabase',
        'searchDatabase',
        'searchDatabase',
        'searchDatabase',
      ];

      const result = loopDetector.detect(toolHistory);
      expect(result.loopDetected).toBe(true);
      expect(result.detections.some(d => d.type === 'AGENT_LOOP')).toBe(true);
      expect(result.detections[0].severity).toBe('high');
    });

    it('detects 2-state cyclical oscillation (A -> B -> A -> B -> A -> B)', () => {
      const cyclicalHistory = [
        'checkStatus',
        'refreshCache',
        'checkStatus',
        'refreshCache',
        'checkStatus',
        'refreshCache',
      ];

      const result = loopDetector.detect(cyclicalHistory);
      expect(result.loopDetected).toBe(true);
      expect(result.detections.some(d => d.type === 'AGENT_LOOP')).toBe(true);
    });

    it('passes standard non-looping agent execution chains', () => {
      const normalHistory = ['lookupUser', 'fetchOrder', 'calculateShipping', 'formatResponse'];
      const result = loopDetector.detect(normalHistory);

      expect(result.loopDetected).toBe(false);
      expect(result.detections).toHaveLength(0);
    });
  });

  describe('CostEngine (Integration)', () => {
    it('computes normalized costScore between 0 and 100', () => {
      const cleanResult = costEngine.analyze('Short response.');
      expect(cleanResult.signal.costScore).toBeLessThanOrEqual(20);
      expect(cleanResult.signal.isEstimated).toBe(true);

      const loopResult = costEngine.analyze('Response with loop context', 'gpt-4o', {
        toolCallHistory: ['callA', 'callA', 'callA', 'callA'],
      });
      expect(loopResult.signal.costScore).toBeGreaterThanOrEqual(80);
      expect(loopResult.signal.loopDetected).toBe(true);
    });
  });
});
