import type { ClaimType, TaskType } from '@/types';

export interface ClaimClassification {
  claimType: ClaimType;
  confidence: number;
  reasons: string[];
}

/** Transparent, deliberately narrow classifier for the competition prototype. */
export class ClaimClassifier {
  public classify(text: string, taskType: TaskType = 'general', hasPII = false): ClaimClassification {
    const normalized = text.normalize('NFKC').toLowerCase();
    const reasons: string[] = [];

    if (taskType === 'financial' && normalized.trim().length > 0) {
      reasons.push('financial task profile requires financial claim verification');
      return { claimType: 'FINANCIAL', confidence: 0.8, reasons };
    }

    if (taskType === 'hiring' || /candidate|applicant|hiring|interview|recruit/.test(normalized)) {
      if (/recommend|prioriti[sz]|reject|select|rank|hire|choose|avoid|culture fit|family commitment|young|energetic|commit fully/.test(normalized)) {
        reasons.push('candidate recommendation or selection language');
        return { claimType: 'HIRING_HIGH_IMPACT', confidence: 0.95, reasons };
      }
    }

    if (/refund|reimburse|transaction|payment|credit|debit|charged|financial|account balance|interest rate|loan/.test(normalized)) {
      reasons.push('financial or transactional language');
      return { claimType: 'FINANCIAL', confidence: 0.95, reasons };
    }

    if (/order|package|delivery/.test(normalized) && /status|shipped|delivered|cancel|dispatch|arriv|tracking/.test(normalized)) {
      reasons.push('order lifecycle/status language');
      return { claimType: 'ORDER_STATUS', confidence: 0.9, reasons };
    }

    if (/guarantee|legally promise|policy says|eligible|must comply|regulatory|legal advice|medical|diagnos|prescription/.test(normalized)) {
      reasons.push('policy, legal, medical, or regulatory commitment');
      return { claimType: 'POLICY', confidence: 0.85, reasons };
    }

    if (/ignore (?:all )?(?:previous|prior)|system override|developer mode|jailbreak/.test(normalized)) {
      reasons.push('instruction or safety override language');
      return { claimType: 'SAFETY', confidence: 0.9, reasons };
    }

    if (hasPII) {
      reasons.push('structured sensitive data present');
      return { claimType: 'PII_SENSITIVE', confidence: 0.9, reasons };
    }

    if (/[.!?]/.test(text) && text.trim().length > 0) {
      reasons.push('no high-liability claim pattern detected');
      return { claimType: 'GENERAL_INFORMATION', confidence: 0.7, reasons };
    }

    return { claimType: 'UNKNOWN', confidence: 0.3, reasons: ['ambiguous or empty claim semantics'] };
  }
}
