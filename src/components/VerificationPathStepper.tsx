// ============================================================
// ControlPlane.ai — Editorial Verification Path Stepper
// ============================================================

import React from 'react';
import { Check, Clock, Zap, ShieldAlert, Database } from 'lucide-react';
import type { VerificationStep, VerificationTier } from '@/types';

interface VerificationPathStepperProps {
  path: VerificationStep[];
  highestTier: VerificationTier;
}

export function VerificationPathStepper({ path, highestTier }: VerificationPathStepperProps) {
  const tierDefinitions = [
    {
      tier: 0,
      name: 'Tier 0: Fast Deterministic Scan',
      subtext: 'Regex PII, prompt delimiters, token ratios',
      description: 'Zero-latency millisecond pattern scanning executed on 100% of responses.',
      icon: Zap,
    },
    {
      tier: 1,
      name: 'Tier 1: Structural & Policy Evaluation',
      subtext: 'Classification, loop cycles, safety policy',
      description: 'Triggered when elevated risk or privacy patterns are observed.',
      icon: ShieldAlert,
    },
    {
      tier: 2,
      name: 'Tier 2: Deep Ground-Truth Verification',
      subtext: 'Live enterprise database cross-check',
      description: 'Triggered strictly for high-impact financial & factual claims against enterprise DB.',
      icon: Database,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E0DA]">
        {tierDefinitions.map(def => {
          const executedStep = path.find(p => p.tier === def.tier);
          const isExecuted = Boolean(executedStep);
          const isHighest = def.tier === highestTier;
          const Icon = def.icon;

          return (
            <div key={def.tier} className="relative group">
              {/* Dot Icon Indicator */}
              <div
                className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  isExecuted
                    ? 'bg-[#141413] border-[#141413] text-[#F3F0EE] shadow-sm'
                    : 'bg-[#FCFBFA] border-[#D1CDC7] text-[#D1CDC7]'
                }`}
              >
                {isExecuted ? <Check className="h-3 w-3 stroke-[3]" /> : <div className="h-1.5 w-1.5 rounded-full bg-[#D1CDC7]" />}
              </div>

              {/* Step Card */}
              <div
                className={`rounded-2xl p-4 transition-all ${
                  isHighest
                    ? 'bg-white border border-[#E5E0DA] shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                    : isExecuted
                    ? 'bg-[#FCFBFA] border border-[#ECE8E3]'
                    : 'bg-[#F3F0EE]/50 border border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isExecuted ? 'text-[#C84A12]' : 'text-[#888888]'}`} />
                    <span className={`text-sm font-bold ${isExecuted ? 'text-[#141413]' : 'text-[#888888]'}`}>
                      {def.name}
                    </span>
                  </div>

                  {isExecuted && executedStep && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#2E7D5B] bg-[#E8F5EE] px-2 py-0.5 rounded-full border border-[#A3D9C0] font-semibold">
                      <Clock className="h-3 w-3" />
                      {executedStep.latencyMs}ms
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#696969] mb-2">{def.description}</p>

                {isExecuted && executedStep ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#ECE8E3] text-xs">
                    <div className="flex items-start gap-1.5 text-[#262627]">
                      <span className="text-[#888888] shrink-0 font-medium">Executed:</span>
                      <span className="font-mono text-[#141413] text-[11px] font-semibold">
                        {executedStep.checks.join(', ')}
                      </span>
                    </div>
                    {executedStep.triggerReason && (
                      <div className="flex items-start gap-1.5 text-[#A45A00] bg-[#FEF7EC] p-2 rounded-xl border border-[#F7D29E] text-[11px]">
                        <span className="font-bold shrink-0">Trigger:</span>
                        <span>{executedStep.triggerReason}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#888888] italic pt-1">
                    Skipped: risk threshold not reached (adaptive efficiency)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
