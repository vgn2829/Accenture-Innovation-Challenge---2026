// ============================================================
// ControlPlane.ai — Editorial Evidence Comparison Card
// ============================================================

import React from 'react';
import { AlertOctagon, CheckCircle2, HelpCircle, ArrowRight, X } from 'lucide-react';
import type { Evidence } from '@/types';

interface EvidenceCardProps {
  evidence: Evidence[];
  hasConflict: boolean;
}

export function EvidenceCard({ evidence, hasConflict }: EvidenceCardProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E0DA] bg-[#FCFBFA] p-6 text-center text-xs text-[#696969]">
        No specific ground-truth evidence conflicts detected for this response.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evidence.map((ev, idx) => {
        const isConflict =
          ev.label.toLowerCase().includes('conflict') ||
          ev.label.toLowerCase().includes('mismatch') ||
          hasConflict;
        const isUncertain = ev.actual?.includes('No matching') || ev.actual?.includes('No ground-truth');

        return (
          <div
            key={idx}
            className={`rounded-3xl border p-5 sm:p-6 transition-all ${
              isConflict
                ? 'bg-[#FDF2F1] border-[#F8A8A1] shadow-[0_4px_24px_rgba(180,35,24,0.06)]'
                : isUncertain
                ? 'bg-[#FEF7EC] border-[#F7D29E]'
                : 'bg-white border-[#E5E0DA] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
            }`}
          >
            {/* Header with Eyebrow & Status */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                {isConflict ? (
                  <AlertOctagon className="h-5 w-5 text-[#B42318] shrink-0" />
                ) : isUncertain ? (
                  <HelpCircle className="h-5 w-5 text-[#A45A00] shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-[#2E7D5B] shrink-0" />
                )}
                <span
                  className={`text-sm sm:text-base font-bold ${
                    isConflict ? 'text-[#B42318]' : isUncertain ? 'text-[#A45A00]' : 'text-[#2E7D5B]'
                  }`}
                >
                  {ev.label}
                </span>
              </div>

              <span
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  isConflict
                    ? 'bg-[#B42318] text-white border-[#B42318]'
                    : isUncertain
                    ? 'bg-[#A45A00] text-white border-[#A45A00]'
                    : 'bg-[#E8F5EE] text-[#2E7D5B] border-[#A3D9C0]'
                }`}
              >
                {isConflict ? 'CRITICAL CONFLICT' : isUncertain ? 'UNVERIFIED RECORD' : 'GROUNDED'}
              </span>
            </div>

            {/* Side-by-Side Comparison (AI Claim vs Business Record) */}
            {(ev.claimed || ev.actual) && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  {/* AI Claim */}
                  <div className="rounded-2xl bg-white p-4 border border-[#E5E0DA] space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-bold text-[#696969] uppercase tracking-wider block">
                      AI Model Claim:
                    </span>
                    <p className="font-mono text-[#141413] bg-[#F3F0EE] p-2.5 rounded-xl border border-[#E5E0DA] text-xs sm:text-sm">
                      &quot;{ev.claimed}&quot;
                    </p>
                  </div>

                  {/* Business Record */}
                  <div
                    className={`rounded-2xl p-4 border space-y-1.5 shadow-xs ${
                      isConflict
                        ? 'bg-white border-[#F8A8A1]'
                        : 'bg-white border-[#E5E0DA]'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                        isConflict ? 'text-[#B42318]' : 'text-[#696969]'
                      }`}
                    >
                      Business Record (Ground Truth DB):
                    </span>
                    <p
                      className={`font-mono p-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                        isConflict
                          ? 'text-[#B42318] bg-[#FDF2F1] border-[#F8A8A1]'
                          : 'text-[#141413] bg-[#F3F0EE] border-[#E5E0DA]'
                      }`}
                    >
                      {ev.actual}
                    </p>
                  </div>
                </div>

                {/* Conflict Separator Badge */}
                {isConflict && (
                  <div className="text-center py-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#B42318] bg-white px-4 py-1.5 rounded-full border border-[#F8A8A1] shadow-xs">
                      <X className="h-4 w-4 text-[#B42318]" />
                      FACTUAL CONTRADICTION DETECTED
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Detail */}
            {ev.detail && (
              <div className="text-xs text-[#555555] bg-white/80 p-3.5 rounded-2xl border border-[#E5E0DA] flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-[#C84A12] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{ev.detail}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
