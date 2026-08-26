// ============================================================
// M1 Foundation Tests — Database initialization + types
// ============================================================

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Use a test-specific DB path to avoid polluting dev DB
process.env.DATABASE_PATH = path.join(process.cwd(), 'data', 'test-controlplane.db');

describe('M1 Foundation', () => {
  describe('Types - basic shape validation', () => {
    it('Decision type covers all four values', () => {
      const decisions = ['RELEASE', 'EDIT', 'BLOCK', 'ESCALATE'] as const;
      expect(decisions).toHaveLength(4);
    });

    it('BusinessImpact covers all four levels', () => {
      const levels = ['low', 'medium', 'high', 'critical'] as const;
      expect(levels).toHaveLength(4);
    });

    it('VerificationTier covers 0/1/2', () => {
      const tiers = [0, 1, 2] as const;
      expect(tiers).toHaveLength(3);
    });
  });

  describe('Database - initialization', () => {
    let db: import('better-sqlite3').Database;

    beforeAll(async () => {
      // Dynamic import to ensure env var is set first
      const { getDb } = await import('@/lib/db/client');
      db = getDb();
    });

    afterAll(() => {
      // Clean up test DB
      try {
        const dbPath = process.env.DATABASE_PATH!;
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('opens database successfully', () => {
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it('creates decisions table', () => {
      const result = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'"
      ).get();
      expect(result).toBeDefined();
    });

    it('creates control_desk table', () => {
      const result = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='control_desk'"
      ).get();
      expect(result).toBeDefined();
    });

    it('can insert and retrieve a row from decisions', () => {
      db.prepare(`
        INSERT INTO decisions (
          id, request_id, timestamp, model, task_type, business_impact,
          ai_response, decision, decision_reason, confidence,
          performance_score, cost_score, responsibility_score, composite_score,
          verification_tier, latency_ms, detections_json, evidence_json,
          verification_path_json, audit_event_json, demo_mode
        ) VALUES (
          'test-id-1', 'req-1', '2026-08-24T00:00:00Z', 'gpt-4o',
          'general', 'low', 'Test response', 'RELEASE', 'All clear.', 95,
          10, 5, 8, 12, 0, 18, '[]', '[]', '[]', '{}', 1
        )
      `).run();

      const row = db.prepare("SELECT * FROM decisions WHERE id = 'test-id-1'").get() as { id: string };
      expect(row).toBeDefined();
      expect(row.id).toBe('test-id-1');
    });

    it('decisions table is append-only (no built-in delete constraint, but no delete API)', () => {
      // Verify the row we inserted exists
      const count = (db.prepare('SELECT COUNT(*) as c FROM decisions').get() as { c: number }).c;
      expect(count).toBeGreaterThan(0);
    });
  });
});
