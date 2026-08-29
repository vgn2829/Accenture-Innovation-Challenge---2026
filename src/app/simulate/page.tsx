// ============================================================
// ControlPlane.ai — Editorial Scenario Simulator (Hero Experience)
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import { RiskMeter } from '@/components/RiskMeter';
import { VerificationPathStepper } from '@/components/VerificationPathStepper';
import { EvidenceCard } from '@/components/EvidenceCard';
import {
  Play,
  XCircle,
  RefreshCw,
  Zap,
  ExternalLink,
} from 'lucide-react';
import type { AnalyzeResponse, UseCaseProfileId } from '@/types';

interface ScenarioMeta {
  id: 'scenario-a' | 'scenario-b' | 'scenario-c' | 'scenario-d';
  letter: string;
  expectedDecision: 'RELEASE' | 'EDIT' | 'BLOCK' | 'ESCALATE';
  title: string;
  subtitle: string;
  prompt: string;
  response: string;
  highlightText: string;
  isHero?: boolean;
}

const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'scenario-a',
    letter: 'A',
    expectedDecision: 'RELEASE',
    title: 'Clean Banking Query',
    subtitle: 'Standard query with zero sensitive data or policy violations.',
    prompt: 'What are your standard bank branch operating hours?',
    response: 'Our retail bank branches are open Monday through Friday from 9:00 AM to 5:00 PM.',
    highlightText: 'Low risk → Tier 0 only → RELEASE',
  },
  {
    id: 'scenario-b',
    letter: 'B',
    expectedDecision: 'EDIT',
    title: 'Customer PII Leakage',
    subtitle: 'Customer phone number detected and automatically redacted.',
    prompt: 'Can you confirm the contact number on file for my account?',
    response: 'Your registered account phone number is +91-98765-43210. Please let me know if you need to update it.',
    highlightText: 'PII detected → Deterministic repair → Instant EDIT',
  },
  {
    id: 'scenario-c',
    letter: 'C',
    expectedDecision: 'BLOCK',
    title: '₹24,500 Refund Contradiction (Hero Case)',
    subtitle: 'AI hallucinates successful refund when enterprise database confirms rejection.',
    prompt: 'What is the status of my refund request for Order #98421?',
    response: 'Your refund of ₹24,500 for Order #98421 has been successfully processed to your account.',
    highlightText: 'Core DB confirms REJECTED → Factual Conflict → BLOCK',
    isHero: true,
  },
  {
    id: 'scenario-d',
    letter: 'D',
    expectedDecision: 'ESCALATE',
    title: 'Financial Edge Case & Ambiguity',
    subtitle: 'Ambiguous policy query flagged for human supervisor review.',
    prompt: 'Can I get an exception on my wire transfer fee for a $50,000 international transaction?',
    response: 'I might be able to offer a temporary discount or fee waiver for your international wire transfer.',
    highlightText: 'Policy uncertainty → Tier 1/2 → Escalate to Control Desk',
  },
];

export default function SimulatePage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMeta>(SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [profile, setProfile] = useState<UseCaseProfileId>('customer_support');

  const selectScenario = (scenario: ScenarioMeta) => {
    if (running) return;
    setSelectedScenario(scenario);
    setResult(null);
    setError(null);
    setActiveStep(0);
  };

  const runSimulation = async (scenario: ScenarioMeta) => {
    setSelectedScenario(scenario);
    setRunning(true);
    setResult(null);
    setError(null);
    setActiveStep(1);

    const stepTimer1 = setTimeout(() => setActiveStep(2), 300);
    const stepTimer2 = setTimeout(() => setActiveStep(3), 600);
    const stepTimer3 = setTimeout(() => setActiveStep(4), 900);

    try {
      const res = await fetch(`/api/simulate/${scenario.letter}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error('Simulation API returned an error');
      const data: AnalyzeResponse = await res.json();
      setActiveStep(5);
      setResult(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to execute simulation');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* ============================================================ */}
        {/* 1. HEADER SECTION                                            */}
        {/* ============================================================ */}
        <section className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
            <span>INTERACTIVE SCENARIO SIMULATOR</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#141413] leading-tight">
            Observe the four governance decisions in action.
          </h1>

          <p className="text-base text-[#555555] leading-relaxed">
            Select a scenario to see the claim, trusted evidence state, verification depth, and authoritative action in one trace. This is a local prototype demonstration, not a production benchmark.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Evaluate as</span>{(['customer_support', 'knowledge_assistant', 'decision_support'] as UseCaseProfileId[]).map(option => <button key={option} disabled={running} onClick={() => { setProfile(option); setResult(null); setError(null); setActiveStep(0); }} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all disabled:opacity-50 ${profile === option ? 'bg-[#141413] text-[#F3F0EE] border-[#141413]' : 'bg-white text-[#555555] border-[#E5E0DA]'}`}>{option.replaceAll('_', ' ')}</button>)}</div>
        </section>

        {/* ============================================================ */}
        {/* 2. SCENARIO SELECTOR (4 LARGE STADIUM CARDS)                 */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCENARIOS.map(sc => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => selectScenario(sc)}
                disabled={running}
                className={`text-left rounded-[32px] p-6 transition-all relative flex flex-col justify-between space-y-4 border ${
                  isSelected
                    ? sc.isHero
                      ? 'bg-[#141413] text-[#F3F0EE] border-[#141413] shadow-[0_24px_48px_rgba(20,20,19,0.12)] scale-[1.02]'
                      : 'bg-white border-[#141413] shadow-[0_12px_36px_rgba(0,0,0,0.08)] scale-[1.02]'
                    : 'bg-white/80 hover:bg-white border-[#E5E0DA] shadow-soft hover:border-[#C84A12]/40'
                }`}
              >
                {/* Top Row: Badge & Letter */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-mono ${
                        isSelected && sc.isHero
                          ? 'bg-[#C84A12] text-white'
                          : isSelected
                          ? 'bg-[#141413] text-[#F3F0EE]'
                          : 'bg-[#F3F0EE] text-[#555555]'
                      }`}
                    >
                      {sc.letter}
                    </span>
                    <DecisionBadge decision={sc.expectedDecision} size="sm" />
                  </div>
                  {sc.isHero && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C84A12] text-white">
                      HERO CASE
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1">
                  <h3
                    className={`text-sm font-bold leading-snug ${
                      isSelected && sc.isHero ? 'text-white' : 'text-[#141413]'
                    }`}
                  >
                    {sc.title}
                  </h3>
                  <p
                    className={`text-xs line-clamp-2 ${
                      isSelected && sc.isHero ? 'text-[#D1CDC7]' : 'text-[#696969]'
                    }`}
                  >
                    {sc.subtitle}
                  </p>
                </div>

                {/* Highlight Badge */}
                <div
                  className={`text-[11px] font-mono p-2.5 rounded-2xl border ${
                    isSelected && sc.isHero
                      ? 'bg-[#262627] border-[#333333] text-[#F37338]'
                      : 'bg-[#FCFBFA] border-[#ECE8E3] text-[#555555]'
                  }`}
                >
                  {sc.highlightText}
                </div>
              </button>
            );
          })}
        </section>

        {/* ============================================================ */}
        {/* 3. SIMULATION WORKSPACE                                      */}
        {/* ============================================================ */}
        <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-6 sm:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.04)] space-y-8">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ECE8E3]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-[#141413] text-[#F3F0EE]">
                  SCENARIO {selectedScenario.letter}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#141413]">
                  {selectedScenario.title}
                </h2>
              </div>
              <p className="text-xs text-[#696969]">{selectedScenario.subtitle}</p>
            </div>

            <button
              onClick={() => runSimulation(selectedScenario)}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#262627] text-[#F3F0EE] px-6 py-3 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0"
            >
              {running ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#F37338]" />
                  <span>Evaluating Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current text-[#F37338]" />
                  <span>Execute Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* 5-Step Pipeline Animation Bar */}
          <div className="rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#696969] font-medium">
              <span>Pipeline Execution Timeline</span>
              <span className="font-mono text-[11px]">
                {running ? `Running Step ${activeStep}/5` : result ? 'Pipeline Completed' : 'Awaiting Trigger'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
              {[
                '1. Intercept',
                '2. Tier 0 Scan',
                '3. Tier 1/2 Grounding',
                '4. Risk Fusion',
                '5. Authoritative Action',
              ].map((stepName, i) => {
                const stepNum = i + 1;
                const isCurrent = running && activeStep === stepNum;
                const isDone = !running && result ? true : activeStep > stepNum;
                return (
                  <div
                    key={stepNum}
                    className={`py-2 px-1 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#141413] text-[#F3F0EE] border-[#141413] animate-pulse'
                        : isDone
                        ? 'bg-[#E8F5EE] text-[#2E7D5B] border-[#A3D9C0]'
                        : 'bg-[#F3F0EE] text-[#888888] border-[#E5E0DA]'
                    }`}
                  >
                    {stepName}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. SCENARIO C HERO CALLOUT (WHEN SCENARIO C IS SELECTED)     */}
          {/* ============================================================ */}
          {selectedScenario.isHero && (
            <div className="rounded-3xl bg-[#FDF2F1] border border-[#F8A8A1] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B42318] font-bold text-sm">
                  <XCircle className="h-5 w-5" />
                  <span>HERO SCENARIO C: CONTRADICTION FLOW</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#B42318] text-white px-2.5 py-0.5 rounded-full uppercase">
                  CRITICAL HALLUCINATION
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#F8A8A1] space-y-1">
                  <span className="font-bold text-[#696969] uppercase tracking-wider block text-[11px]">
                    AI Claimed Output:
                  </span>
                  <p className="font-mono text-[#141413] font-semibold text-sm">
                    &quot;Your refund of ₹24,500 has been successfully processed.&quot;
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#F8A8A1] space-y-1">
                  <span className="font-bold text-[#B42318] uppercase tracking-wider block text-[11px]">
                    Core Database Ground Truth:
                  </span>
                  <p className="font-mono text-[#B42318] font-semibold text-sm">
                    status: REJECTED | orderId: #98421 | reason: Policy Expired
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#555555] bg-white/70 p-3 rounded-2xl border border-[#F8A8A1] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#B42318] shrink-0" />
                <span>
                  <strong className="text-[#B42318]">Outcome:</strong> Tier 2 EvidenceVerifier detects direct contradiction with enterprise records → Performance Risk 90 → Hard <strong>BLOCK</strong>.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. INTERACTIVE RESULTS CONTAINER                            */}
          {/* ============================================================ */}
          {error && (
            <div className="rounded-3xl bg-[#FDF2F1] border border-[#F8A8A1] p-6 text-sm text-[#B42318]">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-8 pt-6 border-t border-[#ECE8E3]">
              {/* Top Decision Hero Banner */}
              <div className="rounded-[32px] bg-[#FCFBFA] border border-[#E5E0DA] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-soft">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">
                      Authoritative Outcome:
                    </span>
                    <DecisionBadge decision={result.decision} size="lg" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#141413]">
                    {result.decisionReason}
                  </h3>
                  <p className="text-xs text-[#696969] font-mono">Request ID: {result.requestId}</p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-bold text-[#2E7D5B] bg-[#E8F5EE] px-3 py-1 rounded-full border border-[#A3D9C0]">
                    Total Latency: {result.latencyMs}ms
                  </span>
                  <span className="text-xs text-[#696969]">
                    Verification Tier: <strong className="text-[#141413]">Tier {result.verificationTier}</strong>
                  </span>
                  <Link
                    href={`/decisions/${result.requestId}`}
                    className="text-xs font-semibold text-[#C84A12] hover:underline flex items-center gap-1 mt-1"
                  >
                    View Full Audit Case File <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Decision contract: make the risk-adaptive proof visible without reading the audit JSON. */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Claim', result.claimType.replaceAll('_', ' ')],
                  ['Impact', result.risk.businessImpact],
                  ['Evidence state', result.verificationState.replaceAll('_', ' ')],
                  ['Verification', `Tier ${result.verificationTier}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#141413] text-[#F3F0EE] px-4 py-3 border border-[#333333]">
                    <span className="block text-[10px] uppercase tracking-wider text-[#A9A39B]">{label}</span>
                    <span className="block mt-1 text-xs sm:text-sm font-bold uppercase">{value}</span>
                  </div>
                ))}
              </div>

              {/* 4-Pillar Risk Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-4 shadow-xs">
                  <RiskMeter score={result.risk.composite} label="Composite Risk" size="lg" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-4 shadow-xs">
                  <RiskMeter score={result.risk.performance} label="Performance Risk" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-4 shadow-xs">
                  <RiskMeter score={result.risk.cost} label="Cost Waste Risk" />
                </div>
                <div className="rounded-3xl bg-white border border-[#E5E0DA] p-4 shadow-xs">
                  <RiskMeter score={result.risk.responsibility} label="Responsibility Risk" />
                </div>
              </div>

              {/* Side-by-Side Content Inspection (Raw AI vs Rendered Output) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Intercepted AI Output */}
                <div className="rounded-3xl bg-[#FCFBFA] border border-[#E5E0DA] p-6 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
                    Intercepted AI Output:
                  </span>
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E0DA] font-mono text-xs sm:text-sm text-[#141413] leading-relaxed">
                    {result.originalResponse}
                  </div>
                </div>

                {/* Rendered Business Output */}
                <div className="rounded-3xl bg-[#FCFBFA] border border-[#E5E0DA] p-6 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
                    Delivered User Output:
                  </span>
                  <div
                    className={`p-4 rounded-2xl border font-mono text-xs sm:text-sm leading-relaxed ${
                      result.decision === 'BLOCK'
                        ? 'bg-[#FDF2F1] border-[#F8A8A1] text-[#B42318]'
                        : result.decision === 'EDIT'
                        ? 'bg-[#EEF3FC] border-[#B5CEF7] text-[#3860BE]'
                        : result.decision === 'ESCALATE'
                        ? 'bg-[#FEF7EC] border-[#F7D29E] text-[#A45A00]'
                        : 'bg-[#E8F5EE] border-[#A3D9C0] text-[#2E7D5B]'
                    }`}
                  >
                    {result.decision === 'BLOCK'
                      ? '🛑 [RESPONSE BLOCKED: Output was blocked by ControlPlane due to factual contradiction with enterprise records]'
                      : result.decision === 'ESCALATE'
                      ? '⏳ [RESPONSE ESCALATED: Held for human supervisor review at Control Desk]'
                      : result.editedResponse || result.originalResponse}
                  </div>
                </div>
              </div>

              {/* Ground-Truth Evidence & Verification Stepper */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141413] block">
                    Ground-Truth Evidence Cross-Check:
                  </span>
                  <EvidenceCard evidence={result.evidence} hasConflict={result.decision === 'BLOCK'} />
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141413] block">
                    Adaptive Verification Path:
                  </span>
                  <div className="rounded-3xl bg-[#FCFBFA] border border-[#E5E0DA] p-5 shadow-xs">
                    <VerificationPathStepper path={result.verificationPath} highestTier={result.verificationTier} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
