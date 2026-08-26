// ============================================================
// ControlPlane.ai — Database Operations
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { getDb } from './client';
import type {
  AuditEvent,
  AnalyzeResponse,
  ControlDeskCase,
  ControlDeskActionRequest,
  DashboardMetrics,
  DecisionBreakdown,
  TierDistribution,
  DecisionRow,
  ControlDeskRow,
  DetectionType,
  FeedbackEvent,
  TrustEvaluationMetrics,
} from '@/types';

export function persistDecision(response: AnalyzeResponse): void {
  const db = getDb();
  const transaction = db.transaction(() => {
    insertDecision(response);
    if (response.decision === 'ESCALATE') insertControlDeskCase(response);
  });
  transaction();
}

// ----- Decisions (Audit Log) ---------------------------------

export function insertDecision(response: AnalyzeResponse): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO decisions (
      id, request_id, timestamp, model, task_type, business_impact,
      ai_response, edited_response, decision, decision_reason, confidence,
      performance_score, cost_score, responsibility_score, composite_score,
      verification_tier, latency_ms, detections_json, evidence_json,
      verification_path_json, audit_event_json, demo_mode, scenario,
      profile, region, policy_version, evidence_source, latency_budget_ms
    ) VALUES (
      @id, @request_id, @timestamp, @model, @task_type, @business_impact,
      @ai_response, @edited_response, @decision, @decision_reason, @confidence,
      @performance_score, @cost_score, @responsibility_score, @composite_score,
      @verification_tier, @latency_ms, @detections_json, @evidence_json,
      @verification_path_json, @audit_event_json, @demo_mode, @scenario,
      @profile, @region, @policy_version, @evidence_source, @latency_budget_ms
    )
  `);

  stmt.run({
    id: uuidv4(),
    request_id: response.requestId,
    timestamp: response.timestamp,
    model: response.model,
    task_type: response.taskType,
    business_impact: response.risk.businessImpact,
    ai_response: response.originalResponse,
    edited_response: response.editedResponse ?? null,
    decision: response.decision,
    decision_reason: response.decisionReason,
    confidence: response.confidence,
    performance_score: response.risk.performance,
    cost_score: response.risk.cost,
    responsibility_score: response.risk.responsibility,
    composite_score: response.risk.composite,
    verification_tier: response.verificationTier,
    latency_ms: response.latencyMs,
    detections_json: JSON.stringify(response.detections),
    evidence_json: JSON.stringify(response.evidence),
    verification_path_json: JSON.stringify(response.verificationPath),
    audit_event_json: JSON.stringify(response.auditEvent),
    demo_mode: response.demoMode ? 1 : 0,
    scenario: response.scenario ?? null,
    profile: response.profile,
    region: response.region,
    policy_version: response.policyVersion,
    evidence_source: response.evidenceSource,
    latency_budget_ms: response.latencyBudgetMs,
  });
}

export function getDecisions(
  limit = 20,
  offset = 0,
  filter?: string
): AnalyzeResponse[] {
  const db = getDb();

  const query = `
    SELECT * FROM decisions
    ${filter && filter !== 'ALL' ? 'WHERE decision = ?' : ''}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;

  const params = filter && filter !== 'ALL'
    ? [filter, limit, offset]
    : [limit, offset];

  const rows = db.prepare(query).all(...params) as DecisionRow[];
  return rows.map(rowToAnalyzeResponse);
}

export function getDecisionById(requestId: string): AnalyzeResponse | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM decisions WHERE request_id = ?'
  ).get(requestId) as DecisionRow | undefined;

  if (!row) return null;
  return rowToAnalyzeResponse(row);
}

export function getTotalDecisions(filter?: string): number {
  const db = getDb();
  const result = db.prepare(
    filter && filter !== 'ALL'
      ? 'SELECT COUNT(*) as count FROM decisions WHERE decision = ?'
      : 'SELECT COUNT(*) as count FROM decisions'
  ).get(...(filter && filter !== 'ALL' ? [filter] : [])) as { count: number };
  return result.count;
}

function rowToAnalyzeResponse(row: DecisionRow): AnalyzeResponse {
  const auditEvent: AuditEvent = JSON.parse(row.audit_event_json);
  return {
    requestId: row.request_id,
    decision: row.decision as AnalyzeResponse['decision'],
    decisionReason: row.decision_reason,
    confidence: row.confidence,
    risk: {
      performance: row.performance_score,
      cost: row.cost_score,
      responsibility: row.responsibility_score,
      composite: row.composite_score,
      businessImpact: row.business_impact as AnalyzeResponse['risk']['businessImpact'],
    },
    detections: JSON.parse(row.detections_json),
    evidence: JSON.parse(row.evidence_json),
    verificationTier: row.verification_tier as 0 | 1 | 2,
    verificationPath: JSON.parse(row.verification_path_json),
    latencyMs: row.latency_ms,
    editedResponse: row.edited_response ?? undefined,
    originalResponse: row.ai_response,
    model: row.model,
    taskType: row.task_type as AnalyzeResponse['taskType'],
    timestamp: row.timestamp,
    auditEvent,
    demoMode: Boolean(row.demo_mode),
    scenario: row.scenario as AnalyzeResponse['scenario'],
    claimType: auditEvent.claimType ?? 'UNKNOWN',
    verificationState: auditEvent.verificationState ?? 'NOT_APPLICABLE',
    profile: row.profile as AnalyzeResponse['profile'] || auditEvent.profile || 'customer_support',
    region: row.region || auditEvent.region || 'GLOBAL',
    policyVersion: row.policy_version || auditEvent.policyVersion || 'profile-policy-v1.0',
    evidenceSource: row.evidence_source as AnalyzeResponse['evidenceSource'] || auditEvent.evidenceSource || 'none',
    latencyBudgetMs: row.latency_budget_ms ?? auditEvent.latencyBudgetMs ?? 100,
  };
}

// ----- Control Desk ------------------------------------------

export function insertControlDeskCase(response: AnalyzeResponse): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO control_desk (
      id, request_id, timestamp, task_type, business_impact, model,
      ai_response, edited_response, decision_reason,
      performance_score, cost_score, responsibility_score, composite_score,
      detections_json, evidence_json, status, scenario, profile, region, policy_version, evidence_source
    ) VALUES (
      @id, @request_id, @timestamp, @task_type, @business_impact, @model,
      @ai_response, @edited_response, @decision_reason,
      @performance_score, @cost_score, @responsibility_score, @composite_score,
      @detections_json, @evidence_json, 'PENDING', @scenario, @profile, @region, @policy_version, @evidence_source
    )
  `);

  stmt.run({
    id: uuidv4(),
    request_id: response.requestId,
    timestamp: response.timestamp,
    task_type: response.taskType,
    business_impact: response.risk.businessImpact,
    model: response.model,
    ai_response: response.originalResponse,
    edited_response: response.editedResponse ?? null,
    decision_reason: response.decisionReason,
    performance_score: response.risk.performance,
    cost_score: response.risk.cost,
    responsibility_score: response.risk.responsibility,
    composite_score: response.risk.composite,
    detections_json: JSON.stringify(response.detections),
    evidence_json: JSON.stringify(response.evidence),
    scenario: response.scenario ?? null,
    profile: response.profile,
    region: response.region,
    policy_version: response.policyVersion,
    evidence_source: response.evidenceSource,
  });
}

export function getControlDeskCases(status = 'PENDING'): ControlDeskCase[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM control_desk WHERE status = ? ORDER BY timestamp DESC'
  ).all(status) as ControlDeskRow[];
  return rows.map(rowToControlDeskCase);
}

export function getControlDeskCaseById(requestId: string): ControlDeskCase | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM control_desk WHERE request_id = ?'
  ).get(requestId) as ControlDeskRow | undefined;
  if (!row) return null;
  return rowToControlDeskCase(row);
}

export function resolveControlDeskCase(
  requestId: string,
  actionRequest: ControlDeskActionRequest
): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE control_desk
    SET status = 'RESOLVED',
        resolved_at = @resolved_at,
        reviewer_id = @reviewer_id,
        reviewer_action = @reviewer_action,
        reviewer_note = @reviewer_note,
        edited_response = COALESCE(@edited_response, edited_response)
    WHERE request_id = @request_id AND status = 'PENDING'
  `).run({
    request_id: requestId,
    resolved_at: new Date().toISOString(),
    reviewer_id: actionRequest.reviewerId ?? 'system',
    reviewer_action: actionRequest.action,
    reviewer_note: actionRequest.note ?? null,
    edited_response: actionRequest.editedResponse ?? null,
  });
  if (result.changes > 0) {
    const deskCase = getControlDeskCaseById(requestId);
    if (deskCase) {
      const finalDecision = actionRequest.correctedLabel || (
        actionRequest.action === 'APPROVE_RELEASE' ? 'RELEASE' :
          actionRequest.action === 'APPROVE_WITH_EDIT' ? 'EDIT' :
            actionRequest.action === 'CONFIRM_BLOCK' ? 'BLOCK' : 'ESCALATE'
      );
      getDb().prepare(`
        INSERT INTO feedback_events (
          id, request_id, original_decision, reviewer_action, final_decision,
          corrected_label, reason, timestamp, profile, policy_version
        ) VALUES (@id, @request_id, 'ESCALATE', @reviewer_action, @final_decision,
          @corrected_label, @reason, @timestamp, @profile, @policy_version)
      `).run({
        id: uuidv4(),
        request_id: requestId,
        reviewer_action: actionRequest.action,
        final_decision: finalDecision,
        corrected_label: actionRequest.correctedLabel ?? null,
        reason: actionRequest.note ?? null,
        timestamp: new Date().toISOString(),
        profile: deskCase.profile || 'customer_support',
        policy_version: deskCase.policyVersion || 'profile-policy-v1.0',
      });
    }
  }
  return result.changes > 0;
}

export function addControlDeskNote(requestId: string, reviewerId: string, note: string): boolean {
  if (!note.trim()) return false;
  const result = getDb().prepare(`
    UPDATE control_desk
    SET reviewer_id = @reviewer_id, reviewer_note = @reviewer_note
    WHERE request_id = @request_id AND status = 'PENDING'
  `).run({ request_id: requestId, reviewer_id: reviewerId, reviewer_note: note.trim().slice(0, 2000) });
  return result.changes > 0;
}

export function getFeedbackEvents(limit = 100): FeedbackEvent[] {
  const rows = getDb().prepare('SELECT * FROM feedback_events ORDER BY timestamp DESC LIMIT ?').all(limit) as Array<Record<string, unknown>>;
  return rows.map(row => ({
    id: String(row.id), requestId: String(row.request_id), originalDecision: String(row.original_decision) as FeedbackEvent['originalDecision'],
    reviewerAction: String(row.reviewer_action) as FeedbackEvent['reviewerAction'], finalDecision: String(row.final_decision) as FeedbackEvent['finalDecision'],
    correctedLabel: row.corrected_label ? String(row.corrected_label) as FeedbackEvent['correctedLabel'] : undefined,
    reason: row.reason ? String(row.reason) : undefined, timestamp: String(row.timestamp), profile: String(row.profile) as FeedbackEvent['profile'], policyVersion: String(row.policy_version),
  }));
}

export function getTrustEvaluationMetrics(): TrustEvaluationMetrics {
  const feedback = getDb().prepare('SELECT reviewer_action, corrected_label FROM feedback_events').all() as Array<{ reviewer_action: string; corrected_label: string | null }>;
  const overrides = feedback.length;
  const corrections = feedback.filter(row => row.corrected_label).length;
  const uncertain = (getDb().prepare("SELECT COUNT(*) as c FROM decisions WHERE json_extract(audit_event_json, '$.verificationState') = 'UNVERIFIED'").get() as { c: number }).c;
  const total = (getDb().prepare('SELECT COUNT(*) as c FROM decisions').get() as { c: number }).c;
  const tiers = getDb().prepare('SELECT verification_tier, COUNT(*) as c FROM decisions GROUP BY verification_tier').all() as Array<{ verification_tier: number; c: number }>;
  const tierDistribution = { tier0: 0, tier1: 0, tier2: 0 };
  for (const row of tiers) if (row.verification_tier === 0 || row.verification_tier === 1 || row.verification_tier === 2) tierDistribution[`tier${row.verification_tier}` as keyof typeof tierDistribution] = row.c;
  return {
    totalCases: total, criticalFalseReleaseRate: null, highImpactEscalationRecall: null,
    falseBlockRate: null, escalationRate: total ? Number(((feedback.filter(row => row.reviewer_action === 'APPROVE_RELEASE').length / total) * 100).toFixed(2)) : null,
    verificationCoverage: total ? Number((((tierDistribution.tier1 + tierDistribution.tier2) / total) * 100).toFixed(2)) : null,
    tierDistribution, feedbackOverrides: overrides, feedbackCorrections: corrections, uncertainCases: uncertain, source: 'local audit DB; labeled false-release metrics NOT ESTABLISHED',
  };
}

function rowToControlDeskCase(row: ControlDeskRow): ControlDeskCase {
  return {
    id: row.id,
    requestId: row.request_id,
    timestamp: row.timestamp,
    taskType: row.task_type as ControlDeskCase['taskType'],
    businessImpact: row.business_impact as ControlDeskCase['businessImpact'],
    aiResponse: row.ai_response,
    editedResponse: row.edited_response ?? undefined,
    risk: {
      performance: row.performance_score,
      cost: row.cost_score,
      responsibility: row.responsibility_score,
      composite: row.composite_score,
      businessImpact: row.business_impact as ControlDeskCase['businessImpact'],
    },
    detections: JSON.parse(row.detections_json),
    evidence: JSON.parse(row.evidence_json),
    decisionReason: row.decision_reason,
    status: row.status as ControlDeskCase['status'],
    resolvedAt: row.resolved_at ?? undefined,
    reviewerId: row.reviewer_id ?? undefined,
    reviewerAction: row.reviewer_action as ControlDeskCase['reviewerAction'],
    reviewerNote: row.reviewer_note ?? undefined,
    model: row.model,
    scenario: row.scenario as ControlDeskCase['scenario'],
    profile: row.profile as ControlDeskCase['profile'],
    region: row.region || 'GLOBAL',
    policyVersion: row.policy_version || 'profile-policy-v1.0',
    evidenceSource: row.evidence_source as ControlDeskCase['evidenceSource'],
  };
}

// ----- Dashboard Metrics -------------------------------------

export function getDashboardMetrics(): DashboardMetrics {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as c FROM decisions').get() as { c: number }).c;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (db.prepare(
    "SELECT COUNT(*) as c FROM decisions WHERE timestamp LIKE ?"
  ).get(`${today}%`) as { c: number }).c;

  // Decision breakdown
  const breakdownRows = db.prepare(
    'SELECT decision, COUNT(*) as c FROM decisions GROUP BY decision'
  ).all() as { decision: string; c: number }[];
  const breakdown: DecisionBreakdown = { RELEASE: 0, EDIT: 0, BLOCK: 0, ESCALATE: 0 };
  for (const r of breakdownRows) {
    if (r.decision in breakdown) breakdown[r.decision as keyof DecisionBreakdown] = r.c;
  }

  // Tier distribution
  const tierRows = db.prepare(
    'SELECT verification_tier, COUNT(*) as c FROM decisions GROUP BY verification_tier'
  ).all() as { verification_tier: number; c: number }[];
  const tierDist: TierDistribution = { tier0: 0, tier1: 0, tier2: 0 };
  for (const r of tierRows) {
    if (r.verification_tier === 0) tierDist.tier0 = r.c;
    if (r.verification_tier === 1) tierDist.tier1 = r.c;
    if (r.verification_tier === 2) tierDist.tier2 = r.c;
  }

  const pending = (db.prepare(
    "SELECT COUNT(*) as c FROM control_desk WHERE status = 'PENDING'"
  ).get() as { c: number }).c;

  const avgLatency = (db.prepare(
    'SELECT AVG(latency_ms) as avg FROM decisions'
  ).get() as { avg: number | null }).avg ?? 0;

  const avgRisk = (db.prepare(
    'SELECT AVG(composite_score) as avg FROM decisions'
  ).get() as { avg: number | null }).avg ?? 0;

  // Top detection types
  const detectionRows = db.prepare(
    'SELECT detections_json FROM decisions ORDER BY timestamp DESC LIMIT 100'
  ).all() as { detections_json: string }[];
  const typeCounts: Record<string, number> = {};
  for (const row of detectionRows) {
    const dets = JSON.parse(row.detections_json) as { type: string }[];
    for (const d of dets) {
      typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;
    }
  }
  const topDetectionTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type: type as DetectionType, count }));

  // Recent trend (last 12 hours)
  const recentTrend = db.prepare(`
    SELECT 
      strftime('%H:00', timestamp) as hour,
      COUNT(*) as count,
      AVG(composite_score) as avgRisk
    FROM decisions
    WHERE timestamp > datetime('now', '-12 hours')
    GROUP BY strftime('%H', timestamp)
    ORDER BY hour ASC
  `).all() as { hour: string; count: number; avgRisk: number }[];

  return {
    totalDecisions: total,
    todayDecisions: todayCount,
    breakdown,
    tierDistribution: tierDist,
    pendingEscalations: pending,
    avgLatencyMs: Math.round(avgLatency),
    avgCompositeRisk: Math.round(avgRisk),
    topDetectionTypes,
    recentTrend: recentTrend.map(r => ({
      hour: r.hour,
      count: r.count,
      avgRisk: Math.round(r.avgRisk),
    })),
    estimatedTokensSaved: 0, // No measured baseline is available; never fabricate savings.
    isEstimated: true,
  };
}
