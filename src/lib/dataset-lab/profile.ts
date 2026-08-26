import { PIIDetector } from '@/lib/engines/pii-detector';
import type { DatasetProfile, MappingSuggestion } from './types';
import type { AdapterResult } from './adapters';

const aliases: Record<string, string[]> = {
  caseId: ['caseid', 'case_id', 'id', 'record_id', 'request_id'],
  prompt: ['prompt', 'question', 'input', 'user_prompt'],
  aiResponse: ['airesponse', 'assistant_output', 'model_response', 'generated_text', 'answer', 'response', 'output'],
  useCase: ['usecase', 'use_case', 'profile', 'domain'],
  claimType: ['claimtype', 'claim_type'],
  businessImpact: ['businessimpact', 'business_impact', 'impact', 'risk'],
  entityReferences: ['entityreferences', 'entity_reference', 'entity_ref', 'transaction_id', 'order_id', 'refund_id'],
  evidence: ['evidence', 'ground_truth', 'groundtruth', 'source_record'],
  conversation: ['conversation', 'messages', 'session_history', 'history'],
  toolCalls: ['toolcalls', 'tool_calls', 'tools'],
  expectedDecision: ['expecteddecision', 'expected_decision', 'label', 'decision', 'expected_action'],
  expectedVerificationState: ['expectedverificationstate', 'expected_verification_state', 'verification_state'],
  expectedRiskFlags: ['expectedriskflags', 'expected_risk_flags', 'risk_flags'],
};

function normalized(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }

export function suggestMappings(columns: string[]): MappingSuggestion[] {
  return Object.entries(aliases).map(([canonicalField, names]) => {
    const exact = columns.filter(column => names.some(name => normalized(name) === normalized(column)));
    const fuzzy = columns.filter(column => names.some(name => normalized(column).includes(normalized(name)) || normalized(name).includes(normalized(column))));
    const candidates = Array.from(new Set(exact.length ? exact : fuzzy));
    const confidence = exact.length === 1 ? 'HIGH' : candidates.length === 1 ? 'MEDIUM' : candidates.length > 1 ? 'LOW' : 'NONE';
    return { canonicalField: canonicalField as MappingSuggestion['canonicalField'], sourceField: candidates.length === 1 ? candidates[0] : undefined, confidence, candidates, ambiguous: candidates.length > 1 };
  });
}

function inferredType(values: unknown[]): string {
  const present = values.filter(value => value !== null && value !== undefined && value !== '');
  if (!present.length) return 'missing';
  if (present.every(value => typeof value === 'boolean')) return 'boolean';
  if (present.every(value => typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)))) return 'number-like';
  if (present.some(value => typeof value === 'object')) return 'nested/object';
  return 'text';
}

export function profileDataset(datasetId: string, fileName: string, adapterResult: AdapterResult): DatasetProfile {
  const piiDetector = new PIIDetector();
  const missingValues: Record<string, number> = {};
  const inferredTypes: Record<string, string> = {};
  const nestedFields = new Set<string>();
  const piiFields = new Set<string>();
  let maxObservedTextLength = 0;
  let piiCandidateRows = 0;
  const fingerprints = new Set<string>();
  let duplicateRows = 0;
  for (const column of adapterResult.columns) {
    const values = adapterResult.rows.map(row => row[column]);
    missingValues[column] = values.filter(value => value === null || value === undefined || value === '').length;
    inferredTypes[column] = inferredType(values);
    if (inferredTypes[column] === 'nested/object') nestedFields.add(column);
  }
  for (const row of adapterResult.rows) {
    const fingerprint = JSON.stringify(row);
    if (fingerprints.has(fingerprint)) duplicateRows += 1;
    fingerprints.add(fingerprint);
    let rowHasPii = false;
    for (const [field, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        maxObservedTextLength = Math.max(maxObservedTextLength, value.length);
        const pii = piiDetector.detect(value);
        if (pii.hasPII) { rowHasPii = true; piiFields.add(field); }
      }
    }
    if (rowHasPii) piiCandidateRows += 1;
  }
  const suggestions = suggestMappings(adapterResult.columns);
  return {
    datasetId, fileName, format: adapterResult.format, trustClass: 'USER_UPLOADED', rowCount: adapterResult.rows.length + adapterResult.malformedRows, validRows: adapterResult.rows.length, malformedRows: adapterResult.malformedRows, columns: adapterResult.columns, inferredTypes, missingValues, duplicateRows, nestedFields: Array.from(nestedFields), maxObservedTextLength, piiCandidateRows, piiFields: Array.from(piiFields), candidateResponseFields: suggestions.filter(item => item.canonicalField === 'aiResponse').flatMap(item => item.candidates), candidateIdFields: suggestions.filter(item => item.canonicalField === 'caseId' || item.canonicalField === 'entityReferences').flatMap(item => item.candidates), mappingSuggestions: suggestions, warnings: [...adapterResult.errors, ...(duplicateRows ? [`${duplicateRows} duplicate row(s) detected.`] : []), ...(piiCandidateRows ? ['PII-like content detected; use synthetic/non-sensitive data only.'] : [])],
  };
}
