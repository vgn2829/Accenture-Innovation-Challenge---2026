import type { BusinessImpact, Decision, VerificationState } from '@/types';
import type { AdapterResult } from './adapters';
import type { CanonicalEvaluationCase, DatasetFieldMapping, DatasetProfile, DatasetValidation } from './types';

const decisions = new Set<Decision>(['RELEASE', 'EDIT', 'BLOCK', 'ESCALATE']);
const states = new Set<VerificationState>(['VERIFIED', 'CONFLICT', 'UNVERIFIED', 'NOT_APPLICABLE']);
const impacts = new Set<BusinessImpact>(['low', 'medium', 'high', 'critical']);

function text(value: unknown): string | undefined { return typeof value === 'string' ? value.normalize('NFKC').replace(/\s+/g, ' ').trim() : value === null || value === undefined ? undefined : String(value).normalize('NFKC').replace(/\s+/g, ' ').trim(); }
function jsonValue(value: unknown): unknown[] { if (Array.isArray(value)) return value; if (value && typeof value === 'object') return [value]; return value === undefined || value === null || value === '' ? [] : [value]; }
function arrayOfStrings(value: unknown): string[] { return jsonValue(value).flatMap(item => typeof item === 'string' ? [text(item) || ''] : item && typeof item === 'object' ? Object.values(item as Record<string, unknown>).flatMap(inner => typeof inner === 'string' ? [text(inner) || ''] : []) : []).filter(Boolean); }

export function normalizeAndMap(rows: Array<Record<string, unknown>>, adapterResult: AdapterResult, profile: DatasetProfile, mapping: DatasetFieldMapping): { cases: CanonicalEvaluationCase[]; validation: DatasetValidation } {
  const errors: string[] = [];
  const warnings = [...profile.warnings];
  const cases: CanonicalEvaluationCase[] = [];
  const fingerprints = new Set<string>();
  const aiResponseField = mapping.aiResponse;
  if (!aiResponseField || !profile.columns.includes(aiResponseField)) errors.push('A confirmed aiResponse mapping is required.');
  rows.forEach((row, index) => {
    const response = aiResponseField ? text(row[aiResponseField]) : undefined;
    if (!response) { errors.push(`Row ${index + 1}: missing aiResponse after mapping.`); return; }
    if (response.length > 100000) { errors.push(`Row ${index + 1}: aiResponse exceeds 100,000 characters.`); return; }
    const caseId = text(mapping.caseId ? row[mapping.caseId] : undefined) || `uploaded_${index + 1}`;
    const expectedDecisionRaw = text(mapping.expectedDecision ? row[mapping.expectedDecision] : undefined)?.toUpperCase();
    const expectedStateRaw = text(mapping.expectedVerificationState ? row[mapping.expectedVerificationState] : undefined)?.toUpperCase();
    const expectedDecision = expectedDecisionRaw && decisions.has(expectedDecisionRaw as Decision) ? expectedDecisionRaw as Decision : undefined;
    const expectedVerificationState = expectedStateRaw && states.has(expectedStateRaw as VerificationState) ? expectedStateRaw as VerificationState : undefined;
    const businessImpactRaw = text(mapping.businessImpact ? row[mapping.businessImpact] : undefined)?.toLowerCase();
    const businessImpact = businessImpactRaw && impacts.has(businessImpactRaw as BusinessImpact) ? businessImpactRaw as BusinessImpact : undefined;
    if (expectedDecisionRaw && !expectedDecision) warnings.push(`Row ${index + 1}: expected decision label is not recognized and was left unavailable.`);
    if (expectedStateRaw && !expectedVerificationState) warnings.push(`Row ${index + 1}: expected verification state is not recognized and was left unavailable.`);
    const normalizedValues: Record<string, unknown> = { aiResponse: response, prompt: text(mapping.prompt ? row[mapping.prompt] : undefined), caseId };
    const fingerprint = `${caseId}|${response}`;
    if (fingerprints.has(fingerprint)) warnings.push(`Row ${index + 1}: duplicate case fingerprint.`);
    fingerprints.add(fingerprint);
    cases.push({ caseId, source: 'USER_UPLOADED', useCase: undefined, prompt: normalizedValues.prompt as string | undefined, aiResponse: response, claimType: text(mapping.claimType ? row[mapping.claimType] : undefined), businessImpact, entityReferences: arrayOfStrings(mapping.entityReferences ? row[mapping.entityReferences] : undefined), evidence: mapping.evidence ? row[mapping.evidence] : undefined, conversation: jsonValue(mapping.conversation ? row[mapping.conversation] : undefined), toolCalls: jsonValue(mapping.toolCalls ? row[mapping.toolCalls] : undefined), labels: { expectedRiskFlags: mapping.expectedRiskFlags ? row[mapping.expectedRiskFlags] : undefined }, expectedDecision, expectedVerificationState, groundTruthStatus: expectedDecision || expectedVerificationState ? 'AVAILABLE' : 'UNAVAILABLE', rawValues: row, normalizedValues });
  });
  const validation: DatasetValidation = { valid: errors.length === 0 && cases.length > 0, errors: errors.slice(0, 50), warnings: warnings.slice(0, 100), acceptedRows: cases.length, rejectedRows: adapterResult.rows.length - cases.length + adapterResult.malformedRows, piiRows: profile.piiCandidateRows, duplicateRows: profile.duplicateRows, contaminationWarnings: [] };
  return { cases, validation };
}
