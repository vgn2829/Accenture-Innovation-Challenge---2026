// ============================================================
// ControlPlane.ai — PII Detector (Responsibility Engine)
// ============================================================

import type { DetectionResult } from '@/types';

export interface PIIDetectionResult {
  hasPII: boolean;
  detections: DetectionResult[];
  sanitizedText: string;
}

export class PIIDetector {
  /**
   * Performs Luhn algorithm validation on prospective credit card digit sequences.
   */
  private isValidLuhn(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  public detect(text: string): PIIDetectionResult {
    const detections: DetectionResult[] = [];
    let sanitizedText = text.normalize('NFKC');

    // 1. Credit Card Regex with Luhn Validation (13-19 digits, run first to prevent partial 12-digit collisions)
    const cardRegex = /\b(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}|\d{13,19})\b/g;
    let match: RegExpExecArray | null;
    while ((match = cardRegex.exec(text)) !== null) {
      const candidate = match[0];
      const digitsOnly = candidate.replace(/\D/g, '');
      if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && this.isValidLuhn(digitsOnly)) {
        detections.push({
          type: 'PII_CREDIT_CARD',
          severity: 'critical',
          detector: 'PIIDetector',
          description: `Valid Credit/Debit card number detected (${digitsOnly.length} digits with valid Luhn checksum).`,
          matchedText: candidate,
          editSafe: true,
          editReplacement: '[CARD REDACTED]',
        });
        sanitizedText = sanitizedText.replaceAll(candidate, '[CARD REDACTED]');
      }
    }

    // 2. Email Regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      const email = match[0];
      detections.push({
        type: 'PII_EMAIL',
        severity: 'medium',
        detector: 'PIIDetector',
        description: `Direct personal email address detected: ${email}`,
        matchedText: email,
        editSafe: true,
        editReplacement: '[EMAIL REDACTED]',
      });
      sanitizedText = sanitizedText.replaceAll(email, '[EMAIL REDACTED]');
    }

    // 3. Indian Phone Regex (+91 / 0 followed by 10 digits starting with 6-9, or standard 10 digit formats)
    const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      const phone = match[0];
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length === 10 || digitsOnly.length === 12) {
        detections.push({
          type: 'PII_PHONE',
          severity: 'medium',
          detector: 'PIIDetector',
          description: `Personal phone number detected: ${phone}`,
          matchedText: phone,
          editSafe: true,
          editReplacement: '[PHONE REDACTED]',
        });
        sanitizedText = sanitizedText.replaceAll(phone, '[PHONE REDACTED]');
      }
    }

    // Conservative international phone and bank-account prototype patterns.
    const intlPhoneRegex = /\b(?:\+?\d{1,3}[\s-])(?:\d[\s-]?){7,13}\d\b/g;
    while ((match = intlPhoneRegex.exec(text)) !== null) {
      const phone = match[0];
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15 && !detections.some(d => d.matchedText === phone)) {
        detections.push({ type: 'PII_PHONE', severity: 'medium', detector: 'PIIDetector', description: 'International phone number detected.', matchedText: phone, editSafe: true, editReplacement: '[PHONE REDACTED]' });
        sanitizedText = sanitizedText.replaceAll(phone, '[PHONE REDACTED]');
      }
    }

    const bankRegex = /\b(?:account|a\/c|acct(?:ount)?)\s*(?:no\.?|number)?\s*[:#-]?\s*(\d[\d\s-]{7,20}\d)\b/gi;
    while ((match = bankRegex.exec(text)) !== null) {
      const account = match[0];
      detections.push({ type: 'PII_BANK_ACCOUNT', severity: 'high', detector: 'PIIDetector', description: 'Bank account identifier detected.', matchedText: account, editSafe: true, editReplacement: '[BANK ACCOUNT REDACTED]' });
      sanitizedText = sanitizedText.replaceAll(account, '[BANK ACCOUNT REDACTED]');
    }

    // 4. Indian PAN Card Regex: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
    while ((match = panRegex.exec(text)) !== null) {
      const pan = match[0];
      detections.push({
        type: 'PII_PAN',
        severity: 'high',
        detector: 'PIIDetector',
        description: `National Identity PAN (Permanent Account Number) detected: ${pan}`,
        matchedText: pan,
        editSafe: true,
        editReplacement: '[PAN REDACTED]',
      });
      sanitizedText = sanitizedText.replaceAll(pan, '[PAN REDACTED]');
    }

    // 5. Indian Aadhaar Card Regex: strictly 12 digits (not part of longer 16-digit cards)
    const aadhaarRegex = /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}(?!\s*\d)\b|\b[2-9]\d{11}(?!\d)\b/g;
    while ((match = aadhaarRegex.exec(text)) !== null) {
      const aadhaar = match[0];
      const rawDigits = aadhaar.replace(/\D/g, '');
      if (rawDigits.length === 12) {
        detections.push({
          type: 'PII_AADHAAR',
          severity: 'critical',
          detector: 'PIIDetector',
          description: `National Identity Aadhaar number detected: ${aadhaar}`,
          matchedText: aadhaar,
          editSafe: true,
          editReplacement: '[AADHAAR REDACTED]',
        });
        sanitizedText = sanitizedText.replaceAll(aadhaar, '[AADHAAR REDACTED]');
      }
    }

    return {
      hasPII: detections.length > 0,
      detections,
      sanitizedText,
    };
  }
}
