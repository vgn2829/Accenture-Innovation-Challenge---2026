import type { BusinessImpact, ClaimType, UseCaseProfileId, VerificationTier } from '@/types';

export interface UseCaseProfile {
  id: UseCaseProfileId;
  label: string;
  defaultImpact: BusinessImpact;
  latencyBudgetMs: number;
  grounding: 'preferred' | 'required_for_material_claims' | 'required';
  piiAction: 'redact';
  fairnessScreen: boolean;
  uncertainty: 'escalate_high_impact' | 'escalate_material' | 'escalate';
  minimumTierForClaim: (claimType: ClaimType) => VerificationTier;
}

const PROFILES: Record<UseCaseProfileId, UseCaseProfile> = {
  customer_support: {
    id: 'customer_support',
    label: 'Customer Support',
    defaultImpact: 'medium',
    latencyBudgetMs: 100,
    grounding: 'preferred',
    piiAction: 'redact',
    fairnessScreen: false,
    uncertainty: 'escalate_high_impact',
    minimumTierForClaim: claimType => claimType === 'FINANCIAL' || claimType === 'ORDER_STATUS' ? 2 : claimType === 'POLICY' ? 1 : 0,
  },
  knowledge_assistant: {
    id: 'knowledge_assistant',
    label: 'Knowledge Assistant',
    defaultImpact: 'medium',
    latencyBudgetMs: 250,
    grounding: 'required_for_material_claims',
    piiAction: 'redact',
    fairnessScreen: false,
    uncertainty: 'escalate_material',
    minimumTierForClaim: claimType => ['FINANCIAL', 'ORDER_STATUS', 'POLICY', 'FACTUAL', 'TRANSACTIONAL'].includes(claimType) ? 1 : 0,
  },
  decision_support: {
    id: 'decision_support',
    label: 'Decision Support',
    defaultImpact: 'high',
    latencyBudgetMs: 1000,
    grounding: 'required',
    piiAction: 'redact',
    fairnessScreen: true,
    uncertainty: 'escalate',
    minimumTierForClaim: claimType => claimType === 'GENERAL_INFORMATION' || claimType === 'PII_SENSITIVE' ? 1 : 2,
  },
};

export const POLICY_VERSION = 'profile-policy-v1.0';

export function getUseCaseProfile(id: UseCaseProfileId): UseCaseProfile {
  return PROFILES[id];
}

export function inferUseCaseProfile(taskType: string, requested?: UseCaseProfileId): UseCaseProfileId {
  if (requested) return requested;
  if (taskType === 'hiring') return 'decision_support';
  if (taskType === 'financial' || taskType === 'customer-support') return 'customer_support';
  return 'knowledge_assistant';
}

export function normalizeRegion(region?: string): string {
  return (region || 'GLOBAL').trim().toUpperCase().slice(0, 12) || 'GLOBAL';
}
