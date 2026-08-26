// ============================================================
// ControlPlane.ai — Editorial Human Control Desk (Page 5: /controldesk)
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { DecisionBadge } from '@/components/DecisionBadge';
import { RiskMeter } from '@/components/RiskMeter';
import { EvidenceCard } from '@/components/EvidenceCard';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import type { ControlDeskCase, ControlDeskAction } from '@/types';

export default function ControlDeskPage() {
  const [cases, setCases] = useState<ControlDeskCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ControlDeskCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/controldesk');
      if (!res.ok) throw new Error('Failed to load Control Desk queue');
      const data = await res.json();
      const list = data.data || [];
      setCases(list);
      if (list.length > 0) {
        setSelectedCase(prev => (prev ? list.find((c: ControlDeskCase) => c.requestId === prev.requestId) || list[0] : list[0]));
      } else {
        setSelectedCase(null);
      }
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
        setLoading(true);
        const res = await fetch('/api/controldesk');
        if (!res.ok) throw new Error('Failed to load Control Desk queue');
        const data = await res.json();
        if (!ignore) {
          const list = data.data || [];
          setCases(list);
          if (list.length > 0) setSelectedCase(list[0]);
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

  const handleAction = async (action: ControlDeskAction) => {
    if (!selectedCase || submitting) return;
    try {
      setSubmitting(true);
      setActionSuccess(null);
      const res = await fetch(`/api/controldesk/${selectedCase.requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          note: actionNotes.trim() || `Adjudicated as ${action} via Human Control Desk`,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit adjudication action');

      setActionSuccess(`Case successfully adjudicated as ${action}`);
      setActionNotes('');
      await fetchCases();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0EE] text-[#141413] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* ============================================================ */}
        {/* 1. HEADER SECTION                                            */}
        {/* ============================================================ */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A45A00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A45A00]" />
              <span>HUMAN OVERSIGHT WORKSPACE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#141413] leading-tight">
              AI stopped here. Human judgment required.
            </h1>

            <p className="text-base text-[#555555] leading-relaxed">
              Review and adjudicate AI responses flagged for policy uncertainty, elevated financial risk, or safety ambiguity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-bold bg-white border border-[#E5E0DA] px-4 py-2 rounded-full text-[#A45A00] shadow-xs">
              {cases.length} Pending Cases
            </span>
            <button
              onClick={() => fetchCases()}
              className="flex items-center gap-1.5 rounded-full border border-[#E5E0DA] bg-white hover:bg-[#FCFBFA] px-4 py-2 text-xs text-[#555555] hover:text-[#141413] transition-all font-medium shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. QUEUE & ADJUDICATION WORKSPACE (2 COLS)                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cases Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#696969] px-2">
              <span>Pending Escalations</span>
              <span className="font-mono">({cases.length})</span>
            </div>

            {cases.length === 0 && !loading ? (
              <div className="rounded-[32px] bg-white border border-[#E5E0DA] p-8 text-center space-y-2 shadow-soft">
                <Inbox className="h-6 w-6 text-[#888888] mx-auto" />
                <h3 className="text-sm font-bold text-[#141413]">Review Queue Empty</h3>
                <p className="text-xs text-[#696969]">All flagged cases have been successfully adjudicated.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {cases.map(c => {
                  const isSelected = selectedCase?.requestId === c.requestId;
                  return (
                    <button
                      key={c.requestId}
                      onClick={() => setSelectedCase(c)}
                      className={`w-full text-left rounded-3xl p-4 transition-all border ${
                        isSelected
                          ? 'bg-[#141413] text-[#F3F0EE] border-[#141413] shadow-[0_8px_24px_rgba(20,20,19,0.1)]'
                          : 'bg-white hover:bg-[#FCFBFA] border-[#E5E0DA] text-[#141413] shadow-soft'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-[#FEF7EC] text-[#A45A00]' : 'bg-[#FEF7EC] text-[#A45A00] border border-[#F7D29E]'
                          }`}
                        >
                          ESCALATED
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-[#D1CDC7]' : 'text-[#888888]'
                          }`}
                        >
                          {c.requestId.slice(0, 14)}...
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-bold leading-snug line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-[#141413]'
                        }`}
                      >
                        {c.decisionReason}
                      </h4>

                      <p
                        className={`text-[11px] font-mono line-clamp-1 mt-1 ${
                          isSelected ? 'text-[#D1CDC7]' : 'text-[#696969]'
                        }`}
                      >
                        &quot;{c.aiResponse}&quot;
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Case Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {selectedCase ? (
              <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-6 sm:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.04)] space-y-6">
                {/* Case Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ECE8E3]">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-[#A45A00] bg-[#FEF7EC] px-2.5 py-0.5 rounded-full border border-[#F7D29E]">
                      CASE: {selectedCase.requestId}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#141413]">
                      {selectedCase.decisionReason}
                    </h2>
                  </div>
                  <DecisionBadge decision="ESCALATE" size="md" />
                </div>

                {/* Feedback Banner */}
                {actionSuccess && (
                  <div className="rounded-2xl bg-[#E8F5EE] border border-[#A3D9C0] p-4 text-xs font-bold text-[#2E7D5B] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {/* Risk Scores Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3">
                    <RiskMeter score={selectedCase.risk.composite} label="Composite" size="sm" />
                  </div>
                  <div className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3">
                    <RiskMeter score={selectedCase.risk.performance} label="Performance" size="sm" />
                  </div>
                  <div className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3">
                    <RiskMeter score={selectedCase.risk.cost} label="Cost" size="sm" />
                  </div>
                  <div className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-3">
                    <RiskMeter score={selectedCase.risk.responsibility} label="Responsibility" size="sm" />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><span className="block text-[10px] uppercase text-[#888888]">Profile</span><span className="font-bold uppercase">{selectedCase.profile?.replaceAll('_', ' ') || 'UNKNOWN'}</span></div>
                  <div><span className="block text-[10px] uppercase text-[#888888]">Policy</span><span className="font-mono font-bold">{selectedCase.policyVersion || 'UNKNOWN'}</span></div>
                  <div><span className="block text-[10px] uppercase text-[#888888]">Original action</span><span className="font-bold">ESCALATE</span></div>
                  <div><span className="block text-[10px] uppercase text-[#888888]">Feedback</span><span className="font-bold">Created on resolve</span></div>
                </div>

                {/* Intercepted Content */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
                    Intercepted AI Output Awaiting Human Approval:
                  </span>
                  <div className="p-4 rounded-2xl bg-[#FCFBFA] border border-[#ECE8E3] font-mono text-xs sm:text-sm text-[#141413] leading-relaxed">
                    {selectedCase.aiResponse}
                  </div>
                </div>

                {/* Ground Truth Evidence */}
                {selectedCase.evidence && selectedCase.evidence.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#141413] block">
                      Verification Evidence:
                    </span>
                    <EvidenceCard evidence={selectedCase.evidence} hasConflict={selectedCase.detections.some(d => d.type === 'FACTUAL_CONFLICT')} />
                  </div>
                )}

                {/* Adjudication Actions Section */}
                <div className="pt-6 border-t border-[#ECE8E3] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141413] block">
                    Supervisor Adjudication Action:
                  </span>

                  {/* Reviewer Notes Input */}
                  <textarea
                    rows={2}
                    placeholder="Enter optional reviewer justification or notes..."
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E0DA] bg-[#FCFBFA] p-3 text-xs text-[#141413] placeholder-[#888888] focus:outline-none focus:border-[#141413]"
                  />

                  {/* Action Buttons (Pills) */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => handleAction('APPROVE_RELEASE')}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D5B] hover:bg-[#236348] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve &amp; Release</span>
                    </button>

                    <button
                      onClick={() => handleAction('APPROVE_WITH_EDIT')}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#3860BE] hover:bg-[#2c4e9e] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Approve with Edit</span>
                    </button>

                    <button
                      onClick={() => handleAction('CONFIRM_BLOCK')}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#B42318] hover:bg-[#911c13] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Confirm Block</span>
                    </button>

                    <button
                      onClick={() => handleAction('ADD_NOTE')}
                      disabled={submitting || !actionNotes.trim()}
                      title="Enter a note above to save it without resolving the case"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0DA] bg-white hover:bg-[#FCFBFA] text-[#555555] px-5 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <span>Add Note</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[40px] bg-white border border-[#E5E0DA] p-16 text-center space-y-2 shadow-soft">
                <h3 className="text-base font-bold text-[#141413]">No case selected</h3>
                <p className="text-xs text-[#696969]">Select an escalation from the left queue to review.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
