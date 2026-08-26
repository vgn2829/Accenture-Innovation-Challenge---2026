import type { BusinessImpact, ClaimType, UseCaseProfileId, VerificationTier } from '@/types';
import { getUseCaseProfile, normalizeRegion, POLICY_VERSION } from './use-case-profiles';

export interface VerificationPolicy {
  claimType: ClaimType;
  requestedImpact: BusinessImpact;
  effectiveImpact: BusinessImpact;
  minimumTier: VerificationTier;
  evidenceRequired: boolean;
  fairnessGate: boolean;
  escalationOnUncertainty: boolean;
  maxLatencyBudget: number;
  profile: UseCaseProfileId;
  region: string;
  policyVersion: string;
  grounding: 'preferred' | 'required_for_material_claims' | 'required';
}

const impactRank: Record<BusinessImpact, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const rankImpact: BusinessImpact[] = ['low', 'medium', 'high', 'critical'];

export function deriveImpact(requested: BusinessImpact, claimType: ClaimType): BusinessImpact {
  const floor: BusinessImpact =
    claimType === 'FINANCIAL' || claimType === 'HIRING_HIGH_IMPACT' || claimType === 'POLICY'
      ? 'high'
      : claimType === 'SAFETY'
        ? 'high'
        : 'low';
  return rankImpact[Math.max(impactRank[requested], impactRank[floor])];
}

export class VerificationPolicyEngine {
  public select(claimType: ClaimType, requestedImpact: BusinessImpact, profileId: UseCaseProfileId = 'customer_support', region?: string): VerificationPolicy {
    const profile = getUseCaseProfile(profileId);
    const effectiveImpact = deriveImpact(requestedImpact, claimType);
    const financial = claimType === 'FINANCIAL';
    const hiring = claimType === 'HIRING_HIGH_IMPACT';
    const evidenceRequired = financial || claimType === 'ORDER_STATUS' || claimType === 'TRANSACTIONAL';

    const profileTier = profile.minimumTierForClaim(claimType);
    const baseTier = financial || hiring || claimType === 'ORDER_STATUS' ? 2 : evidenceRequired ? 1 : claimType === 'POLICY' ? 1 : 0;
    return {
      claimType,
      requestedImpact,
      effectiveImpact,
      minimumTier: Math.max(baseTier, profileTier) as VerificationTier,
      evidenceRequired,
      fairnessGate: hiring || profile.fairnessScreen,
      escalationOnUncertainty: profile.uncertainty === 'escalate' || effectiveImpact === 'high' || effectiveImpact === 'critical' || hiring,
      maxLatencyBudget: profile.latencyBudgetMs,
      profile: profile.id,
      region: normalizeRegion(region),
      policyVersion: POLICY_VERSION,
      grounding: profile.grounding,
    };
  }
}
