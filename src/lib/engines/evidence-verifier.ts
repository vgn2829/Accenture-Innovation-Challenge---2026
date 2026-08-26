// ============================================================
// ControlPlane.ai — Evidence Verifier (Performance Engine)
// ============================================================

import type { BusinessRecord, ClaimType, DetectionResult, Evidence, VerificationState } from '@/types';

export interface EvidenceVerificationResult {
  status: VerificationState;
  evidence: Evidence[];
  detections: DetectionResult[];
  confidence: number;
}

export class EvidenceVerifier {
  /**
   * Deterministically extracts factual claims from AI response and verifies against business records.
   * Special emphasis on financial/refund claims (e.g. ₹24,500 or $ amounts, order status, processed transactions).
   */
  public verify(
    aiResponse: string,
    businessRecords?: Record<string, BusinessRecord>,
    claimType?: ClaimType
  ): EvidenceVerificationResult {
    const evidence: Evidence[] = [];
    const detections: DetectionResult[] = [];

    // Financial / Refund claim patterns
    const amountRegex = /(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d{2})?)/gi;
    const claimedAmounts: { value: string; currency: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = amountRegex.exec(aiResponse)) !== null) {
      const prefix = match[0].slice(0, match[0].indexOf(match[1])).trim().toLowerCase();
      claimedAmounts.push({ value: match[1].replace(/,/g, ''), currency: prefix === '$' ? 'USD' : 'INR' });
    }

    const mentionsRefundClaim = /(?:refund|reimbursement).{0,100}(?:processed|completed|credited|issued|approved|complete)/i.test(aiResponse)
      || /(?:initiated|processed|issued|credited|approved)\s*(?:a\s*)?(?:full\s*)?refund/i.test(aiResponse);

    const mentionsOrderCancelled = /order\s*(?:has been|was|is)\s*(?:cancelled|canceled)/i.test(aiResponse);

    // If no specific business claim is made in the text, it is naturally consistent
    const requiresVerification = ['FINANCIAL', 'ORDER_STATUS', 'TRANSACTIONAL', 'POLICY', 'FACTUAL'].includes(claimType || '');
    if (!mentionsRefundClaim && !mentionsOrderCancelled && claimedAmounts.length === 0 && !requiresVerification) {
      return {
        status: 'NOT_APPLICABLE',
        evidence: [
          {
            label: 'Evidence Grounding',
            claimed: 'General statement',
            actual: 'No financial/factual business claims requiring database verification',
            detail: 'Statement contains no contentious transactional assertions.',
          },
        ],
        detections: [],
        confidence: 95,
      };
    }

    if (!businessRecords || Object.keys(businessRecords).length === 0) {
      return {
        status: 'UNVERIFIED',
        evidence: [
          {
            label: 'Business Record Availability',
            claimed: 'Referenced business actions',
            actual: 'No ground-truth business records provided in context',
            detail: 'Verification skipped Tier 1 ground-truth check due to missing records.',
          },
        ],
        detections: [],
        confidence: 50,
      };
    }

    const orderIdRegex = /(?:order|id|ticket|ref|invoice)[\s#:]*([A-Za-z0-9-_]{4,})/i;
    const orderIdMatch = orderIdRegex.exec(aiResponse);
    const orderId = orderIdMatch ? orderIdMatch[1] : undefined;

    const refundRecord = (businessRecords.refund || businessRecords.refunds || businessRecords.transaction) as BusinessRecord | undefined;
    const orderRecord = (businessRecords.order || businessRecords.orders || (orderId ? businessRecords[orderId] : undefined)) as BusinessRecord | undefined;

    // Bind claims to the specific trusted entity. A record for one order/refund
    // must never certify a response that names a different entity.
    const normalizeId = (value: unknown) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const trustedOrderId = normalizeId(refundRecord?.order_id || orderRecord?.order_id);
    const claimedOrderId = normalizeId(orderId);
    if (claimedOrderId && trustedOrderId && claimedOrderId !== trustedOrderId) {
      const ev: Evidence = {
        label: 'Entity Reference Conflict',
        claimed: orderId || 'unknown order reference',
        actual: String(refundRecord?.order_id || orderRecord?.order_id),
        detail: 'The response names an entity different from the trusted record selected for verification.',
      };
      evidence.push(ev);
      detections.push({
        type: 'FACTUAL_CONFLICT',
        severity: 'critical',
        detector: 'EvidenceVerifier',
        description: 'Response entity reference does not match the trusted business record.',
        evidence: [ev],
        matchedText: orderId,
        editSafe: false,
      });
    }

    let hasConflict = evidence.some(e => e.label === 'Entity Reference Conflict');

    // A. Check Refund Status Conflict (Hero Scenario C)
    if (mentionsRefundClaim) {
      if (refundRecord) {
        const actualStatus = String(refundRecord.status || refundRecord.refund_status || '').toUpperCase();
        const actualAmount = refundRecord.amount || refundRecord.refund_amount;
        const actualCurrency = String(refundRecord.currency || 'INR').toUpperCase();

        if (actualStatus !== 'PROCESSED' && actualStatus !== 'COMPLETED' && actualStatus !== 'SUCCESS') {
          hasConflict = true;
          const ev: Evidence = {
            label: 'Refund Status Conflict',
            claimed: 'Refund has been processed / initiated',
            actual: `Status: ${actualStatus || 'REJECTED / PENDING'}`,
            detail: `Business record shows refund was ${actualStatus || 'not completed'}. AI falsely claimed completion.`,
          };
          evidence.push(ev);

          detections.push({
            type: 'FACTUAL_CONFLICT',
            severity: 'critical',
            detector: 'EvidenceVerifier',
            description: `AI response asserted refund completion, but system record indicates status is ${actualStatus || 'FAILED/PENDING'}.`,
            evidence: [ev],
            matchedText: 'refund has been processed',
            editSafe: false,
          });
        }

        // Amount verification
        if (claimedAmounts.length > 0 && actualAmount !== undefined) {
          const expectedNum = Number(String(actualAmount).replace(/,/g, ''));
          const claimedNum = Number(claimedAmounts[0].value);
          if (!isNaN(expectedNum) && !isNaN(claimedNum) && expectedNum !== claimedNum) {
            hasConflict = true;
            const ev: Evidence = {
              label: 'Refund Amount Mismatch',
              claimed: `${actualCurrency} ${claimedNum}`,
              actual: `${actualCurrency} ${expectedNum}`,
              detail: `Claimed amount does not match authorized transaction record of ${expectedNum}.`,
            };
            evidence.push(ev);

            detections.push({
              type: 'FACTUAL_CONFLICT',
              severity: 'high',
              detector: 'EvidenceVerifier',
              description: `Claimed amount (${claimedNum}) contradicts system authorization amount (${expectedNum}).`,
              evidence: [ev],
              editSafe: false,
            });
          }
          if (claimedAmounts[0].currency !== actualCurrency) {
            hasConflict = true;
            const ev: Evidence = {
              label: 'Refund Currency Conflict',
              claimed: `${claimedAmounts[0].currency} ${claimedAmounts[0].value}`,
              actual: `${actualCurrency} ${expectedNum}`,
              detail: 'Claimed currency does not match the trusted transaction currency.',
            };
            evidence.push(ev);
            detections.push({
              type: 'FACTUAL_CONFLICT',
              severity: 'critical',
              detector: 'EvidenceVerifier',
              description: 'Financial claim currency conflicts with trusted record.',
              evidence: [ev],
              matchedText: claimedAmounts[0].currency,
              editSafe: false,
            });
          }
        }
      } else {
        evidence.push({
          label: 'Unverified Refund Claim',
          claimed: 'Refund processed',
          actual: 'No matching refund record found in active business context',
          detail: 'Response claims financial transaction without backing database record.',
        });
      }
    }

    // B. Check Order Cancellation Conflict
    if (mentionsOrderCancelled && orderRecord) {
      const orderStatus = String(orderRecord.status || '').toUpperCase();
      if (orderStatus === 'SHIPPED' || orderStatus === 'DELIVERED' || orderStatus === 'ACTIVE') {
        hasConflict = true;
        const ev: Evidence = {
          label: 'Order Status Conflict',
          claimed: 'Order cancelled',
          actual: `Order is currently ${orderStatus}`,
          detail: `System record indicates order cannot be cancelled as it is already ${orderStatus}.`,
        };
        evidence.push(ev);

        detections.push({
          type: 'FACTUAL_CONFLICT',
          severity: 'critical',
          detector: 'EvidenceVerifier',
          description: `AI claimed order was cancelled, but record status is ${orderStatus}.`,
          evidence: [ev],
          editSafe: false,
        });
      }
    }

    // Positive order lifecycle claims must also match the trusted status.
    if (claimType === 'ORDER_STATUS' && orderRecord) {
      const lowerResponse = aiResponse.toLowerCase();
      const claimedStatus = /cancel/.test(lowerResponse)
        ? 'CANCELLED'
        : /deliver/.test(lowerResponse)
          ? 'DELIVERED'
          : /ship|dispatch/.test(lowerResponse)
            ? 'SHIPPED'
            : undefined;
      const actualStatus = String(orderRecord.status || '').toUpperCase();
      if (claimedStatus && actualStatus && claimedStatus !== actualStatus) {
        hasConflict = true;
        const ev: Evidence = { label: 'Order Status Conflict', claimed: claimedStatus, actual: actualStatus, detail: 'Claimed order lifecycle state conflicts with the trusted record.' };
        evidence.push(ev);
        detections.push({ type: 'FACTUAL_CONFLICT', severity: 'critical', detector: 'EvidenceVerifier', description: 'Order status conflicts with trusted record.', evidence: [ev], editSafe: false });
      } else if (claimedStatus && actualStatus && claimedStatus === actualStatus) {
        evidence.push({ label: 'Order Status Grounding', claimed: claimedStatus, actual: actualStatus, detail: 'Order lifecycle claim matches the trusted record selected by entity reference.' });
      }
    }

    if (hasConflict) {
      return {
        status: 'CONFLICT',
        evidence,
        detections,
        confidence: 95,
      };
    }

    if (evidence.some(e => e.label.includes('Unverified'))) {
      return {
        status: 'UNVERIFIED',
        evidence,
        detections,
        confidence: 70,
      };
    }

    if (requiresVerification && evidence.length === 0) {
      return {
        status: 'UNVERIFIED',
        evidence: [{ label: 'Material Claim Without Evidence', claimed: 'Material factual or policy assertion', actual: 'No matching trusted evidence was established', detail: 'The active use-case policy requires evidence before autonomous release.' }],
        detections: [],
        confidence: 50,
      };
    }

    return {
      status: 'VERIFIED',
      evidence: [
        {
          label: 'Evidence Grounding',
          claimed: 'Response statements',
          actual: 'Consistent with available records',
          detail: 'All transactional claims verified against provided business records.',
        },
      ],
      detections: [],
      confidence: 95,
    };
  }
}
