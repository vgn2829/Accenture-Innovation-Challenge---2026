// ============================================================
// Integration Tests: API Routes Layer
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import path from 'path';
import { POST as analyzeHandler } from '@/app/api/analyze/route';
import { GET as decisionsHandler } from '@/app/api/decisions/route';
import { GET as decisionDetailHandler } from '@/app/api/decisions/[id]/route';
import { GET as metricsHandler } from '@/app/api/metrics/route';
import { GET as getControlDeskHandler, POST as postControlDeskHandler } from '@/app/api/controldesk/[id]/route';
import { POST as simulateHandler } from '@/app/api/simulate/[scenario]/route';

// Point test DB to test database
process.env.DATABASE_PATH = path.join(process.cwd(), 'data', 'test-controlplane.db');

function createJsonRequest(url: string, body?: unknown, method = 'POST'): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('API Routes Integration Suite', () => {
  beforeAll(async () => {
    const { getDb } = await import('@/lib/db/client');
    getDb(); // initialize schema
  });

  describe('POST /api/analyze', () => {
    it('successfully analyzes valid request and persists decision', async () => {
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'customer-support',
        businessImpact: 'low',
        aiResponse: 'Your order #ORD-1234 has been confirmed.',
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.requestId).toBeDefined();
      expect(data.decision).toBe('RELEASE');
      expect(data.risk.composite).toBeDefined();
      expect(data.verificationTier).toBe(0);
      expect(data.auditEvent).toBeDefined();
      expect(data.editedResponse).toBeUndefined();
    });

    it('returns 400 when aiResponse is missing or empty', async () => {
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'customer-support',
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('aiResponse');
    });

    it('returns 400 when model is missing', async () => {
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        aiResponse: 'Hello world',
        taskType: 'general',
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('model');
    });

    it('returns 400 when taskType is invalid', async () => {
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'invalid-task-type',
        aiResponse: 'Hello world',
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('taskType');
    });

    it('returns EDIT decision with editedResponse on PII input', async () => {
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'customer-support',
        businessImpact: 'medium',
        aiResponse: 'Customer phone is +91 9876543210 for confirmation.',
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.decision).toBe('EDIT');
      expect(data.editedResponse).toBeDefined();
      expect(data.editedResponse).toContain('[PHONE REDACTED]');
    });
  });

  describe('GET /api/decisions & GET /api/decisions/[id]', () => {
    let savedRequestId: string;

    beforeAll(async () => {
      // Create a test decision
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'general',
        aiResponse: 'Decision query test response.',
      });
      const res = await analyzeHandler(req);
      const data = await res.json();
      savedRequestId = data.requestId;
    });

    it('GET /api/decisions returns paginated decision records', async () => {
      const req = new NextRequest('http://localhost:3000/api/decisions?page=1&limit=10');
      const res = await decisionsHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data.decisions)).toBe(true);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBeGreaterThan(0);
    });

    it('GET /api/decisions/[id] returns full decision details for valid ID', async () => {
      const req = new NextRequest(`http://localhost:3000/api/decisions/${savedRequestId}`);
      const res = await decisionDetailHandler(req, {
        params: Promise.resolve({ id: savedRequestId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.requestId).toBe(savedRequestId);
      expect(data.decision).toBeDefined();
      expect(data.auditEvent).toBeDefined();
    });

    it('GET /api/decisions/[id] returns 404 for nonexistent ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/decisions/nonexistent-req-999');
      const res = await decisionDetailHandler(req, {
        params: Promise.resolve({ id: 'nonexistent-req-999' }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/metrics', () => {
    it('returns aggregate metrics matching database state', async () => {
      const res = await metricsHandler();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.totalDecisions).toBeGreaterThan(0);
      expect(data.breakdown).toBeDefined();
      expect(data.tierDistribution).toBeDefined();
      expect(data.isEstimated).toBe(true);
    });
  });

  describe('GET & POST /api/controldesk/[id]', () => {
    let escalatedRequestId: string;

    beforeAll(async () => {
      // Trigger an ESCALATE case (hiring bias)
      const req = createJsonRequest('http://localhost:3000/api/analyze', {
        model: 'gpt-4o',
        taskType: 'hiring',
        businessImpact: 'high',
        aiResponse: 'Prioritize younger male applicants over other candidates.',
      });
      const res = await analyzeHandler(req);
      const data = await res.json();
      escalatedRequestId = data.requestId;
    });

    it('GET /api/controldesk/[id] retrieves escalated case detail', async () => {
      const req = new NextRequest(`http://localhost:3000/api/controldesk/${escalatedRequestId}`);
      const res = await getControlDeskHandler(req, {
        params: Promise.resolve({ id: escalatedRequestId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.requestId).toBe(escalatedRequestId);
      expect(data.status).toBe('PENDING');
    });

    it('POST /api/controldesk/[id] resolves case with valid reviewer action', async () => {
      const req = createJsonRequest(`http://localhost:3000/api/controldesk/${escalatedRequestId}`, {
        action: 'CONFIRM_BLOCK',
        reviewerId: 'compliance-officer-42',
        note: 'Confirmed demographic bias policy violation. Blocked.',
      });

      const res = await postControlDeskHandler(req, {
        params: Promise.resolve({ id: escalatedRequestId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('RESOLVED');
      expect(data.action).toBe('CONFIRM_BLOCK');
      expect(data.reviewerId).toBe(process.env.DEMO_REVIEWER_ID || 'demo-supervisor');
    });

    it('POST /api/controldesk/[id] returns 400 for invalid action', async () => {
      const req = createJsonRequest(`http://localhost:3000/api/controldesk/${escalatedRequestId}`, {
        action: 'INVALID_ARBITRARY_ACTION',
      });

      const res = await postControlDeskHandler(req, {
        params: Promise.resolve({ id: escalatedRequestId }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid reviewer action');
    });
  });

  describe('POST /api/simulate/[scenario] (Deterministic Scenarios with Real Pipeline)', () => {
    it('Scenario A produces RELEASE via real pipeline', async () => {
      const req = createJsonRequest('http://localhost:3000/api/simulate/A');
      const res = await simulateHandler(req, {
        params: Promise.resolve({ scenario: 'A' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.decision).toBe('RELEASE');
      expect(data.verificationTier).toBe(2);
      expect(data.scenarioInfo.expectedDecision).toBe('RELEASE');
    });

    it('Scenario B produces EDIT via real pipeline', async () => {
      const req = createJsonRequest('http://localhost:3000/api/simulate/B');
      const res = await simulateHandler(req, {
        params: Promise.resolve({ scenario: 'B' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.decision).toBe('EDIT');
      expect(data.editedResponse).toBeDefined();
      expect(data.editedResponse).toContain('[PHONE REDACTED]');
    });

    it('Scenario C produces BLOCK on ₹24,500 refund conflict via real pipeline', async () => {
      const req = createJsonRequest('http://localhost:3000/api/simulate/C');
      const res = await simulateHandler(req, {
        params: Promise.resolve({ scenario: 'C' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.decision).toBe('BLOCK');
      expect(data.verificationTier).toBe(2);
      expect(data.evidence.some((e: { label: string }) => e.label.includes('Conflict'))).toBe(true);
    });

    it('Scenario D produces ESCALATE on fairness concern via real pipeline', async () => {
      const req = createJsonRequest('http://localhost:3000/api/simulate/D');
      const res = await simulateHandler(req, {
        params: Promise.resolve({ scenario: 'D' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.decision).toBe('ESCALATE');
      expect(data.verificationTier).toBe(2);
      expect(data.detections.some((d: { type: string }) => d.type === 'FAIRNESS_CONCERN')).toBe(true);
    });

    it('returns 400 for unsupported scenario identifier', async () => {
      const req = createJsonRequest('http://localhost:3000/api/simulate/Z');
      const res = await simulateHandler(req, {
        params: Promise.resolve({ scenario: 'Z' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid scenario identifier');
    });
  });
});
