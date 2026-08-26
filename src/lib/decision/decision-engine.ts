// ============================================================
// ControlPlane.ai — Decision Engine
// ============================================================

import type {
  DecisionResult,
  DetectionResult,
  Evidence,
  RiskScores,
  ClaimType,
  VerificationState,
} from '@/types';

export interface DecisionEngineInput {
  risk: RiskScores;
  detections: DetectionResult[];
  evidence: Evidence[];
  originalResponse: string;
  sanitizedResponse?: string;
  hasEvidenceConflict: boolean;
  hasUncertainty: boolean;
  claimType?: ClaimType;
  verificationState?: VerificationState;
}

export interface DetailedDecisionResult extends DecisionResult {
  editSafe: boolean;
  requiresHumanReview: boolean;
}

export class DecisionEngine {
  /**
   * Deterministically evaluates risk signals and policy rules to issue a final governance decision.
   * Priority: BLOCK > ESCALATE > EDIT > RELEASE.
   */
  public decide(input: DecisionEngineInput): DetailedDecisionResult {
    const {
      risk,
      detections,
      evidence,
      originalResponse,
      sanitizedResponse,
      hasEvidenceConflict,
      hasUncertainty,
      claimType = 'UNKNOWN',
      verificationState = hasUncertainty ? 'UNVERIFIED' : 'NOT_APPLICABLE',
    } = input;

    // 1. Check for Hard BLOCK conditions
    // Rule A: Factual conflict on critical financial/business ground truth (Hero Scenario C)
    if (hasEvidenceConflict) {
      const conflictEv = evidence.find(e => e.label.toLowerCase().includes('conflict') || e.label.toLowerCase().includes('status'));
      return {
        decision: 'BLOCK',
        reason: conflictEv?.detail || 'Response directly contradicts verified business records (factual hallucination).',
        confidence: 96,
        editSafe: false,
        requiresHumanReview: false,
      };
    }

    // Rule B: Active instruction injection or malicious jailbreak payload
    const hasInjection = detections.some(d => d.type === 'INJECTION_OVERRIDE' || d.type === 'INJECTION_JAILBREAK');
    if (hasInjection) {
      return {
        decision: 'BLOCK',
        reason: 'Malicious prompt injection or privileged instruction override detected.',
        confidence: 98,
        editSafe: false,
        requiresHumanReview: false,
      };
    }

    // Rule C: Critical unredactable safety or loop hazard
    const hasCriticalUnsafe = detections.some(d => d.severity === 'critical' && !d.editSafe);
    if (hasCriticalUnsafe) {
      return {
        decision: 'BLOCK',
        reason: 'Critical unmitigated safety or execution loop hazard detected.',
        confidence: 92,
        editSafe: false,
        requiresHumanReview: false,
      };
    }

    // 2. Required verification is a safety invariant; score cannot rescue uncertainty.
    if ((risk.businessImpact === 'high' || risk.businessImpact === 'critical' || claimType === 'FINANCIAL' || claimType === 'ORDER_STATUS' || claimType === 'HIRING_HIGH_IMPACT') && verificationState === 'UNVERIFIED') {
      return {
        decision: 'ESCALATE',
        reason: `Required ${claimType.toLowerCase()} verification is unavailable; high-impact output withheld for human review.`,
        confidence: 90,
        editSafe: false,
        requiresHumanReview: true,
      };
    }

    // 3. Check for ESCALATE conditions (Hero Scenario D)
    // Rule A: High/Critical business impact with fairness/bias concern or policy violation
    const hasFairness = detections.some(d => d.type === 'FAIRNESS_CONCERN');
    if (hasFairness || (risk.businessImpact === 'high' && risk.responsibility > 50)) {
      return {
        decision: 'ESCALATE',
        reason: 'Demographic bias or fairness policy concern identified in high-impact context; routed to Human Control Desk.',
        confidence: 88,
        editSafe: false,
        requiresHumanReview: true,
      };
    }

    // Rule B: High/Critical business impact with unverified claims / uncertainty
    if ((risk.businessImpact === 'high' || risk.businessImpact === 'critical') && (hasUncertainty || risk.composite > 45)) {
      return {
        decision: 'ESCALATE',
        reason: `High business impact (${risk.businessImpact}) paired with elevated risk (${risk.composite}/100); requires supervisor verification.`,
        confidence: 85,
        editSafe: false,
        requiresHumanReview: true,
      };
    }

    // 4. Check for EDIT conditions (Hero Scenario B)
    // Rule: PII detected, and ALL detections are auto-remediable (editSafe: true)
    const piiDetections = detections.filter(d => d.type.startsWith('PII_'));
    const allDetectionsEditSafe = detections.length > 0 && detections.every(d => d.editSafe);

    if (piiDetections.length > 0 && allDetectionsEditSafe && sanitizedResponse && sanitizedResponse !== originalResponse) {
      const piiTypes = Array.from(new Set(piiDetections.map(d => d.type.replace('PII_', '')))).join(', ');
      return {
        decision: 'EDIT',
        reason: `Sensitive data (${piiTypes}) safely detected and redacted according to privacy policy.`,
        confidence: 95,
        editedResponse: sanitizedResponse,
        editSafe: true,
        requiresHumanReview: false,
      };
    }

    // 5. RELEASE requires an applicable verification state, not merely no detections.
    if ((verificationState === 'VERIFIED' || verificationState === 'NOT_APPLICABLE') && risk.composite < 30 && detections.length === 0) {
      return {
        decision: 'RELEASE',
        reason: 'Low composite risk; all Tier 0 verification checks cleared with zero policy infractions.',
        confidence: 98,
        editSafe: true,
        requiresHumanReview: false,
      };
    }

    // 6. Any remaining uncertainty or signal is withheld.
    if (risk.composite >= 30 || detections.length > 0 || verificationState === 'UNVERIFIED') {
      return {
        decision: 'ESCALATE',
        reason: `Composite risk (${risk.composite}/100) exceeds autonomous release threshold; routed to Control Desk.`,
        confidence: 80,
        editSafe: false,
        requiresHumanReview: true,
      };
    }

    return {
      decision: 'ESCALATE',
      reason: 'Verification did not establish a safe autonomous release.',
      confidence: 80,
      editSafe: false,
      requiresHumanReview: true,
    };
  }
}
