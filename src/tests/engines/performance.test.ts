// ============================================================
// Unit Tests: Performance Engine & Evidence Verification
// ============================================================

import { describe, it, expect } from 'vitest';
import { EvidenceVerifier } from '@/lib/engines/evidence-verifier';
import { ConsistencyChecker } from '@/lib/engines/consistency-checker';
import { PerformanceEngine } from '@/lib/engines/performance-engine';

describe('Performance Engine', () => {
  const verifier = new EvidenceVerifier();
  const consistencyChecker = new ConsistencyChecker();
  const engine = new PerformanceEngine();

  describe('EvidenceVerifier - Hero Scenario C (₹24,500 Refund Conflict)', () => {
    it('detects factual conflict when AI asserts refund processed but record shows REJECTED', () => {
      const aiResponse =
        'Good news! Your refund of ₹24,500 has been processed successfully to your original payment method.';
      const businessRecords = {
        refund: {
          refund_id: 'REF_99823',
          amount: 24500,
          currency: 'INR',
          status: 'REJECTED',
          reason: 'Customer initiated after 30-day window',
        },
      };

      const result = verifier.verify(aiResponse, businessRecords);

      expect(result.status).toBe('CONFLICT');
      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.detections[0].type).toBe('FACTUAL_CONFLICT');
      expect(result.detections[0].severity).toBe('critical');
      expect(result.detections[0].editSafe).toBe(false);
      expect(result.evidence.some(e => e.label.includes('Status Conflict'))).toBe(true);
    });

    it('detects amount mismatch when claimed amount differs from authorized record', () => {
      const aiResponse = 'We have initiated a refund of ₹30,000 for your return.';
      const businessRecords = {
        refund: {
          amount: 24500,
          status: 'PROCESSED',
        },
      };

      const result = verifier.verify(aiResponse, businessRecords);
      expect(result.status).toBe('CONFLICT');
      expect(result.evidence.some(e => e.label.includes('Amount Mismatch'))).toBe(true);
    });

    it('returns VERIFIED when AI statement aligns with processed record', () => {
      const aiResponse = 'Your refund of ₹24,500 has been processed.';
      const businessRecords = {
        refund: {
          amount: 24500,
          status: 'PROCESSED',
        },
      };

      const result = verifier.verify(aiResponse, businessRecords);
      expect(result.status).toBe('VERIFIED');
      expect(result.detections).toHaveLength(0);
    });

    it('returns UNVERIFIED gracefully without crashing when business records are empty or missing', () => {
      const aiResponse = 'Your refund of ₹24,500 has been processed.';
      const result = verifier.verify(aiResponse, {});

      expect(result.status).toBe('UNVERIFIED');
      expect(result.evidence[0].actual).toContain('No ground-truth');
      expect(result.detections).toHaveLength(0);
    });

    it('safely handles malformed business record objects without throwing', () => {
      const aiResponse = 'Your refund has been processed.';
      const malformedRecords = {
        refund: null as unknown as Record<string, unknown>,
        random: { nested: undefined },
      };

      expect(() => verifier.verify(aiResponse, malformedRecords)).not.toThrow();
    });
  });

  describe('ConsistencyChecker', () => {
    it('detects internal polarity contradictions (approved vs denied)', () => {
      const aiResponse =
        'Your refund is approved. However, please note you are not eligible for a refund due to our policy.';
      const result = consistencyChecker.check(aiResponse);

      expect(result.isConsistent).toBe(false);
      expect(result.detections.length).toBe(1);
      expect(result.detections[0].type).toBe('CONSISTENCY_FAILURE');
    });

    it('returns score 95 for internally consistent statements', () => {
      const aiResponse = 'Your order has been shipped and is scheduled for delivery on Friday.';
      const result = consistencyChecker.check(aiResponse);

      expect(result.isConsistent).toBe(true);
      expect(result.score).toBe(95);
      expect(result.detections).toHaveLength(0);
    });
  });

  describe('PerformanceEngine (Integration)', () => {
    it('produces normalized performanceScore from 0 to 100', () => {
      const cleanResult = engine.analyze('Your package is on the way.');
      expect(cleanResult.signal.performanceScore).toBeGreaterThanOrEqual(0);
      expect(cleanResult.signal.performanceScore).toBeLessThanOrEqual(100);
      expect(cleanResult.signal.grounded).toBe(true);

      const conflictResult = engine.analyze('Your refund of ₹24,500 has been processed.', {
        businessRecords: {
          refund: { amount: 24500, status: 'FAILED' },
        },
      });
      expect(conflictResult.signal.performanceScore).toBeGreaterThanOrEqual(80);
      expect(conflictResult.signal.evidenceConflict).toBe(true);
    });
  });
});
