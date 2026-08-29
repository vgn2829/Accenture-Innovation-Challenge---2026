'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Activity, Users, AlertTriangle, UploadCloud } from 'lucide-react';

type EvaluationPayload = {
  metrics: {
    totalCases: number;
    criticalFalseReleaseRate: number | null;
    highImpactEscalationRecall: number | null;
    falseBlockRate: number | null;
    escalationRate: number | null;
    verificationCoverage: number | null;
    tierDistribution: { tier0: number; tier1: number; tier2: number };
    feedbackOverrides: number;
    feedbackCorrections: number;
    uncertainCases: number;
    source?: string;
  };
  evaluation: {
    corpus: { total: number; heldOutEvaluation: number; public: number; synthetic: number };
    metrics: {
      accuracy: number | null;
      falseReleaseRate: number | null;
      falseBlockRate: number | null;
      highImpactEscalationRecall: number | null;
      verificationCoverage: number | null;
      calibration: string;
    };
    policyComparison: Array<{ profile: string; tier: number; decision: string; state: string; budgetMs: number }>;
  } | null;
  feedback: Array<{ requestId: string; finalDecision: string; reviewerAction: string; timestamp: string }>;
};

const percent = (value: number | null) =>
  value === null ? 'NOT AVAILABLE' : `${(value * 100).toFixed(1)}%`;

export default function EvaluationPage() {
  const [data, setData] = useState<EvaluationPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/evaluation')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const metrics = data?.metrics;
  const evaluation = data?.evaluation;
  const hasEvaluation = evaluation !== null && evaluation !== undefined;

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* Header */}
        <section className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
            TRUST &amp; EVALUATION
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Measure the control loop, not just the dashboard.
          </h1>
          <p className="text-base text-[#555555] leading-relaxed">
            This page displays evaluation artifacts and audit feedback from actual runs.
            Synthetic cases are not customer traffic. Unavailable metrics remain explicitly unestablished.
          </p>
          <Link
            href="/evaluation/datasets"
            className="inline-flex items-center gap-2 rounded-full bg-[#141413] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#262627] transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            Open Dataset Lab
          </Link>
        </section>

        {/* Zero state — no evaluation run yet */}
        {!loading && !hasEvaluation && (
          <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-10 sm:p-14 text-center space-y-6 shadow-soft">
            <div className="w-14 h-14 rounded-full bg-[#F3F0EE] flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-[#888888]" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-[#888888]">NO EVALUATION RUN YET</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#141413]">
                No evaluation data available.
              </h2>
              <p className="text-sm text-[#696969] leading-relaxed">
                Upload an evaluation dataset to measure decision quality, false releases, false blocks,
                escalation behavior, and verification depth.
              </p>
            </div>
            <Link
              href="/evaluation/datasets"
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] text-white px-7 py-3 text-sm font-bold hover:bg-[#262627] transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="h-4 w-4" />
              Evaluate Your Data
            </Link>
          </section>
        )}

        {/* Metric tiles — only shown after a real evaluation run */}
        {hasEvaluation && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                ['Evaluation cases', `${evaluation!.corpus.total}`, `${evaluation!.corpus.heldOutEvaluation} held out`],
                ['False release', percent(evaluation!.metrics.falseReleaseRate), 'Critical rate'],
                ['Escalation recall', percent(evaluation!.metrics.highImpactEscalationRecall), 'High-impact held-out cases'],
                ['Feedback corrections', `${metrics?.feedbackCorrections ?? 0}`, `${metrics?.feedbackOverrides ?? 0} reviewer outcomes`],
              ] as [string, string, string][]).map(([label, value, detail]) => (
                <div key={label} className="rounded-3xl bg-white border border-[#E5E0DA] p-5 shadow-soft">
                  <span className="text-[10px] uppercase tracking-wider text-[#888888] block">{label}</span>
                  <span className="text-xl font-extrabold font-mono block mt-2">{value}</span>
                  <span className="text-[11px] text-[#696969] block mt-1">{detail}</span>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Verification behavior */}
              <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2E7D5B]" />
                  <h2 className="font-bold">Verification behavior</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([['Tier 0', metrics?.tierDistribution.tier0 ?? 0], ['Tier 1', metrics?.tierDistribution.tier1 ?? 0], ['Tier 2', metrics?.tierDistribution.tier2 ?? 0]] as [string, number][]).map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-4">
                      <span className="text-[10px] uppercase text-[#888888] block">{label}</span>
                      <span className="font-mono font-bold text-lg">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#696969]">
                  Audit DB coverage:{' '}
                  {metrics?.verificationCoverage == null ? 'NOT AVAILABLE' : `${metrics.verificationCoverage}%`}.
                  Calibration: {evaluation!.metrics.calibration ?? 'NOT RUN'}.
                </p>
              </div>

              {/* Use-case policy comparison */}
              <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#C84A12]" />
                  <h2 className="font-bold">Use-case policy comparison</h2>
                </div>
                {evaluation!.policyComparison.length > 0 ? (
                  evaluation!.policyComparison.map(row => (
                    <div key={row.profile} className="flex items-center justify-between rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3 text-xs">
                      <span className="font-bold uppercase">{row.profile.replaceAll('_', ' ')}</span>
                      <span className="font-mono">Tier {row.tier} &middot; {row.decision} &middot; {row.budgetMs}ms</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#696969]">Run the evaluation command to generate comparison data.</p>
                )}
              </div>
            </section>
          </>
        )}

        {/* Human feedback — always show if data is available */}
        <section className="rounded-[32px] bg-[#141413] text-[#F3F0EE] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F37338]" />
            <h2 className="font-bold">Human feedback</h2>
          </div>
          {data?.feedback.length ? (
            data.feedback.slice(0, 5).map(item => (
              <div key={item.requestId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#333333] pb-3 text-xs">
                <span className="font-mono text-[#A9A39B]">{item.requestId.slice(0, 18)}</span>
                <span>{item.reviewerAction} &rarr; {item.finalDecision}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#A9A39B]">
              No feedback events yet. Resolve an escalated case in Control Desk to create one.
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-[#A9A39B]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Feedback creates candidates for review. It never changes active policy automatically.
          </div>
        </section>
      </main>
    </div>
  );
}
