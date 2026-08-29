// ============================================================
// ControlPlane.ai — Dataset Lab & Results Console (Page 6)
// ============================================================

'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import { RiskMeter } from '@/components/RiskMeter';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileUp,
  Play,
  Trash2,
  UploadCloud,
  Search,
  Filter,
  Eye,
  X,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import type {
  DatasetFieldMapping,
  DatasetProfile,
  DatasetRunResult,
  DatasetRunRow,
  MappingSuggestion,
} from '@/lib/dataset-lab/types';
import type { Decision, UseCaseProfileId } from '@/types';

type UploadResponse = {
  datasetId: string;
  profile: DatasetProfile;
  validation: {
    acceptedRows: number;
    rejectedRows: number;
    piiRows: number;
    duplicateRows: number;
    warnings: string[];
  };
  warning: string;
};

const canonicalLabels: Array<keyof DatasetFieldMapping> = [
  'caseId',
  'prompt',
  'aiResponse',
  'useCase',
  'claimType',
  'businessImpact',
  'entityReferences',
  'evidence',
  'conversation',
  'toolCalls',
  'expectedDecision',
  'expectedVerificationState',
  'expectedRiskFlags',
];

const STEPS = ['Ingest', 'Profile & Map', 'Configure', 'Run', 'Results'];

const percent = (value: number | null) =>
  value === null ? 'NOT ESTABLISHED' : `${(value * 100).toFixed(1)}%`;

export default function DatasetLabPage() {
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [mapping, setMapping] = useState<DatasetFieldMapping>({});
  const [profile, setProfile] = useState<UseCaseProfileId>('customer_support');
  const [mode, setMode] = useState<'adaptive' | 'deep'>('adaptive');
  const [splitName, setSplitName] = useState<'development' | 'validation' | 'evaluation'>('evaluation');
  const [result, setResult] = useState<DatasetRunResult | null>(null);
  const [comparisons, setComparisons] = useState<DatasetRunResult[]>([]);
  const [modeComparison, setModeComparison] = useState<DatasetRunResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter & Search states for Results Console
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | Decision>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<DatasetRunRow | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Current workflow step (0-indexed)
  const currentStep = result ? 4 : upload ? 2 : 0;

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setResult(null); // Clear previous result immediately
    setSelectedCase(null);
    setComparisons([]);
    setModeComparison([]);

    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch('/api/evaluation/datasets', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setUpload(data);
      const suggested: DatasetFieldMapping = {};
      for (const item of data.profile.mappingSuggestions as MappingSuggestion[]) {
        if (item.sourceField && !item.ambiguous) suggested[item.canonicalField] = item.sourceField;
      }
      setMapping(suggested);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const run = async (compareAll = false, compareModes = false) => {
    if (!upload) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/evaluation/datasets/${upload.datasetId}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mapping, profile, mode, splitName, compareAll, compareModes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.validation?.errors?.join('; ') || 'Evaluation failed');
      setResult(data.result);
      setComparisons(data.comparisons || []);
      setModeComparison(data.modeComparison || []);
      setDecisionFilter('ALL');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendFeedback = async (caseId: string, label: string) => {
    if (!upload || !result) return;
    const response = await fetch(`/api/evaluation/datasets/${upload.datasetId}/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ runId: result.runId, caseId, label }),
    });
    if (!response.ok) setError('Feedback could not be saved.');
    else setNotice(`Feedback (${label}) saved for human review.`);
  };

  const deleteDataset = async () => {
    if (!upload) return;
    const response = await fetch(`/api/evaluation/datasets/${upload.datasetId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Dataset could not be deleted.');
      return;
    }
    setUpload(null);
    setMapping({});
    setResult(null); setComparisons([]); setModeComparison([]);
    setSelectedCase(null);
    setNotice('Dataset removed.');
  };

  // Case list for results console (uses allRows, falls back to failures if empty)
  const allCases: DatasetRunRow[] = useMemo(() => {
    if (!result) return [];
    if (result.allRows && result.allRows.length > 0) return result.allRows;
    return result.failures || [];
  }, [result]);

  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      if (decisionFilter !== 'ALL' && c.predictedDecision !== decisionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = c.caseId.toLowerCase().includes(q);
        const matchReason = c.reason?.toLowerCase().includes(q);
        const matchResponse = c.originalResponse?.toLowerCase().includes(q);
        const matchState = c.predictedVerificationState?.toLowerCase().includes(q);
        return matchId || matchReason || matchResponse || matchState;
      }
      return true;
    });
  }, [allCases, decisionFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Header */}
        <section className="max-w-3xl space-y-4">
          <Link href="/evaluation" className="text-xs font-semibold text-[#C84A12] hover:underline">
            &larr; Trust &amp; Evaluation
          </Link>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
            DATASET LAB
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bring your data. Measure the control loop.
          </h1>
          <p className="text-base text-[#555555] leading-relaxed">
            Upload an evaluation dataset to evaluate how ControlPlane makes decisions, inspects evidence, and applies
            governance policies.
          </p>
          <div className="rounded-2xl bg-[#FEF7EC] border border-[#F7D29E] p-3 text-xs text-[#8A4B00] flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Prototype Dataset Lab. Uploaded rows are marked
              <strong className="ml-1">USER_UPLOADED</strong> and never become trusted evidence.
            </span>
          </div>
        </section>

        {/* Workflow progress bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap px-3 py-1.5 rounded-full border transition-all ${
                  i === currentStep
                    ? 'bg-[#141413] text-white border-[#141413]'
                    : i < currentStep
                    ? 'bg-[#E8F5EE] text-[#2E7D5B] border-[#A3D9C0]'
                    : 'bg-white text-[#888888] border-[#E5E0DA]'
                }`}
              >
                {i < currentStep && <CheckCircle2 className="h-3 w-3" />}
                <span>
                  {i + 1}. {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 min-w-[12px] ${i < currentStep ? 'bg-[#A3D9C0]' : 'bg-[#E5E0DA]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Status messages */}
        {error && (
          <div className="rounded-2xl bg-[#FDF2F1] border border-[#F8A8A1] p-4 text-sm text-[#B42318]" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-2xl bg-[#E8F5EE] border border-[#A3D9C0] p-4 text-sm text-[#2E7D5B]" role="status">
            {notice}
          </div>
        )}

        {/* Step 1: Ingest */}
        <section className="rounded-[36px] bg-white border border-[#E5E0DA] p-6 sm:p-8 space-y-6 shadow-soft">
          <div className="flex items-center gap-3">
            <FileUp className="h-5 w-5 text-[#C84A12]" />
            <div>
              <h2 className="font-bold text-base">1. Ingest</h2>
              <p className="text-xs text-[#696969]">CSV, JSON, or JSONL format. Maximum 2 MB and 5,000 rows.</p>
            </div>
          </div>

          {!upload ? (
            <div className="space-y-4">
              <div className="rounded-3xl border-2 border-dashed border-[#E5E0DA] bg-[#FCFBFA] p-12 text-center space-y-3">
                <UploadCloud className="h-10 w-10 text-[#C84A12] mx-auto" />
                <div>
                  <p className="text-base font-bold text-[#141413]">NO DATASET LOADED</p>
                  <p className="text-xs text-[#696969] mt-1">
                    Supported formats: <strong>CSV</strong>, <strong>JSON</strong>, <strong>JSONL</strong>
                  </p>
                  <p className="text-xs text-[#696969]">
                    Limits: <strong>2 MB</strong> file size, <strong>5,000 rows</strong> maximum
                  </p>
                  <p className="text-xs text-[#A45A00] mt-2 font-medium">Use synthetic or non-sensitive data only.</p>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#262627] text-[#F3F0EE] px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02]">
                  <FileUp className="h-4 w-4" />
                  <span>Choose evaluation file</span>
                  <input
                    type="file"
                    accept=".csv,.json,.jsonl,application/json,text/csv"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#E8F5EE] border border-[#A3D9C0] p-3 text-xs text-[#2E7D5B] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">File loaded:</span>
                  <span className="font-mono">{upload.profile.fileName}</span>
                </div>
                <button
                  onClick={deleteDataset}
                  className="text-xs text-[#B42318] hover:underline font-semibold flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove dataset</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {(
                  [
                    ['Rows', upload.profile.rowCount],
                    ['Valid', upload.profile.validRows],
                    ['Malformed', upload.profile.malformedRows],
                    ['Duplicates', upload.profile.duplicateRows],
                    ['PII rows', upload.profile.piiCandidateRows],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3">
                    <span className="block text-[10px] uppercase text-[#888888]">{label}</span>
                    <span className="font-mono font-bold text-lg">{value}</span>
                  </div>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#555555] hover:text-[#141413] cursor-pointer transition-colors">
                <FileUp className="h-3.5 w-3.5" />
                <span>Upload a different file</span>
                <input
                  type="file"
                  accept=".csv,.json,.jsonl,application/json,text/csv"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          )}
          {busy && <p className="text-xs text-[#696969] animate-pulse">Processing file...</p>}
        </section>

        {/* Step 2: Profile, map, and validate & Step 3: Run */}
        {upload && (
          <section className="rounded-[36px] bg-white border border-[#E5E0DA] p-6 sm:p-8 space-y-6 shadow-soft">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-[#3860BE]" />
              <div>
                <h2 className="font-bold text-base">2. Profile, map, and validate</h2>
                <p className="text-xs text-[#696969]">
                  High-confidence suggestions are pre-selected. Ambiguous fields need confirmation.
                </p>
              </div>
            </div>

            {/* Field mapping grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {canonicalLabels.map((field) => {
                const suggestion = upload.profile.mappingSuggestions.find((item) => item.canonicalField === field);
                return (
                  <label key={field} className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3 text-xs">
                    <span className="block text-[10px] uppercase text-[#888888] mb-1">{field}</span>
                    <select
                      value={mapping[field] || ''}
                      onChange={(e) => {
                        setMapping((curr) => ({ ...curr, [field]: e.target.value || undefined }));
                        setResult(null);
                        setComparisons([]);
                        setModeComparison([]);
                      }}
                      className="w-full bg-transparent font-mono text-xs outline-none"
                    >
                      <option value="">Not mapped</option>
                      {upload.profile.columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                          {suggestion?.sourceField === column ? ` (${suggestion.confidence})` : ''}
                        </option>
                      ))}
                    </select>
                    {suggestion?.ambiguous && (
                      <span className="text-[10px] text-[#A45A00]">
                        Ambiguous: {suggestion.candidates.join(', ')}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Profile + run controls */}
            <div className="pt-4 border-t border-[#ECE8E3] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888]">3. Configure and run</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase text-[#888888]">Profile</span>
                {(['customer_support', 'knowledge_assistant', 'decision_support'] as UseCaseProfileId[]).map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setProfile(option);
                        setResult(null);
                        setComparisons([]);
                        setModeComparison([]);
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                        profile === option
                          ? 'bg-[#141413] text-white border-[#141413]'
                          : 'bg-white border-[#E5E0DA] text-[#555555]'
                      }`}
                    >
                      {option.replaceAll('_', ' ')}
                    </button>
                  )
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={splitName}
                  onChange={(e) => {
                    setSplitName(e.target.value as typeof splitName);
                    setResult(null);
                    setComparisons([]);
                    setModeComparison([]);
                  }}
                  className="rounded-full border border-[#E5E0DA] px-3 py-1.5 text-xs bg-white"
                >
                  <option value="development">Development 80%</option>
                  <option value="validation">Validation 10%</option>
                  <option value="evaluation">Evaluation 10%</option>
                </select>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as 'adaptive' | 'deep');
                    setResult(null);
                    setComparisons([]);
                    setModeComparison([]);
                  }}
                  className="rounded-full border border-[#E5E0DA] px-3 py-1.5 text-xs bg-white"
                >
                  <option value="adaptive">Risk-adaptive</option>
                  <option value="deep">Deep (every case)</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={busy || !mapping.aiResponse}
                  onClick={() => run(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#141413] text-white px-5 py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-[#262627] transition-all"
                >
                  <Play className="h-3.5 w-3.5" />
                  {busy ? 'Running...' : 'Run evaluation'}
                </button>
                <button
                  disabled={busy || !mapping.aiResponse}
                  onClick={() => run(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#141413] px-4 py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-[#F3F0EE] transition-all"
                >
                  Compare profiles
                </button>
                <button
                  disabled={busy || !mapping.aiResponse}
                  onClick={() => run(false, true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#C84A12] text-[#C84A12] px-4 py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-[#FDF2F1] transition-all"
                >
                  Compare modes
                </button>
              </div>
              {!mapping.aiResponse && (
                <p className="text-xs text-[#A45A00]">
                  Map the <strong>aiResponse</strong> field above to enable evaluation.
                </p>
              )}
              {upload.validation.warnings?.length > 0 && (
                <p className="text-xs text-[#A45A00]">{upload.validation.warnings.slice(0, 3).join(' ')}</p>
              )}
            </div>
          </section>
        )}

        {/* Step 4: RESULTS CONSOLE */}
        {result && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in duration-300">
            {/* Top Section: EVALUATION COMPLETE Banner */}
            <section className="rounded-[40px] bg-[#141413] text-[#F3F0EE] p-8 sm:p-10 shadow-soft space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333333] pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F37338]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F37338]" />
                    EVALUATION COMPLETE
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
                    {result.profile.replaceAll('_', ' ')} &middot; {result.mode}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#A9A39B] bg-[#262627] px-3 py-1.5 rounded-full">
                    {result.timestamp.slice(0, 19).replace('T', ' ')} UTC
                  </span>
                </div>
              </div>

              {/* Provenance & Config Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Dataset</span>
                  <span className="block font-mono font-bold truncate mt-0.5">{result.fileName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Cases</span>
                  <span className="block font-mono font-bold mt-0.5">
                    {result.caseCount} ({result.splitName})
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Profile</span>
                  <span className="block font-bold uppercase truncate mt-0.5">
                    {result.profile.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Policy</span>
                  <span className="block font-mono font-bold truncate mt-0.5">{result.policyVersion}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Source</span>
                  <span className="block font-bold uppercase text-[#F37338] mt-0.5">{result.trustClass}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#262627]">
                  <span className="block text-[10px] uppercase text-[#A9A39B]">Ground Truth</span>
                  <span className="block font-bold mt-0.5">
                    {result.labeledCount > 0 ? `${result.labeledCount} Labeled` : 'Unlabeled'}
                  </span>
                </div>
              </div>

              {/* Prominent Four Action Counters (Clickable Filters) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#A9A39B]">
                  <span>Decision Distribution (Click to filter)</span>
                  <span>Total: {result.caseCount}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* RELEASE */}
                  <button
                    onClick={() => setDecisionFilter(decisionFilter === 'RELEASE' ? 'ALL' : 'RELEASE')}
                    className={`rounded-3xl p-5 text-left transition-all border ${
                      decisionFilter === 'RELEASE'
                        ? 'bg-[#2E7D5B] text-white border-white ring-2 ring-white/50 scale-[1.02]'
                        : 'bg-[#1E2E25] text-[#A3D9C0] border-[#2E7D5B]/40 hover:border-[#2E7D5B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">RELEASE</span>
                      <span className="h-2 w-2 rounded-full bg-[#2E7D5B]" />
                    </div>
                    <span className="block text-3xl sm:text-4xl font-extrabold font-mono mt-2">
                      {result.decisionDistribution?.RELEASE ?? 0}
                    </span>
                    <span className="text-[11px] opacity-80 block mt-1">Verified / Low Risk</span>
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => setDecisionFilter(decisionFilter === 'EDIT' ? 'ALL' : 'EDIT')}
                    className={`rounded-3xl p-5 text-left transition-all border ${
                      decisionFilter === 'EDIT'
                        ? 'bg-[#3860BE] text-white border-white ring-2 ring-white/50 scale-[1.02]'
                        : 'bg-[#1E2638] text-[#B5CEF7] border-[#3860BE]/40 hover:border-[#3860BE]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">EDIT</span>
                      <span className="h-2 w-2 rounded-full bg-[#3860BE]" />
                    </div>
                    <span className="block text-3xl sm:text-4xl font-extrabold font-mono mt-2">
                      {result.decisionDistribution?.EDIT ?? 0}
                    </span>
                    <span className="text-[11px] opacity-80 block mt-1">Automated Redaction</span>
                  </button>

                  {/* BLOCK */}
                  <button
                    onClick={() => setDecisionFilter(decisionFilter === 'BLOCK' ? 'ALL' : 'BLOCK')}
                    className={`rounded-3xl p-5 text-left transition-all border ${
                      decisionFilter === 'BLOCK'
                        ? 'bg-[#B42318] text-white border-white ring-2 ring-white/50 scale-[1.02]'
                        : 'bg-[#381E1E] text-[#F8A8A1] border-[#B42318]/40 hover:border-[#B42318]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">BLOCK</span>
                      <span className="h-2 w-2 rounded-full bg-[#B42318]" />
                    </div>
                    <span className="block text-3xl sm:text-4xl font-extrabold font-mono mt-2">
                      {result.decisionDistribution?.BLOCK ?? 0}
                    </span>
                    <span className="text-[11px] opacity-80 block mt-1">Conflict / Prohibited</span>
                  </button>

                  {/* ESCALATE */}
                  <button
                    onClick={() => setDecisionFilter(decisionFilter === 'ESCALATE' ? 'ALL' : 'ESCALATE')}
                    className={`rounded-3xl p-5 text-left transition-all border ${
                      decisionFilter === 'ESCALATE'
                        ? 'bg-[#C84A12] text-white border-white ring-2 ring-white/50 scale-[1.02]'
                        : 'bg-[#38261E] text-[#F7D29E] border-[#C84A12]/40 hover:border-[#C84A12]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">ESCALATE</span>
                      <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
                    </div>
                    <span className="block text-3xl sm:text-4xl font-extrabold font-mono mt-2">
                      {result.decisionDistribution?.ESCALATE ?? 0}
                    </span>
                    <span className="text-[11px] opacity-80 block mt-1">Human Review Required</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Decision Table & Case List */}
            <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE8E3] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                    <span>Evaluated Cases</span>
                    <span className="text-xs font-mono font-normal text-[#696969]">
                      ({filteredCases.length} of {allCases.length})
                    </span>
                  </h3>
                  <p className="text-xs text-[#696969] mt-0.5">
                    Inspect individual case governance, risk factors, verification state, and decision reasons.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                    <input
                      type="text"
                      placeholder="Search case ID or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-full border border-[#E5E0DA] bg-[#FCFBFA] pl-8 pr-4 py-1.5 text-xs text-[#141413] placeholder-[#888888] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[#FCFBFA] border border-[#E5E0DA] p-1 rounded-full text-[11px]">
                    {(['ALL', 'RELEASE', 'EDIT', 'BLOCK', 'ESCALATE'] as Array<'ALL' | Decision>).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDecisionFilter(opt)}
                        className={`px-3 py-1 rounded-full font-semibold transition-all ${
                          decisionFilter === opt
                            ? 'bg-[#141413] text-white shadow-xs'
                            : 'text-[#555555] hover:text-[#141413]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table of cases */}
              {filteredCases.length === 0 ? (
                <div className="p-12 text-center space-y-2 rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <Filter className="h-6 w-6 text-[#888888] mx-auto" />
                  <p className="text-xs font-bold text-[#141413]">No cases match current filter</p>
                  <button
                    onClick={() => {
                      setDecisionFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#C84A12] hover:underline font-semibold"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#ECE8E3] text-[#888888] uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Case</th>
                        <th className="py-3 px-3">Impact</th>
                        <th className="py-3 px-3">Tier</th>
                        <th className="py-3 px-3">Verification State</th>
                        <th className="py-3 px-3">Risk</th>
                        <th className="py-3 px-3">Decision</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE8E3]">
                      {filteredCases.slice(0, 100).map((c) => (
                        <tr key={c.caseId} className="hover:bg-[#FCFBFA] transition-colors group">
                          <td className="py-3 px-3 font-mono font-semibold">
                            <span className="text-[#141413]">{c.caseId}</span>
                            {c.predictedDecision === 'ESCALATE' && (
                              <span className="ml-2 inline-block text-[9px] font-bold text-[#C84A12] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#F7D29E]">
                                HUMAN REVIEW REQUIRED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-semibold uppercase text-[10px] ${
                                c.risk.businessImpact === 'high' || c.risk.businessImpact === 'critical'
                                  ? 'text-[#B42318]'
                                  : 'text-[#555555]'
                              }`}
                            >
                              {c.risk.businessImpact}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">Tier {c.verificationTier}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.predictedVerificationState === 'VERIFIED'
                                  ? 'bg-[#E8F5EE] text-[#2E7D5B]'
                                  : c.predictedVerificationState === 'CONFLICT'
                                  ? 'bg-[#FDF2F1] text-[#B42318]'
                                  : c.predictedVerificationState === 'UNVERIFIED'
                                  ? 'bg-[#FEF7EC] text-[#A45A00]'
                                  : 'bg-[#F3F0EE] text-[#696969]'
                              }`}
                            >
                              {c.predictedVerificationState}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">{c.risk.composite}</td>
                          <td className="py-3 px-3">
                            <DecisionBadge decision={c.predictedDecision} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="inline-flex items-center gap-1 rounded-full bg-[#141413] hover:bg-[#262627] text-white px-3 py-1 text-[11px] font-semibold transition-all group-hover:scale-105"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCases.length > 100 && (
                    <p className="text-[11px] text-[#888888] text-center pt-3">
                      Showing first 100 cases of {filteredCases.length}.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Trust & Quality Metrics Section */}
            <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#2E7D5B]" />
                <div>
                  <h3 className="font-bold text-base">Trust &amp; Quality Metrics</h3>
                  <p className="text-xs text-[#696969]">
                    Strict ground-truth calculations. Missing labels are explicitly labeled NOT ESTABLISHED.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="block text-[10px] uppercase text-[#888888]">Accuracy</span>
                  <span className="block text-xl font-extrabold font-mono mt-1">
                    {percent(result.metrics.accuracy)}
                  </span>
                  <span className="text-[10px] text-[#696969] block mt-0.5">Labeled subset</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="block text-[10px] uppercase text-[#888888]">False Release</span>
                  <span className="block text-xl font-extrabold font-mono mt-1 text-[#B42318]">
                    {percent(result.metrics.falseReleaseRate)}
                  </span>
                  <span className="text-[10px] text-[#696969] block mt-0.5">Critical safety rate</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="block text-[10px] uppercase text-[#888888]">False Block</span>
                  <span className="block text-xl font-extrabold font-mono mt-1 text-[#A45A00]">
                    {percent(result.metrics.falseBlockRate)}
                  </span>
                  <span className="text-[10px] text-[#696969] block mt-0.5">Availability impact</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="block text-[10px] uppercase text-[#888888]">Escalation Recall</span>
                  <span className="block text-xl font-extrabold font-mono mt-1 text-[#3860BE]">
                    {percent(result.metrics.escalationRecall)}
                  </span>
                  <span className="text-[10px] text-[#696969] block mt-0.5">High-impact coverage</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-[#ECE8E3] pt-4">
                <div>
                  p50 Latency: <strong className="font-mono">{result.latency.p50Ms?.toFixed(1) ?? 'N/A'}ms</strong>
                </div>
                <div>
                  p95 Latency: <strong className="font-mono">{result.latency.p95Ms?.toFixed(1) ?? 'N/A'}ms</strong>
                </div>
                <div>
                  Semantic Evaluator Invocations:{' '}
                  <strong className="font-mono">{result.evaluatorInvocationCount}</strong>
                </div>
              </div>
            </section>

            {/* Profile & Mode Comparisons */}
            {comparisons.length > 1 && (
              <section className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#C84A12]" />
                  <h3 className="font-bold text-sm">Cross-Profile Comparison</h3>
                </div>
                <div className="space-y-2">
                  {comparisons.map((item) => (
                    <div
                      key={item.runId}
                      className="flex items-center justify-between text-xs border-b border-[#ECE8E3] pb-2"
                    >
                      <span className="font-bold uppercase">{item.profile.replaceAll('_', ' ')}</span>
                      <span>
                        Tier 2: {item.tierDistribution.tier2} &middot; False Release:{' '}
                        {percent(item.metrics.falseReleaseRate)} &middot; Escalations:{' '}
                        {item.decisionDistribution?.ESCALATE ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {modeComparison.length > 1 && (
              <section className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#3860BE]" />
                  <h3 className="font-bold text-sm">Risk-Adaptive vs Deep Mode</h3>
                </div>
                <div className="space-y-2">
                  {modeComparison.map((item) => (
                    <div
                      key={item.runId}
                      className="flex items-center justify-between text-xs border-b border-[#ECE8E3] pb-2"
                    >
                      <span className="font-bold uppercase">{item.mode}</span>
                      <span>
                        Evaluator calls: {item.evaluatorInvocationCount} &middot; p95:{' '}
                        {item.latency.p95Ms?.toFixed(1) ?? 'N/A'}ms &middot; Tier 2: {item.tierDistribution.tier2}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Case Inspection Drawer / Modal */}
        {selectedCase && (
          <div className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[36px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E0DA] animate-in zoom-in-95 duration-200"
              role="dialog"
              aria-labelledby="inspect-case-title"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#ECE8E3] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141413] text-white">
                      INSPECT CASE
                    </span>
                    <span className="font-mono text-xs text-[#696969]">{selectedCase.caseId}</span>
                  </div>
                  <h3 id="inspect-case-title" className="text-xl font-extrabold text-[#141413] mt-1">
                    {selectedCase.reason || 'Decision Inspection'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-2 rounded-full bg-[#F3F0EE] hover:bg-[#E5E0DA] text-[#141413] transition-colors"
                  aria-label="Close inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Decision & Verification Highlight */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                <div>
                  <span className="block text-[10px] uppercase text-[#888888]">ControlPlane Decision</span>
                  <div className="mt-1">
                    <DecisionBadge decision={selectedCase.predictedDecision} size="md" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-[#888888]">Verification</span>
                  <span className="text-xs font-bold">
                    Tier {selectedCase.verificationTier} &middot; {selectedCase.predictedVerificationState}
                  </span>
                </div>
              </div>

              {/* Risk Breakdown Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block">Risk Vectors</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                    <RiskMeter score={selectedCase.risk.composite} label="Composite" size="sm" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                    <RiskMeter score={selectedCase.risk.performance} label="Performance" size="sm" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                    <RiskMeter score={selectedCase.risk.cost} label="Cost" size="sm" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                    <RiskMeter score={selectedCase.risk.responsibility} label="Responsibility" size="sm" />
                  </div>
                </div>
              </div>

              {/* AI Content Inspection */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block">AI Output</span>
                <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] font-mono text-xs leading-relaxed text-[#141413]">
                  {selectedCase.originalResponse}
                </div>
              </div>

              {/* Decision Reason & Policy */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block">
                  Why ControlPlane made this decision:
                </span>
                <div className="p-4 rounded-2xl bg-[#FEF7EC] border border-[#F7D29E] text-xs text-[#8A4B00] leading-relaxed">
                  <p className="font-semibold">{selectedCase.reason}</p>
                  <p className="mt-1 text-[11px] opacity-90">
                    Policy: {selectedCase.policyVersion} &middot; Evidence Source: {selectedCase.evidenceSource}
                  </p>
                </div>
              </div>

              {/* Human Feedback Tagging */}
              <div className="pt-2 border-t border-[#ECE8E3] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#888888] block">
                  Tag Feedback for Governance Review:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['CORRECT', 'FALSE_POSITIVE', 'FALSE_NEGATIVE', 'WRONG_ESCALATION'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        sendFeedback(selectedCase.caseId, tag);
                        setSelectedCase(null);
                      }}
                      className="rounded-full border border-[#E5E0DA] bg-[#FCFBFA] hover:bg-[#141413] hover:text-white px-3 py-1 text-[11px] font-semibold transition-all"
                    >
                      {tag.replaceAll('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="rounded-full bg-[#141413] text-white px-5 py-2 text-xs font-bold hover:bg-[#262627] transition-all"
                >
                  Close Case Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
