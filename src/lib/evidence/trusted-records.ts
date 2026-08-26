import type { BusinessRecord } from '@/types';

export interface TrustedEvidenceRecord extends BusinessRecord {
  entityRef: string;
  recordType: 'refund' | 'order';
  updatedAt: string;
}

const TRUSTED_RECORDS: Record<string, TrustedEvidenceRecord> = {
  ORDER_ORD4492: {
    entityRef: 'ORDER_ORD4492',
    recordType: 'order',
    order_id: 'ORD-4492',
    status: 'SHIPPED',
    updatedAt: '2026-08-24T14:30:00Z',
  },
  REFUND_8921: {
    entityRef: 'REFUND_8921',
    recordType: 'refund',
    refund_id: 'REF_24500_FAIL',
    order_id: 'ORD_99123',
    amount: 24500,
    currency: 'INR',
    status: 'REJECTED',
    reason: 'Item return window expired',
    updatedAt: '2026-08-24T14:30:00Z',
  },
  REFUND_24500_FAIL: {
    entityRef: 'REFUND_24500_FAIL',
    recordType: 'refund',
    refund_id: 'REF_24500_FAIL',
    order_id: 'ORD_99123',
    amount: 24500,
    currency: 'INR',
    status: 'REJECTED',
    reason: 'Item return window expired',
    updatedAt: '2026-08-24T14:30:00Z',
  },
};

export class TrustedEvidenceResolver {
  public resolve(entityRef?: string, scenario?: string): TrustedEvidenceRecord | undefined {
    const ref = entityRef || (scenario === 'C' ? 'REFUND_8921' : scenario === 'A' ? 'ORDER_ORD4492' : undefined);
    return ref ? TRUSTED_RECORDS[ref.toUpperCase()] : undefined;
  }
}
