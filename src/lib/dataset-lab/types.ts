import type { BusinessImpact, Decision, UseCaseProfileId, VerificationState } from '@/types';

export type DatasetFormat = 'csv' | 'json' | 'jsonl';
export type DatasetTrustClass = 'DEMO_FIXTURE' | 'BENCHMARK' | 'USER_UPLOADED' | 'TRUSTED_EVIDENCE';
export type GroundTruthStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'INVALID';
export type DatasetSplitName = 'development' | 'validation' | 'evaluation';

export interface DatasetSplitConfig {
  development: number;
  validation: number;
  evaluation: number;
}

export interface CanonicalEvaluationCase {
  caseId: string;
  source: DatasetTrustClass;
  useCase?: UseCaseProfileId;
  prompt?: string;
  aiResponse: string;
  claimType?: string;
  businessImpact?: BusinessImpact;
  entityReferences: string[];
  evidence: unknown;
  conversation: unknown[];
  toolCalls: unknown[];
  labels: Record<string, unknown>;
  expectedDecision?: Decision;
  expectedVerificationState?: VerificationState;
  expectedRiskFlags?: Record<string, boolean>;
  groundTruthStatus: GroundTruthStatus;
  rawValues: Record<string, unknown>;
  normalizedValues: Record<string, unknown>;
}

export interface DatasetFieldMapping {
  caseId?: string;
  prompt?: string;
  aiResponse?: string;
  useCase?: string;
  claimType?: string;
  businessImpact?: string;
  entityReferences?: string;
  evidence?: string;
  conversation?: string;
  toolCalls?: string;
  expectedDecision?: string;
  expectedVerificationState?: string;
  expectedRiskFlags?: string;
}

export interface MappingSuggestion {
  canonicalField: keyof DatasetFieldMapping;
  sourceField?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  candidates: string[];
  ambiguous: boolean;
}

export interface DatasetProfile {
  datasetId: string;
  fileName: string;
  format: DatasetFormat;
  trustClass: 'USER_UPLOADED';
  rowCount: number;
  validRows: number;
  malformedRows: number;
  columns: string[];
  inferredTypes: Record<string, string>;
  missingValues: Record<string, number>;
  duplicateRows: number;
  nestedFields: string[];
  maxObservedTextLength: number;
  piiCandidateRows: number;
  piiFields: string[];
  candidateResponseFields: string[];
  candidateIdFields: string[];
  mappingSuggestions: MappingSuggestion[];
  warnings: string[];
}

export interface DatasetValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  acceptedRows: number;
  rejectedRows: number;
  piiRows: number;
  duplicateRows: number;
  contaminationWarnings: string[];
}

export interface DatasetRunRow {
  caseId: string;
  expectedDecision?: Decision;
  predictedDecision: Decision;
  expectedVerificationState?: VerificationState;
  predictedVerificationState: VerificationState;
  verificationTier: 0 | 1 | 2;
  risk: { performance: number; cost: number; responsibility: number; composite: number; businessImpact: BusinessImpact };
  evidenceSource: string;
  policyVersion: string;
  latencyMs: number;
  evaluatorCalls: number;
  passedDecision: boolean | null;
  passedVerificationState: boolean | null;
  originalResponse: string;
  reason: string;
}

export interface DatasetRunResult {
  runId: string;
  datasetId: string;
  fileName: string;
  trustClass: 'USER_UPLOADED';
  profile: UseCaseProfileId;
  policyVersion: string;
  mode: 'adaptive' | 'deep';
  splitName: DatasetSplitName;
  split: DatasetSplitConfig;
  timestamp: string;
  caseCount: number;
  labeledCount: number;
  unlabeledCount: number;
  metrics: {
    accuracy: number | null;
    falseReleaseRate: number | null;
    falseBlockRate: number | null;
    escalationRecall: number | null;
    criticalFalseReleaseRate: number | null;
    highImpactFalseReleaseRate: number | null;
    verificationCoverage: number | null;
  };
  tierDistribution: { tier0: number; tier1: number; tier2: number };
  decisionDistribution: Record<Decision, number>;
  latency: { averageMs: number; p50Ms: number | null; p95Ms: number | null; p99Ms: number | null };
  evaluatorInvocationCount: number;
  contaminationWarnings: string[];
  failures: DatasetRunRow[];
  allRows?: DatasetRunRow[];
  limitations: string[];
}

export interface DatasetFeedbackEvent {
  id: string;
  datasetId: string;
  runId: string;
  caseId: string;
  label: 'CORRECT' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'WRONG_ESCALATION' | 'WRONG_VERIFICATION_TIER';
  reason?: string;
  timestamp: string;
  policyVersion: string;
}
