import { describe, expect, it, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as analyze } from '@/app/api/analyze/route';
import { GET as queue } from '@/app/api/controldesk/route';
import { POST as reset } from '@/app/api/demo/reset/route';
import { POST as resolve } from '@/app/api/controldesk/[id]/route';
import { getFeedbackEvents } from '@/lib/db/operations';

function jsonRequest(url: string, body: unknown, headers?: HeadersInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('API hardening', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = `${process.cwd()}/data/adversarial-api.db`;
    process.env.DEMO_MODE = 'false';
  });

  it('bounds oversized context arrays', async () => {
    const response = await analyze(jsonRequest('http://localhost:3000/api/analyze', {
      model: 'gpt-4o', taskType: 'general', aiResponse: 'Hello',
      context: { sessionHistory: Array.from({ length: 101 }, () => ({ role: 'user', content: 'x' })) },
    }));
    expect(response.status).toBe(413);
  });

  it('replays an existing request ID idempotently', async () => {
    const body = { requestId: 'audit-idempotency-1', model: 'gpt-4o', taskType: 'general', aiResponse: 'Idempotent clean response.' };
    const first = await analyze(jsonRequest('http://localhost:3000/api/analyze', body));
    const second = await analyze(jsonRequest('http://localhost:3000/api/analyze', body));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await first.json()).requestId).toBe((await second.json()).requestId);
  });

  it('collapses simultaneous retries to one canonical decision', async () => {
    const body = { requestId: 'audit-concurrent-replay-1', model: 'gpt-4o', taskType: 'general', aiResponse: 'Concurrent clean response.' };
    const responses = await Promise.all(Array.from({ length: 10 }, () => analyze(jsonRequest('http://localhost:3000/api/analyze', body))));
    expect(responses.every(response => response.status === 200)).toBe(true);
    const ids = await Promise.all(responses.map(async response => (await response.json()).requestId));
    expect(new Set(ids).size).toBe(1);
  });

  it('does not expose destructive reset outside demo mode', async () => {
    const response = await reset(new NextRequest('http://localhost:3000/api/demo/reset', { method: 'POST' }));
    expect(response.status).toBe(403);
  });

  it('provides a working Control Desk queue contract', async () => {
    const response = await queue();
    expect(response.status).toBe(200);
    expect((await response.json()).data).toBeInstanceOf(Array);
  });

  it('records a feedback event after human adjudication', async () => {
    const requestId = `feedback-${Date.now()}`;
    const created = await analyze(jsonRequest('http://localhost:3000/api/analyze', {
      requestId, model: 'gpt-4o', taskType: 'hiring', businessImpact: 'low', aiResponse: 'Choose young energetic candidates for culture fit.',
    }));
    expect(created.status).toBe(200);
    const resolved = await resolve(jsonRequest(`http://localhost:3000/api/controldesk/${requestId}`, { action: 'APPROVE_WITH_EDIT', note: 'Reviewed for evaluation feedback.' }), { params: Promise.resolve({ id: requestId }) });
    expect(resolved.status).toBe(200);
    expect(getFeedbackEvents(20).some(event => event.requestId === requestId && event.finalDecision === 'EDIT')).toBe(true);
  });
});
