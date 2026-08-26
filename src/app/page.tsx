// ============================================================
// ControlPlane.ai — Editorial Overview Command Center (Page 1: /)
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Database,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Bot,
  Activity,
} from 'lucide-react';
import type { DashboardMetrics } from '@/types';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to load metrics from ControlPlane API');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error('Failed to load metrics from ControlPlane API');
        const data = await res.json();
        if (!ignore) {
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const total = metrics?.totalDecisions || 0;
  const breakdown = metrics?.breakdown || { RELEASE: 0, EDIT: 0, BLOCK: 0, ESCALATE: 0 };
  const tierDist = metrics?.tierDistribution || { tier0: 0, tier1: 0, tier2: 0 };

  const getPercent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16 sm:space-y-24">
        {/* ============================================================ */}
        {/* 1. HERO NARRATIVE SECTION                                     */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden pt-4 sm:pt-8 pb-4">
          {/* Ghost Watermark Background Text */}
          <div className="absolute -top-12 -left-8 text-[120px] sm:text-[180px] font-black text-[#E8E2DA] select-none pointer-events-none opacity-60 leading-none">
            CONTROL
          </div>

          <div className="relative z-10 space-y-6 max-w-3xl">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C84A12]">
              <span className="h-2 w-2 rounded-full bg-[#C84A12]" />
              <span>RUNTIME AI GOVERNANCE</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#141413] leading-[1.05]">
              Every AI response deserves the right level of scrutiny.
            </h1>

            {/* Body Copy */}
            <p className="text-base sm:text-lg text-[#555555] font-normal leading-relaxed max-w-2xl">
              ControlPlane sits directly between AI models and business systems. It evaluates responses through{' '}
              <strong className="text-[#141413] font-semibold">Risk-Adaptive Verification</strong> and deterministically decides whether to{' '}
              <span className="font-semibold text-[#2E7D5B]">RELEASE</span>,{' '}
              <span className="font-semibold text-[#3860BE]">EDIT</span>,{' '}
              <span className="font-semibold text-[#B42318]">BLOCK</span>, or{' '}
              <span className="font-semibold text-[#A45A00]">ESCALATE</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/simulate"
                className="inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#262627] text-[#F3F0EE] px-7 py-3 text-sm font-semibold transition-all shadow-[0_4px_24px_rgba(20,20,19,0.1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlayCircle className="h-4 w-4 text-[#F37338]" />
                <span>Launch Demo Simulator</span>
              </Link>
              <Link
                href="/decisions"
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#FCFBFA] text-[#141413] border border-[#E5E0DA] px-6 py-3 text-sm font-semibold transition-all shadow-xs hover:border-[#141413]"
              >
                <span>Inspect Live Decisions</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#696969]" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[40px] bg-[#141413] text-[#F3F0EE] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_24px_48px_rgba(20,20,19,0.12)]">
          <div className="space-y-2 max-w-2xl"><div className="text-xs font-bold uppercase tracking-wider text-[#F37338]">TRUST &amp; EVALUATION</div><h2 className="text-2xl sm:text-3xl font-extrabold">Show the held-out cases behind the decision layer.</h2><p className="text-xs sm:text-sm text-[#D1CDC7] leading-relaxed">Synthetic evaluation, high-impact escalation recall, tier behavior, and human feedback are reported separately from the live demo fixtures.</p></div>
          <Link href="/evaluation" className="inline-flex items-center gap-2 rounded-full bg-[#F3F0EE] text-[#141413] px-5 py-3 text-xs font-bold shrink-0">Open evaluation <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>

        {/* ============================================================ */}
        {/* 2. RISK-ADAPTIVE TRAJECTORY MOTIF (The Architectural Arc)    */}
        {/* ============================================================ */}
        <section className="rounded-[40px] bg-white border border-[#E5E0DA] p-6 sm:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#ECE8E3]">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
                <span>THE ARCHITECTURE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141413]">
                Risk-Adaptive Verification Pipeline
              </h2>
            </div>
            <span className="text-xs text-[#696969] font-medium bg-[#F3F0EE] px-4 py-1.5 rounded-full border border-[#E5E0DA]">
              Deterministic Tier 0 baseline
            </span>
          </div>

          {/* 4-Step Horizontal Trajectory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] p-5 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#696969]">Step 01</span>
                <Bot className="h-4 w-4 text-[#C84A12]" />
              </div>
              <h3 className="text-base font-bold text-[#141413]">Model Completion</h3>
              <p className="text-xs text-[#696969] leading-relaxed">
                Raw AI response intercepted at runtime before reaching user.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] p-5 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#696969]">Step 02</span>
                <Zap className="h-4 w-4 text-[#2E7D5B]" />
              </div>
              <h3 className="text-base font-bold text-[#141413]">Tier 0 Fast Scan</h3>
              <p className="text-xs text-[#696969] leading-relaxed">
                Deterministic PII, prompt-delimiter &amp; token analysis on 100% of traffic.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] p-5 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#696969]">Step 03</span>
                <Database className="h-4 w-4 text-[#3860BE]" />
              </div>
              <h3 className="text-base font-bold text-[#141413]">Tier 1/2 Grounding</h3>
              <p className="text-xs text-[#696969] leading-relaxed">
                Conditional DB lookups triggered strictly on elevated financial/safety risk.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-3xl bg-[#141413] text-[#F3F0EE] p-5 space-y-2 relative shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F37338]">Step 04</span>
                <ShieldCheck className="h-4 w-4 text-[#F37338]" />
              </div>
              <h3 className="text-base font-bold text-white">Authoritative Action</h3>
              <p className="text-xs text-[#D1CDC7] leading-relaxed">
                Deterministic RELEASE, EDIT, BLOCK, or ESCALATE to Control Desk.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. DOMINANT METRIC HERO + SUPPORTING METRICS                 */}
        {/* ============================================================ */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
                <span>GOVERNANCE METRICS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141413]">
                Operational Telemetry
              </h2>
            </div>
            <button
              onClick={() => fetchMetrics()}
              className="flex items-center gap-1.5 rounded-full border border-[#E5E0DA] bg-white px-3.5 py-1.5 text-xs text-[#555555] hover:text-[#141413] transition-all font-medium shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Dominant Large Metric Card (5 cols) */}
            <div className="lg:col-span-5 rounded-[40px] bg-[#141413] text-[#F3F0EE] p-8 sm:p-10 flex flex-col justify-between shadow-[0_24px_48px_rgba(0,0,0,0.08)] relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F37338]">
                  Dominant Telemetry
                </span>
                <h3 className="text-lg font-bold text-[#D1CDC7]">Total AI Interactions Monitored</h3>
              </div>

              <div className="my-8">
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white">
                  {total}
                </div>
                <p className="text-xs text-[#D1CDC7] mt-2">
                  All requests evaluated deterministically with zero unhandled exceptions.
                </p>
              </div>

              <div className="pt-4 border-t border-[#262627] flex items-center justify-between text-xs text-[#D1CDC7]">
                <span>Active Session Status</span>
                <span className="text-[#2E7D5B] font-bold bg-[#E8F5EE]/10 px-3 py-1 rounded-full border border-[#2E7D5B]/30 font-mono">
                  100% AUDITED
                </span>
              </div>
            </div>

            {/* Supporting Metrics (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Average Latency */}
              <div className="rounded-3xl bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#696969]">
                  <span className="font-bold uppercase tracking-wider">Average Latency</span>
                  <Clock className="h-4 w-4 text-[#2E7D5B]" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#141413] font-mono">
                  {metrics?.avgLatencyMs || 0}<span className="text-base text-[#696969] font-normal">ms</span>
                </div>
                <p className="text-xs text-[#555555]">Local prototype telemetry is shown in the feed; no production latency SLA is claimed.</p>
              </div>

              {/* Blocked Risk Count */}
              <div className="rounded-3xl bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#696969]">
                  <span className="font-bold uppercase tracking-wider">Blocked Risk</span>
                  <ShieldAlert className="h-4 w-4 text-[#B42318]" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#B42318] font-mono">
                  {breakdown.BLOCK}
                </div>
                <p className="text-xs text-[#555555]">Factual contradictions &amp; safety hazards stopped at runtime.</p>
              </div>

              {/* Control Desk Queue */}
              <div className="rounded-3xl bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#696969]">
                  <span className="font-bold uppercase tracking-wider">Control Desk Queue</span>
                  <Activity className="h-4 w-4 text-[#A45A00]" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#A45A00] font-mono">
                  {metrics?.pendingEscalations || 0}
                </div>
                <Link href="/controldesk" className="text-xs font-semibold text-[#A45A00] hover:underline flex items-center gap-1">
                  Open human review queue <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Estimated Token Savings */}
              <div className="rounded-3xl bg-white border border-[#E5E0DA] p-6 space-y-3 shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#696969]">
                  <span className="font-bold uppercase tracking-wider">Est. Tokens Saved</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#F3F0EE] text-[#696969] border border-[#E5E0DA]">NOT MEASURED</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#3860BE] font-mono">
                  {metrics?.estimatedTokensSaved?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-[#555555]">Requires a measured baseline before savings can be claimed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. ASYMMETRIC EDITORIAL ENGINE PANELS (3 ENGINES)           */}
        {/* ============================================================ */}
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
              <span>THE THREE ENGINES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141413]">
              Unified Risk Intelligence Layer
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1: Performance */}
            <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 space-y-4 shadow-soft flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] block">
                  • PERFORMANCE ENGINE
                </span>
                <h3 className="text-2xl font-extrabold text-[#141413] leading-snug">
                  Can we trust what AI said?
                </h3>
                <p className="text-xs text-[#696969] leading-relaxed">
                  Extracts factual claims and cross-checks them directly against enterprise ground-truth databases.
                </p>
              </div>
              <div className="pt-4 border-t border-[#ECE8E3] flex flex-wrap gap-2 text-[11px] font-mono text-[#555555]">
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">EvidenceVerifier</span>
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">DB Grounding</span>
              </div>
            </div>

            {/* Panel 2: Cost */}
            <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 space-y-4 shadow-soft flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3860BE] block">
                  • COST ENGINE
                </span>
                <h3 className="text-2xl font-extrabold text-[#141413] leading-snug">
                  How much waste did AI create?
                </h3>
                <p className="text-xs text-[#696969] leading-relaxed">
                  Detects cyclic agent loops, recursive retry thrashing, and token bloat before cloud costs spiral.
                </p>
              </div>
              <div className="pt-4 border-t border-[#ECE8E3] flex flex-wrap gap-2 text-[11px] font-mono text-[#555555]">
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">LoopDetector</span>
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">RetryDetector</span>
              </div>
            </div>

            {/* Panel 3: Responsibility */}
            <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 space-y-4 shadow-soft flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C84A12] block">
                  • RESPONSIBILITY ENGINE
                </span>
                <h3 className="text-2xl font-extrabold text-[#141413] leading-snug">
                  Should this reach the user?
                </h3>
                <p className="text-xs text-[#696969] leading-relaxed">
                  Evaluates PII leakage with deterministic safe repair, prompt injection, and fairness policy compliance.
                </p>
              </div>
              <div className="pt-4 border-t border-[#ECE8E3] flex flex-wrap gap-2 text-[11px] font-mono text-[#555555]">
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">PIIDetector</span>
                <span className="bg-[#F3F0EE] px-2.5 py-1 rounded-full">SafetyPolicy</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. DECISION DISTRIBUTION & TIER BREAKDOWN                    */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Breakdown */}
          <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 space-y-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-[#ECE8E3] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#141413]">Runtime Decision Distribution</h3>
                <p className="text-xs text-[#696969]">Governance outcomes across all evaluated responses</p>
              </div>
              <Link href="/decisions" className="text-xs font-semibold text-[#C84A12] hover:underline flex items-center gap-1">
                View Log <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {total === 0 ? (
              <div className="py-8 text-center text-xs text-[#696969]">
                No decisions recorded yet. Run a simulation to populate metrics.
              </div>
            ) : (
              <div className="space-y-4">
                {/* RELEASE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision="RELEASE" size="sm" />
                      <span className="text-[#555555]">Clean, grounded responses</span>
                    </div>
                    <span className="font-mono font-bold text-[#2E7D5B]">
                      {breakdown.RELEASE} ({getPercent(breakdown.RELEASE)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#ECE8E3] overflow-hidden">
                    <div className="h-full bg-[#2E7D5B] rounded-full transition-all duration-500" style={{ width: `${getPercent(breakdown.RELEASE)}%` }} />
                  </div>
                </div>

                {/* EDIT */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision="EDIT" size="sm" />
                      <span className="text-[#555555]">PII auto-redaction &amp; safe repair</span>
                    </div>
                    <span className="font-mono font-bold text-[#3860BE]">
                      {breakdown.EDIT} ({getPercent(breakdown.EDIT)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#ECE8E3] overflow-hidden">
                    <div className="h-full bg-[#3860BE] rounded-full transition-all duration-500" style={{ width: `${getPercent(breakdown.EDIT)}%` }} />
                  </div>
                </div>

                {/* BLOCK */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision="BLOCK" size="sm" />
                      <span className="text-[#555555]">Factual conflicts &amp; safety hazards</span>
                    </div>
                    <span className="font-mono font-bold text-[#B42318]">
                      {breakdown.BLOCK} ({getPercent(breakdown.BLOCK)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#ECE8E3] overflow-hidden">
                    <div className="h-full bg-[#B42318] rounded-full transition-all duration-500" style={{ width: `${getPercent(breakdown.BLOCK)}%` }} />
                  </div>
                </div>

                {/* ESCALATE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision="ESCALATE" size="sm" />
                      <span className="text-[#555555]">High-impact / policy uncertainty</span>
                    </div>
                    <span className="font-mono font-bold text-[#A45A00]">
                      {breakdown.ESCALATE} ({getPercent(breakdown.ESCALATE)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#ECE8E3] overflow-hidden">
                    <div className="h-full bg-[#A45A00] rounded-full transition-all duration-500" style={{ width: `${getPercent(breakdown.ESCALATE)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Depth */}
          <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-8 space-y-6 shadow-soft">
            <div className="border-b border-[#ECE8E3] pb-4">
              <h3 className="text-lg font-bold text-[#141413]">Verification Depth Breakdown</h3>
              <p className="text-xs text-[#696969]">Verification effort scaling dynamically with risk</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] space-y-1">
                <div className="flex items-center justify-between font-bold text-[#141413]">
                  <span>Tier 0: Fast Deterministic Scan</span>
                  <span className="font-mono">{tierDist.tier0} reqs ({getPercent(tierDist.tier0)}%)</span>
                </div>
                <p className="text-[11px] text-[#696969]">Executed on 100% of responses; local prototype telemetry only.</p>
              </div>

              <div className="p-4 rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] space-y-1">
                <div className="flex items-center justify-between font-bold text-[#141413]">
                  <span>Tier 1: Policy &amp; Loop Evaluation</span>
                  <span className="font-mono">{tierDist.tier1} reqs ({getPercent(tierDist.tier1)}%)</span>
                </div>
                <p className="text-[11px] text-[#696969]">Triggered on PII, policy &amp; loop patterns.</p>
              </div>

              <div className="p-4 rounded-3xl bg-[#FCFBFA] border border-[#ECE8E3] space-y-1">
                <div className="flex items-center justify-between font-bold text-[#141413]">
                  <span>Tier 2: Deep Ground-Truth DB Lookup</span>
                  <span className="font-mono">{tierDist.tier2} reqs ({getPercent(tierDist.tier2)}%)</span>
                </div>
                <p className="text-[11px] text-[#696969]">Triggered for high-impact claims and trusted-record checks.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. CALLOUT FOOTER BANNER                                     */}
        {/* ============================================================ */}
        <section className="rounded-[40px] bg-[#141413] text-[#F3F0EE] p-8 sm:p-12 shadow-[0_24px_48px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F37338]">
              • LIVE DEMO SIMULATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to explore the four governance decisions in action?
            </h2>
            <p className="text-xs sm:text-sm text-[#D1CDC7]">
              Execute real-time governance workflows with our deterministic scenario test suite.
            </p>
          </div>
          <Link
            href="/simulate"
            className="inline-flex items-center gap-2 rounded-full bg-[#F3F0EE] hover:bg-white text-[#141413] px-7 py-3.5 text-sm font-bold transition-all shadow-md shrink-0 hover:scale-[1.02]"
          >
            <span>Open Scenario Simulator</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
