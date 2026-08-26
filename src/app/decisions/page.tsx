// ============================================================
// ControlPlane.ai — Editorial Live Decisions Feed (Page 3: /decisions)
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import {
  ArrowRight,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { AnalyzeResponse } from '@/types';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<AnalyzeResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (selectedFilter !== 'ALL') {
        params.set('decision', selectedFilter);
      }

      const res = await fetch(`/api/decisions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load decisions from API');
      const data = await res.json();
      setDecisions(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message || 'Unable to connect to decisions API');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFilter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '10');
        if (selectedFilter !== 'ALL') {
          params.set('decision', selectedFilter);
        }
        const res = await fetch(`/api/decisions?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load decisions');
        const data = await res.json();
        if (!ignore) {
          setDecisions(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
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
  }, [page, selectedFilter]);

  const filteredDecisions = decisions.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.requestId.toLowerCase().includes(q) ||
      (d.originalResponse && d.originalResponse.toLowerCase().includes(q)) ||
      d.decisionReason.toLowerCase().includes(q) ||
      d.taskType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12">
        {/* ============================================================ */}
        {/* 1. HEADER SECTION                                            */}
        {/* ============================================================ */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A12]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C84A12]" />
              <span>LIVE AUDIT TRAIL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#141413] leading-tight">
              Governance Decision Feed
            </h1>

            <p className="text-base text-[#555555] leading-relaxed">
              Every intercepted AI interaction, its evaluated risk vectors, execution tier, and authoritative governance action.
            </p>
          </div>

          {/* Quick Refresh & Total Count Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-bold bg-white border border-[#E5E0DA] px-4 py-2 rounded-full text-[#141413] shadow-xs">
              {total} Decisions Logged
            </span>
            <button
              onClick={() => fetchDecisions()}
              className="flex items-center gap-1.5 rounded-full border border-[#E5E0DA] bg-white hover:bg-[#FCFBFA] px-4 py-2 text-xs text-[#555555] hover:text-[#141413] transition-all font-medium shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. FILTER & SEARCH CONTROLS (PILL BUTTONS)                   */}
        {/* ============================================================ */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Decision Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'RELEASE', 'EDIT', 'BLOCK', 'ESCALATE'].map(f => {
              const isSelected = selectedFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedFilter(f);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#141413] text-[#F3F0EE] shadow-sm'
                      : 'bg-white hover:bg-[#FCFBFA] text-[#555555] border border-[#E5E0DA]'
                  }`}
                >
                  {f === 'ALL' ? 'All Decisions' : f}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888]" />
            <input
              type="text"
              placeholder="Search request ID, claim, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#E5E0DA] bg-white pl-9 pr-4 py-2 text-xs text-[#141413] placeholder-[#888888] focus:outline-none focus:border-[#141413] shadow-xs"
            />
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. EDITORIAL EVENT STREAM (DECISION ROWS)                    */}
        {/* ============================================================ */}
        <section className="space-y-4">
          {error && (
            <div className="rounded-3xl bg-[#FDF2F1] border border-[#F8A8A1] p-6 text-sm text-[#B42318]">
              {error}
            </div>
          )}

          {filteredDecisions.length === 0 && !loading ? (
            <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-12 text-center space-y-3 shadow-soft">
              <AlertCircle className="h-8 w-8 text-[#888888] mx-auto" />
              <h3 className="text-base font-bold text-[#141413]">No matching decisions found</h3>
              <p className="text-xs text-[#696969]">
                Try adjusting your filter or execute a new simulation from the simulator page.
              </p>
              <Link
                href="/simulate"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#141413] text-[#F3F0EE] px-5 py-2 text-xs font-semibold mt-2"
              >
                Go to Simulator
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDecisions.map(d => (
                <div
                  key={d.requestId}
                  className="rounded-[32px] bg-white border border-[#E5E0DA] p-5 sm:p-6 shadow-soft hover:shadow-elevated transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Decision Badge & Reason */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <DecisionBadge decision={d.decision} size="sm" />
                      <span className="text-[11px] font-mono text-[#696969] bg-[#F3F0EE] px-2.5 py-0.5 rounded-full border border-[#E5E0DA]">
                        {d.requestId}
                      </span>
                      <span className="text-[11px] text-[#888888] uppercase font-bold tracking-wider">
                        {d.taskType}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#141413] group-hover:text-[#C84A12] transition-colors leading-snug">
                      {d.decisionReason}
                    </h3>

                    <p className="font-mono text-xs text-[#696969] line-clamp-1 bg-[#FCFBFA] p-2 rounded-xl border border-[#ECE8E3]">
                      &quot;{d.originalResponse}&quot;
                    </p>
                  </div>

                  {/* Center Column: Risk Metrics */}
                  <div className="flex items-center gap-4 text-xs shrink-0 border-y lg:border-y-0 lg:border-x border-[#ECE8E3] py-2 lg:py-0 px-0 lg:px-6 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-[#888888] block">Composite</span>
                      <span className="font-mono font-bold text-sm text-[#141413]">{Math.round(d.risk?.composite || 0)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-[#888888] block">Perf</span>
                      <span className="font-mono font-bold text-sm text-[#2E7D5B]">{Math.round(d.risk?.performance || 0)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-[#888888] block">Cost</span>
                      <span className="font-mono font-bold text-sm text-[#3860BE]">{Math.round(d.risk?.cost || 0)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-[#888888] block">Resp</span>
                      <span className="font-mono font-bold text-sm text-[#C84A12]">{Math.round(d.risk?.responsibility || 0)}</span>
                    </div>
                  </div>

                  {/* Right Column: Tier, Latency & Case Link */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto shrink-0">
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-[#141413] block">Tier {d.verificationTier}</span>
                      <span className="text-[11px] text-[#696969] font-mono">{d.latencyMs}ms</span>
                    </div>

                    <Link
                      href={`/decisions/${d.requestId}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#141413] hover:bg-[#262627] text-[#F3F0EE] px-4 py-2 text-xs font-semibold transition-all shadow-xs"
                    >
                      <span>Case File</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 4. PAGINATION CONTROLS                                       */}
        {/* ============================================================ */}
        {totalPages > 1 && (
          <section className="flex items-center justify-between pt-4 border-t border-[#ECE8E3] text-xs">
            <span className="text-[#696969]">
              Page {page} of {totalPages} ({total} total decisions)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-full border border-[#E5E0DA] bg-white px-3.5 py-1.5 font-medium disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-full border border-[#E5E0DA] bg-white px-3.5 py-1.5 font-medium disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
