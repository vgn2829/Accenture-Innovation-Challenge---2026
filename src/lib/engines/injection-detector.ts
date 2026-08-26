// ============================================================
// ControlPlane.ai — Injection Detector (Responsibility Engine)
// ============================================================

import type { DetectionResult } from '@/types';

export interface InjectionDetectionResult {
  hasInjection: boolean;
  detections: DetectionResult[];
}

export class InjectionDetector {
  private patterns = [
    {
      regex: /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|prompts|directives)/i,
      severity: 'critical' as const,
      type: 'INJECTION_OVERRIDE' as const,
      desc: 'Explicit prompt override directive detected ("ignore previous instructions").',
    },
    {
      regex: /(?:system\s+override|admin\s+mode|dan\s+mode|jailbreak|developer\s+mode\s+enabled)/i,
      severity: 'critical' as const,
      type: 'INJECTION_JAILBREAK' as const,
      desc: 'Known adversarial jailbreak / privileged mode escalation payload detected.',
    },
    {
      regex: /(?:you\s+are\s+now|act\s+as)\s+(?:an?\s+)?(?:unfiltered|unrestricted|evil|unaligned|ruleless)\s+(?:ai|assistant|model)/i,
      severity: 'high' as const,
      type: 'INJECTION_JAILBREAK' as const,
      desc: 'Persona manipulation designed to bypass alignment and policy boundaries.',
    },
    {
      regex: /(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|###\s*System:|<system>)/i,
      severity: 'high' as const,
      type: 'INJECTION_OVERRIDE' as const,
      desc: 'Special delimiter injection mimicking system prompt boundary tokens.',
    },
  ];

  public detect(text: string): InjectionDetectionResult {
    const detections: DetectionResult[] = [];
    // Zero-width characters can join words and defeat word-boundary regexes;
    // turn them into spaces so the normalized text preserves token boundaries.
    const normalized = text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ');
    const homoglyphNormalized = normalized
      .replace(/[іι]/gi, 'i')
      .replace(/[οо]/gi, 'o')
      .replace(/[а]/gi, 'a')
      .replace(/[е]/gi, 'e');

    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(normalized) || pattern.regex.exec(homoglyphNormalized);
      if (match) {
        detections.push({
          type: pattern.type,
          severity: pattern.severity,
          detector: 'InjectionDetector',
          description: pattern.desc,
          matchedText: match[0],
          editSafe: false, // Injection attacks cannot be safely edited into benign text
        });
      }
    }

    // Detect encoded override payloads without treating arbitrary base64 as an attack.
    const base64Candidates = text.match(/\b[A-Za-z0-9+/]{28,}={0,2}\b/g) || [];
    for (const candidate of base64Candidates) {
      try {
        const decoded = Buffer.from(candidate, 'base64').toString('utf8').normalize('NFKC');
        if (/(ignore|disregard|forget)\s+(all\s+)?(previous|prior)\s+(instructions|rules)/i.test(decoded)) {
          detections.push({ type: 'INJECTION_OVERRIDE', severity: 'critical', detector: 'InjectionDetector', description: 'Base64-encoded instruction override detected.', matchedText: candidate, editSafe: false });
        }
      } catch {
        // Invalid encodings remain ordinary text.
      }
    }

    return {
      hasInjection: detections.length > 0,
      detections,
    };
  }
}
