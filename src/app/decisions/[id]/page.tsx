// ============================================================
// ControlPlane.ai — Editorial Decision Detail Case File (Page 4)
// ============================================================

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import { RiskMeter } from '@/components/RiskMeter';
import { VerificationPathStepper } from '@/components/VerificationPathStepper';
import { EvidenceCard } from '@/components/EvidenceCard';
import {
  ArrowLeft,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Copy,
  Check,
} from 'lucide-react';
import type { AnalyzeResponse } from '@/types';

export default function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [decision, setDecision] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/decisions/${id}`);
        if (!res.ok) throw new Error(`Decision case ${id} not found`);
        const data = await res.json();
        if (!ignore) {
          setDecision(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const copyAuditLog = () => {
    if (!decision) return;
    navigator.clipboard.writeText(JSON.stringify(decision.auditEvent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Breadcrumb / Back Link */}
        <div>
          <Link
            href="/decisions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#696969] hover:text-[#141413] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Decisions Feed</span>
          </Link>
        </div>

        {error && (
          <div className="rounded-3xl bg-[#FDF2F1] border border-[#F8A8A1] p-8 text-center space-y-3">
            <AlertOctagon className="h-8 w-8 text-[#B42318] mx-auto" />
            <h2 className="text-lg font-bold text-[#B42318]">Case File Not Found</h2>
            <p className="text-xs text-[#696969]">{error}</p>
          </div>
        )}

        {loading && !error && (
          <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-16 text-center text-xs text-[#696969] animate-pulse">
            Loading governance case file {id}...
          </div>
        )}

        {decision && (
          <div className="space-y-10">
            {/* ============================================================ */}
            {/* 1. CASE FILE HERO HEADER                                     */}
            {/* ============================================================ */}
            <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 sm:p-12 shadow-[0_24px_48px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE8E3] pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#141413] text-[#F3F0EE]">
                      CASE FILE
                    </span>
                    <span className="font-mono text-xs text-[#696969]">{decision.requestId}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#141413]">
                    {decision.decisionReason}
                  </h1>
                </div>

                <div className="shrink-0">
                  <DecisionBadge decision={decision.decision} size="lg" />
                </div>
              </div>

              {/* Metadata Attributes Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">Model</span>
                  <span className="font-mono font-bold text-[#141413]">{decision.model}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">Task Type</span>
                  <span className="font-bold text-[#141413] uppercase">{decision.taskType}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">Impact</span>
                  <span className="font-bold text-[#C84A12] uppercase">{decision.risk?.businessImpact || 'medium'}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">Latency</span>
                  <span className="font-mono font-bold text-[#2E7D5B]">{decision.latencyMs}ms (Tier {decision.verificationTier})</span>
                </div>
              </div>

              <div className="rounded-3xl bg-[#141413] text-[#F3F0EE] p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Claim type', decision.claimType.replaceAll('_', ' ')],
                  ['Evidence state', decision.verificationState.replaceAll('_', ' ')],
                  ['Verification', `Tier ${decision.verificationTier}`],
                  ['Profile', decision.profile.replaceAll('_', ' ')],
                  ['Policy', decision.policyVersion],
                  ['Evidence source', decision.evidenceSource.replaceAll('_', ' ')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="block text-[10px] uppercase tracking-wider text-[#A9A39B]">{label}</span>
                    <span className="block mt-1 text-xs sm:text-sm font-bold uppercase">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ============================================================ */}
            {/* 2. RISK VECTORS BREAKDOWN                                    */}
            {/* ============================================================ */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
                <span>Evaluated Risk Vectors</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-5 shadow-soft">
                  <RiskMeter score={decision.risk.composite} label="Composite Risk" size="lg" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-5 shadow-soft">
                  <RiskMeter score={decision.risk.performance} label="Performance Risk" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-5 shadow-soft">
                  <RiskMeter score={decision.risk.cost} label="Cost Waste Risk" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-5 shadow-soft">
                  <RiskMeter score={decision.risk.responsibility} label="Responsibility Risk" />
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* 3. AI OUTPUT VS DELIVERED OUTPUT                             */}
            {/* ============================================================ */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
                <span>Content Inspection</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-2 shadow-soft">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
                    Original AI Response:
                  </span>
                  <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] font-mono text-xs sm:text-sm text-[#141413] leading-relaxed">
                    {decision.originalResponse}
                  </div>
                </div>

                <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-2 shadow-soft">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
                    Governed / Delivered Output:
                  </span>
                  <div
                    className={`p-4 rounded-2xl border font-mono text-xs sm:text-sm leading-relaxed ${
                      decision.decision === 'BLOCK'
                        ? 'bg-[#FDF2F1] border-[#F8A8A1] text-[#B42318]'
                        : decision.decision === 'EDIT'
                        ? 'bg-[#EEF3FC] border-[#B5CEF7] text-[#3860BE]'
                        : decision.decision === 'ESCALATE'
                        ? 'bg-[#FEF7EC] border-[#F7D29E] text-[#A45A00]'
                        : 'bg-[#E8F5EE] border-[#A3D9C0] text-[#2E7D5B]'
                    }`}
                  >
                    {decision.decision === 'BLOCK'
                      ? '🛑 [RESPONSE BLOCKED: Output was blocked by ControlPlane due to factual contradiction with enterprise records]'
                      : decision.decision === 'ESCALATE'
                      ? '⏳ [RESPONSE ESCALATED: Held for human supervisor review at Control Desk]'
                      : decision.editedResponse || decision.originalResponse}
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* 4. GROUND-TRUTH EVIDENCE & VERIFICATION PATH                */}
            {/* ============================================================ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
                  <span>Ground-Truth Verification Evidence</span>
                </h2>
                <EvidenceCard evidence={decision.evidence} hasConflict={decision.detections.some(d => d.type === 'FACTUAL_CONFLICT')} />
              </div>

              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
                  <span>Adaptive Verification Path</span>
                </h2>
                <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 shadow-soft">
                  <VerificationPathStepper path={decision.verificationPath} highestTier={decision.verificationTier} />
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* 5. COLLAPSIBLE TECHNICAL AUDIT LOG                           */}
            {/* ============================================================ */}
            <section className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 shadow-soft space-y-4">
              <div
                onClick={() => setShowRawJson(!showRawJson)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#C84A12]" />
                  <h3 className="text-sm font-bold text-[#141413]">Canonical Audit Event</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#696969]">
                  <span>{showRawJson ? 'Hide' : 'Show'} Audit JSON</span>
                  {showRawJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {showRawJson && (
                <div className="space-y-3 pt-3 border-t border-[#ECE8E3]">
                  <div className="flex items-center justify-between text-xs text-[#696969]">
                    <span className="font-mono">Request ID: {decision.requestId}</span>
                    <button
                      onClick={copyAuditLog}
                      className="flex items-center gap-1 text-xs font-semibold text-[#C84A12] hover:underline"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-[#2E7D5B]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#141413] text-[#F3F0EE] font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed">
                    {JSON.stringify(decision.auditEvent, null, 2)}
                  </pre>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
