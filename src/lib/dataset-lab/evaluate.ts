import { randomUUID } from 'node:crypto';
import { VerificationOrchestrator } from '@/lib/orchestrator/verification-orchestrator';
import type { AnalyzeRequest, Decision, UseCaseProfileId } from '@/types';
import type { CanonicalEvaluationCase, DatasetRunResult, DatasetSplitConfig, DatasetSplitName } from './types';

const decisions: Decision[] = ['RELEASE', 'EDIT', 'BLOCK', 'ESCALATE'];
function percentile(values: number[], p: number): number | null { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]; }

export async function evaluateCanonicalCases(datasetId: string, fileName: string, cases: CanonicalEvaluationCase[], profile: UseCaseProfileId, mode: 'adaptive' | 'deep', contaminationWarnings: string[] = [], splitName: DatasetSplitName = 'evaluation', split: DatasetSplitConfig = { development: 0.8, validation: 0.1, evaluation: 0.1 }): Promise<DatasetRunResult> {
  const orchestrator = new VerificationOrchestrator();
  const rows: DatasetRunResult['failures'] = [];
  const allRows: DatasetRunResult['failures'] = [];
  for (const item of cases) {
    const request: AnalyzeRequest = { model: 'gpt-4o', taskType: profile === 'decision_support' ? 'hiring' : profile === 'customer_support' ? 'customer-support' : 'general', aiResponse: item.aiResponse, businessImpact: item.businessImpact, profile, verificationMode: mode, context: { toolCallHistory: item.toolCalls.flatMap(value => typeof value === 'string' ? [value] : []), sessionHistory: item.conversation.flatMap(value => value && typeof value === 'object' && 'role' in value && 'content' in value ? [value as { role: 'user' | 'assistant'; content: string }] : []) } };
    const started = performance.now();
    const result = await orchestrator.run(request);
    const latencyMs = performance.now() - started;
    const evaluatorCalls = result.verificationPath.flatMap(step => step.checks).filter(check => check === 'SemanticEvaluator').length;
    const row = { caseId: item.caseId, expectedDecision: item.expectedDecision, predictedDecision: result.decision, expectedVerificationState: item.expectedVerificationState, predictedVerificationState: result.verificationState, verificationTier: result.verificationTier, risk: result.risk, evidenceSource: result.evidenceSource, policyVersion: result.policyVersion, latencyMs, evaluatorCalls, passedDecision: item.expectedDecision ? item.expectedDecision === result.decision : null, passedVerificationState: item.expectedVerificationState ? item.expectedVerificationState === result.verificationState : null, originalResponse: result.originalResponse, reason: result.decisionReason };
    allRows.push(row);
    if (row.passedDecision === false || row.passedVerificationState === false) rows.push(row);
  }
  const labeledRows = allRows.filter(row => row.passedDecision !== null || row.passedVerificationState !== null);
  const decisionLabeled = allRows.filter(row => row.expectedDecision);
  const falseReleaseRows = decisionLabeled.filter(row => row.expectedDecision !== 'RELEASE' && row.predictedDecision === 'RELEASE');
  const falseBlockRows = decisionLabeled.filter(row => row.expectedDecision !== 'BLOCK' && row.predictedDecision === 'BLOCK');
  const highImpactRows = decisionLabeled.filter(row => row.risk.businessImpact === 'high' || row.risk.businessImpact === 'critical');
  const escalationExpected = highImpactRows.filter(row => row.expectedDecision === 'ESCALATE');
  const decisionDistribution = Object.fromEntries(decisions.map(decision => [decision, allRows.filter(row => row.predictedDecision === decision).length])) as Record<Decision, number>;
  const tierDistribution = { tier0: allRows.filter(row => row.verificationTier === 0).length, tier1: allRows.filter(row => row.verificationTier === 1).length, tier2: allRows.filter(row => row.verificationTier === 2).length };
  const labeledCorrect = decisionLabeled.filter(row => row.expectedDecision === row.predictedDecision).length;
  return { runId: randomUUID(), datasetId, fileName, trustClass: 'USER_UPLOADED', profile, policyVersion: allRows[0]?.policyVersion || 'profile-policy-v1.0', mode, splitName, split, timestamp: new Date().toISOString(), caseCount: allRows.length, labeledCount: labeledRows.length, unlabeledCount: allRows.length - labeledRows.length, metrics: { accuracy: decisionLabeled.length ? labeledCorrect / decisionLabeled.length : null, falseReleaseRate: decisionLabeled.length ? falseReleaseRows.length / decisionLabeled.length : null, falseBlockRate: decisionLabeled.length ? falseBlockRows.length / decisionLabeled.length : null, escalationRecall: escalationExpected.length ? escalationExpected.filter(row => row.predictedDecision === 'ESCALATE').length / escalationExpected.length : null, criticalFalseReleaseRate: null, highImpactFalseReleaseRate: highImpactRows.length ? falseReleaseRows.filter(row => row.risk.businessImpact === 'high' || row.risk.businessImpact === 'critical').length / highImpactRows.length : null, verificationCoverage: allRows.length ? (tierDistribution.tier1 + tierDistribution.tier2) / allRows.length : null }, tierDistribution, decisionDistribution, latency: { averageMs: allRows.length ? allRows.reduce((sum, row) => sum + row.latencyMs, 0) / allRows.length : 0, p50Ms: percentile(allRows.map(row => row.latencyMs), .5), p95Ms: percentile(allRows.map(row => row.latencyMs), .95), p99Ms: percentile(allRows.map(row => row.latencyMs), .99) }, evaluatorInvocationCount: allRows.reduce((sum, row) => sum + row.evaluatorCalls, 0), contaminationWarnings, failures: rows, limitations: ['Uploaded data is USER_UPLOADED and never trusted evidence.', 'Metrics only use labels explicitly supplied by the dataset.', 'Raw uploaded rows are retained only in temporary process memory and are not written to historical result artifacts.'] };
}
