import { v4 as uuidv4 } from 'uuid';
import { PerformanceEngine, type PerformanceAnalysis } from '@/lib/engines/performance-engine';
import { CostEngine, type CostAnalysis } from '@/lib/engines/cost-engine';
import { ResponsibilityEngine, type ResponsibilityAnalysis } from '@/lib/engines/responsibility-engine';
import { PIIDetector } from '@/lib/engines/pii-detector';
import { InjectionDetector } from '@/lib/engines/injection-detector';
import { TokenAnalyzer } from '@/lib/engines/token-analyzer';
import { RiskFusion } from '@/lib/decision/risk-fusion';
import { DecisionEngine } from '@/lib/decision/decision-engine';
import { ClaimClassifier } from '@/lib/verification/claim-classifier';
import { VerificationPolicyEngine } from '@/lib/verification/verification-policy';
import { getUseCaseProfile, inferUseCaseProfile } from '@/lib/verification/use-case-profiles';
import { TrustedEvidenceResolver } from '@/lib/evidence/trusted-records';
import { PrototypeSemanticEvaluator } from '@/lib/ai/semantic-evaluator';
import type { AnalyzeRequest, AnalyzeResponse, AuditEvent, DetectionResult, Evidence, VerificationState, VerificationStep, VerificationTier } from '@/types';

export class VerificationOrchestrator {
  private readonly performanceEngine = new PerformanceEngine();
  private readonly costEngine = new CostEngine();
  private readonly responsibilityEngine = new ResponsibilityEngine();
  private readonly piiDetector = new PIIDetector();
  private readonly injectionDetector = new InjectionDetector();
  private readonly tokenAnalyzer = new TokenAnalyzer();
  private readonly riskFusion = new RiskFusion();
  private readonly decisionEngine = new DecisionEngine();
  private readonly classifier = new ClaimClassifier();
  private readonly policyEngine = new VerificationPolicyEngine();
  private readonly evidenceResolver = new TrustedEvidenceResolver();
  private readonly semanticEvaluator = new PrototypeSemanticEvaluator();

  public async run(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const startTime = performance.now();
    const requestId = request.requestId || `req_${uuidv4().substring(0, 8)}`;
    const taskType = request.taskType || 'general';
    const profileId = inferUseCaseProfile(taskType, request.profile);
    const profile = getUseCaseProfile(profileId);
    const requestedImpact = request.businessImpact || profile.defaultImpact;
    const model = request.model || 'gpt-4o';
    const aiResponse = request.aiResponse || '';
    const verificationPath: VerificationStep[] = [];
    const allDetections: DetectionResult[] = [];
    const allEvidence: Evidence[] = [];

    const t0Start = performance.now();
    // Independent Tier 0 checks are scheduled together. They remain deterministic
    // and bounded; the structure also makes a worker-backed implementation possible
    // without changing the policy contract.
    const [piiRes, injectionRes, tokenRes] = await Promise.all([
      Promise.resolve().then(() => this.piiDetector.detect(aiResponse)),
      Promise.resolve().then(() => this.injectionDetector.detect(aiResponse)),
      Promise.resolve().then(() => this.tokenAnalyzer.analyze(aiResponse, model, request.context?.sessionHistory, request.context?.retrievedDocs)),
    ]);
    const classification = this.classifier.classify(aiResponse, taskType, piiRes.hasPII);
    const policy = this.policyEngine.select(classification.claimType, requestedImpact, profileId, request.region);
    allDetections.push(...piiRes.detections, ...injectionRes.detections, ...tokenRes.detections);
    verificationPath.push({
      tier: 0,
      checks: ['PIIDetector', 'InjectionDetector', 'TokenAnalyzer', 'ClaimClassifier'],
      latencyMs: Math.max(1, Math.round(performance.now() - t0Start)),
      triggered: true,
    });

    let highestTierExecuted: VerificationTier = 0;
    let respAnalysis: ResponsibilityAnalysis = {
      signal: { piiDetected: piiRes.hasPII, injectionDetected: injectionRes.hasInjection, policyViolation: false, fairnessConcern: false, responsibilityScore: piiRes.hasPII ? 50 : injectionRes.hasInjection ? 90 : 0 },
      detections: [...piiRes.detections, ...injectionRes.detections],
      sanitizedText: piiRes.sanitizedText,
    };
    let costAnalysis: CostAnalysis = {
      signal: { estimatedInputTokens: tokenRes.estimatedInputTokens, estimatedOutputTokens: tokenRes.estimatedOutputTokens, estimatedCostUsd: tokenRes.estimatedCostUsd, isEstimated: true, retryCount: 0, loopDetected: false, costScore: 5 },
      detections: tokenRes.detections,
    };

    const hasConversationRisk = Boolean(request.context?.sessionHistory?.length || request.context?.toolCallHistory?.length);
    const shouldRunTier1 = policy.minimumTier >= 1 || piiRes.hasPII || injectionRes.hasInjection || hasConversationRisk;
    if (shouldRunTier1) {
      highestTierExecuted = 1;
      const t1Start = performance.now();
      respAnalysis = this.responsibilityEngine.analyze(aiResponse, taskType);
      costAnalysis = this.costEngine.analyze(aiResponse, model, request.context);
      this.mergeDetections(allDetections, respAnalysis.detections);
      this.mergeDetections(allDetections, costAnalysis.detections);
      verificationPath.push({ tier: 1, checks: ['ResponsibilityEngine', 'CostEngine.LoopDetector', 'CostEngine.RetryDetector', 'SafetyPolicyDetector'], latencyMs: Math.max(2, Math.round(performance.now() - t1Start)), triggered: true, triggerReason: `Policy minimum tier ${policy.minimumTier} / effective impact ${policy.effectiveImpact}` });
    }

    const shouldRunTier2 = request.verificationMode === 'deep' || policy.minimumTier === 2 || (policy.evidenceRequired && policy.effectiveImpact !== 'low') || policy.fairnessGate;
    let perfAnalysis: PerformanceAnalysis = {
      signal: { grounded: policy.claimType === 'GENERAL_INFORMATION' || policy.claimType === 'PII_SENSITIVE', verificationState: policy.claimType === 'GENERAL_INFORMATION' || policy.claimType === 'PII_SENSITIVE' ? 'NOT_APPLICABLE' : 'UNVERIFIED', consistencyScore: 95, evidenceConflict: false, evidenceDetails: [], performanceScore: policy.claimType === 'GENERAL_INFORMATION' || policy.claimType === 'PII_SENSITIVE' ? 5 : 35 },
      detections: [],
      evidence: [],
    };

    let evidenceSource: AnalyzeResponse['evidenceSource'] = 'none';
    if (shouldRunTier2) {
      highestTierExecuted = 2;
      const t2Start = performance.now();
      const trustedRecord = this.evidenceResolver.resolve(request.context?.entityRef, request.scenario);
      const trustedRecords = trustedRecord ? { [trustedRecord.recordType]: trustedRecord } : undefined;
      evidenceSource = trustedRecord ? 'trusted_demo_record' : request.context?.retrievedDocs?.length ? 'retrieved_context_unverified' : 'none';
      perfAnalysis = this.performanceEngine.analyze(aiResponse, { businessRecords: trustedRecords, retrievedDocs: request.context?.retrievedDocs, claimType: policy.claimType });
      this.mergeDetections(allDetections, perfAnalysis.detections);
      allEvidence.push(...perfAnalysis.evidence);

      if (policy.fairnessGate) {
        const semantic = await this.semanticEvaluator.evaluate(aiResponse, policy.claimType);
        if (semantic.potentialBias) {
          allDetections.push({ type: 'FAIRNESS_CONCERN', severity: semantic.severity === 'info' ? 'medium' : semantic.severity, detector: `SemanticEvaluator:${semantic.evaluator}`, description: semantic.reason, editSafe: false });
          respAnalysis.signal.fairnessConcern = true;
          respAnalysis.signal.responsibilityScore = Math.max(respAnalysis.signal.responsibilityScore, semantic.severity === 'high' ? 85 : 65);
        }
        if (semantic.uncertain && policy.escalationOnUncertainty) {
          allEvidence.push({ label: 'Semantic Fairness Evaluation', claimed: 'Fairness screen', actual: 'Uncertain semantic result', detail: semantic.reason });
          perfAnalysis.signal.verificationState = 'UNVERIFIED';
        }
      }
      verificationPath.push({ tier: 2, checks: ['TrustedEvidenceResolver', 'EvidenceVerifier', 'ConsistencyChecker', ...(policy.fairnessGate ? ['SemanticEvaluator'] : [])], latencyMs: Math.max(3, Math.round(performance.now() - t2Start)), triggered: true, triggerReason: `Policy ${policy.claimType}; effective impact ${policy.effectiveImpact}` });
    }

    const fusionRes = this.riskFusion.compute(perfAnalysis.signal, costAnalysis.signal, respAnalysis.signal, policy.effectiveImpact, allDetections);
    const verificationState: VerificationState = perfAnalysis.signal.verificationState ?? 'UNVERIFIED';
    const decisionRes = this.decisionEngine.decide({
      risk: fusionRes.risk,
      detections: allDetections,
      evidence: allEvidence,
      originalResponse: aiResponse,
      sanitizedResponse: respAnalysis.sanitizedText,
      hasEvidenceConflict: perfAnalysis.signal.evidenceConflict,
      hasUncertainty: verificationState === 'UNVERIFIED',
      claimType: policy.claimType,
      verificationState,
    });

    const totalLatencyMs = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();
    const auditEvent: AuditEvent = { requestId, timestamp, model, taskType, businessImpact: policy.effectiveImpact, risk: fusionRes.risk, detections: allDetections, evidence: allEvidence, verificationTier: highestTierExecuted, decision: decisionRes.decision, decisionReason: decisionRes.reason, confidence: decisionRes.confidence, latencyMs: totalLatencyMs, editedResponse: decisionRes.editedResponse, demoMode: Boolean(request.demoMode), scenario: request.scenario, claimType: policy.claimType, verificationState, profile: policy.profile, region: policy.region, policyVersion: policy.policyVersion, evidenceSource, latencyBudgetMs: policy.maxLatencyBudget };

    return { requestId, decision: decisionRes.decision, decisionReason: decisionRes.reason, confidence: decisionRes.confidence, risk: fusionRes.risk, claimType: policy.claimType, verificationState, profile: policy.profile, region: policy.region, policyVersion: policy.policyVersion, evidenceSource, latencyBudgetMs: policy.maxLatencyBudget, detections: allDetections, evidence: allEvidence, verificationTier: highestTierExecuted, verificationPath, latencyMs: totalLatencyMs, editedResponse: decisionRes.editedResponse, originalResponse: aiResponse, model, taskType, timestamp, auditEvent, demoMode: Boolean(request.demoMode), scenario: request.scenario };
  }

  private mergeDetections(target: DetectionResult[], incoming: DetectionResult[]): void {
    for (const detection of incoming) {
      if (!target.some(existing => existing.type === detection.type && existing.matchedText === detection.matchedText)) target.push(detection);
    }
  }
}
