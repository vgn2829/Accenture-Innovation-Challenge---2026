// ============================================================
// ControlPlane.ai — Shared TypeScript Types
// ============================================================

// ----- Core Enums --------------------------------------------

export type Decision = 'RELEASE' | 'EDIT' | 'BLOCK' | 'ESCALATE';

export type BusinessImpact = 'low' | 'medium' | 'high' | 'critical';

export type TaskType =
  | 'customer-support'
  | 'financial'
  | 'hiring'
  | 'general';

export type UseCaseProfileId = 'customer_support' | 'knowledge_assistant' | 'decision_support';
export type EvidenceSource = 'trusted_demo_record' | 'none' | 'caller_context_untrusted' | 'retrieved_context_unverified';

export type VerificationTier = 0 | 1 | 2;

export type ClaimType =
  | 'FACTUAL'
  | 'TRANSACTIONAL'
  | 'FINANCIAL'
  | 'ORDER_STATUS'
  | 'POLICY'
  | 'HIRING_HIGH_IMPACT'
  | 'SAFETY'
  | 'PII_SENSITIVE'
  | 'GENERAL_INFORMATION'
  | 'UNKNOWN';

export type VerificationState = 'VERIFIED' | 'CONFLICT' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export type DetectionSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type DetectionType =
  | 'PII_PHONE'
  | 'PII_EMAIL'
  | 'PII_CREDIT_CARD'
  | 'PII_AADHAAR'
  | 'PII_PAN'
  | 'PII_BANK_ACCOUNT'
  | 'INJECTION_OVERRIDE'
  | 'INJECTION_JAILBREAK'
  | 'FACTUAL_CONFLICT'
  | 'AGENT_LOOP'
  | 'HIGH_RETRY_COUNT'
  | 'EXCESSIVE_TOKENS'
  | 'EXPENSIVE_MODEL_WASTE'
  | 'UNSAFE_CONTENT'
  | 'POLICY_VIOLATION'
  | 'FAIRNESS_CONCERN'
  | 'SCHEMA_VIOLATION'
  | 'CONSISTENCY_FAILURE';

export type ScenarioId = 'A' | 'B' | 'C' | 'D';

export type ControlDeskAction =
  | 'APPROVE_RELEASE'
  | 'APPROVE_WITH_EDIT'
  | 'CONFIRM_BLOCK'
  | 'ADD_NOTE';

// ----- Detection Results -------------------------------------

export interface Evidence {
  label: string;
  claimed?: string;
  actual?: string;
  detail?: string;
}

export interface DetectionResult {
  type: DetectionType;
  severity: DetectionSeverity;
  detector: string;
  description: string;
  evidence?: Evidence[];
  matchedText?: string;      // The text that triggered the detection
  editSafe: boolean;         // Whether this can be automatically remediated
  editReplacement?: string;  // What to replace matchedText with (if editSafe)
}

// ----- Engine Signals ----------------------------------------

export interface PerformanceSignal {
  grounded: boolean;
  verificationState?: VerificationState;
  consistencyScore: number;   // 0-100, higher = more consistent
  evidenceConflict: boolean;
  evidenceDetails?: Evidence[];
  performanceScore: number;   // 0-100, higher = more risk
}

export interface CostSignal {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;   // Labeled as ESTIMATE throughout UI
  isEstimated: true;          // Always true — we never fabricate real billing
  retryCount: number;
  loopDetected: boolean;
  costScore: number;          // 0-100, higher = more waste risk
}

export interface ResponsibilitySignal {
  piiDetected: boolean;
  injectionDetected: boolean;
  policyViolation: boolean;
  fairnessConcern: boolean;
  responsibilityScore: number; // 0-100, higher = more risk
}

// ----- Risk Fusion -------------------------------------------

export interface RiskScores {
  performance: number;        // 0-100
  cost: number;               // 0-100
  responsibility: number;     // 0-100
  composite: number;          // 0-100 (weighted + impact-adjusted)
  businessImpact: BusinessImpact;
}

// ----- Verification Path -------------------------------------

export interface VerificationStep {
  tier: VerificationTier;
  checks: string[];
  latencyMs: number;
  triggered: boolean;
  triggerReason?: string;
}

// ----- Decision Result ---------------------------------------

export interface DecisionResult {
  decision: Decision;
  reason: string;             // Human-readable explanation
  confidence: number;         // 0-100
  editedResponse?: string;    // Only when decision = EDIT
}

// ----- API Request / Response --------------------------------

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BusinessRecord {
  [key: string]: unknown;
}

export interface AnalyzeRequest {
  requestId?: string;
  model: string;
  taskType: TaskType;
  aiResponse: string;
  context?: {
    retrievedDocs?: string[];
    sessionHistory?: Message[];
    /** Entity reference only. Business records supplied by callers are not trusted. */
    entityRef?: string;
    /** @deprecated Ignored by the orchestrator; retained only for migration compatibility. */
    businessRecords?: Record<string, BusinessRecord>;
    userId?: string;
    customerId?: string;
    toolCallHistory?: string[];  // For loop detection
  };
  businessImpact?: BusinessImpact;
  profile?: UseCaseProfileId;
  region?: string;
  verificationMode?: 'adaptive' | 'deep';
  demoMode?: boolean;
  scenario?: ScenarioId;
}

export interface AnalyzeResponse {
  requestId: string;
  decision: Decision;
  decisionReason: string;
  confidence: number;

  risk: RiskScores;
  claimType: ClaimType;
  verificationState: VerificationState;
  profile: UseCaseProfileId;
  region: string;
  policyVersion: string;
  evidenceSource: EvidenceSource;
  latencyBudgetMs: number;

  detections: DetectionResult[];
  evidence: Evidence[];

  verificationTier: VerificationTier;
  verificationPath: VerificationStep[];
  latencyMs: number;

  editedResponse?: string;
  originalResponse: string;

  model: string;
  taskType: TaskType;
  timestamp: string;

  auditEvent: AuditEvent;
  demoMode: boolean;
  scenario?: ScenarioId;
}

// ----- Audit Event -------------------------------------------

export interface AuditEvent {
  requestId: string;
  timestamp: string;
  model: string;
  taskType: TaskType;
  businessImpact: BusinessImpact;
  risk: RiskScores;
  detections: DetectionResult[];
  evidence: Evidence[];
  verificationTier: VerificationTier;
  decision: Decision;
  decisionReason: string;
  confidence: number;
  latencyMs: number;
  editedResponse?: string;
  demoMode: boolean;
  scenario?: ScenarioId;
  claimType?: ClaimType;
  verificationState?: VerificationState;
  profile?: UseCaseProfileId;
  region?: string;
  policyVersion?: string;
  evidenceSource?: EvidenceSource;
  latencyBudgetMs?: number;
}

// ----- Control Desk ------------------------------------------

export interface ControlDeskCase {
  id: string;
  requestId: string;
  timestamp: string;
  taskType: TaskType;
  businessImpact: BusinessImpact;
  aiResponse: string;
  editedResponse?: string;
  risk: RiskScores;
  detections: DetectionResult[];
  evidence: Evidence[];
  decisionReason: string;
  status: 'PENDING' | 'RESOLVED';
  resolvedAt?: string;
  reviewerId?: string;
  reviewerAction?: ControlDeskAction;
  reviewerNote?: string;
  model: string;
  scenario?: ScenarioId;
  profile?: UseCaseProfileId;
  region?: string;
  policyVersion?: string;
  evidenceSource?: EvidenceSource;
}

export interface ControlDeskActionRequest {
  action: ControlDeskAction;
  reviewerId?: string;
  note?: string;
  editedResponse?: string;  // When action = APPROVE_WITH_EDIT
  correctedLabel?: Decision;
}

export interface FeedbackEvent {
  id: string;
  requestId: string;
  originalDecision: Decision;
  reviewerAction: ControlDeskAction;
  finalDecision: Decision;
  correctedLabel?: Decision;
  reason?: string;
  timestamp: string;
  profile: UseCaseProfileId;
  policyVersion: string;
}

export interface TrustEvaluationMetrics {
  totalCases: number;
  criticalFalseReleaseRate: number | null;
  highImpactEscalationRecall: number | null;
  falseBlockRate: number | null;
  escalationRate: number | null;
  verificationCoverage: number | null;
  tierDistribution: TierDistribution;
  feedbackOverrides: number;
  feedbackCorrections: number;
  uncertainCases: number;
  generatedAt?: string;
  source?: string;
}

// ----- Dashboard Metrics -------------------------------------

export interface DecisionBreakdown {
  RELEASE: number;
  EDIT: number;
  BLOCK: number;
  ESCALATE: number;
}

export interface TierDistribution {
  tier0: number;
  tier1: number;
  tier2: number;
}

export interface DashboardMetrics {
  totalDecisions: number;
  todayDecisions: number;
  breakdown: DecisionBreakdown;
  tierDistribution: TierDistribution;
  pendingEscalations: number;
  avgLatencyMs: number;
  avgCompositeRisk: number;
  topDetectionTypes: { type: DetectionType; count: number }[];
  recentTrend: { hour: string; count: number; avgRisk: number }[];
  estimatedTokensSaved: number;      // Labeled ESTIMATE in UI
  isEstimated: true;
}

// ----- DB Row Types (raw from SQLite) ------------------------

export interface DecisionRow {
  id: string;
  request_id: string;
  timestamp: string;
  model: string;
  task_type: string;
  business_impact: string;
  ai_response: string;
  edited_response: string | null;
  decision: string;
  decision_reason: string;
  confidence: number;
  performance_score: number;
  cost_score: number;
  responsibility_score: number;
  composite_score: number;
  verification_tier: number;
  latency_ms: number;
  detections_json: string;
  evidence_json: string;
  verification_path_json: string;
  audit_event_json: string;
  demo_mode: number;  // SQLite boolean (0/1)
  scenario: string | null;
  profile: string | null;
  region: string | null;
  policy_version: string | null;
  evidence_source: string | null;
  latency_budget_ms: number | null;
}

export interface ControlDeskRow {
  id: string;
  request_id: string;
  timestamp: string;
  task_type: string;
  business_impact: string;
  model: string;
  ai_response: string;
  edited_response: string | null;
  decision_reason: string;
  performance_score: number;
  cost_score: number;
  responsibility_score: number;
  composite_score: number;
  detections_json: string;
  evidence_json: string;
  status: string;
  resolved_at: string | null;
  reviewer_id: string | null;
  reviewer_action: string | null;
  reviewer_note: string | null;
  scenario: string | null;
  profile: string | null;
  region: string | null;
  policy_version: string | null;
  evidence_source: string | null;
}
