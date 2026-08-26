// ============================================================
// ControlPlane.ai — Editorial Risk Meter
// ============================================================

import React from 'react';

interface RiskMeterProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskMeter({ score, label, size = 'md' }: RiskMeterProps) {
  const getRiskColor = (val: number) => {
    if (val >= 75) return { text: 'text-[#B42318]', bg: 'bg-[#B42318]', track: 'bg-[#FDF2F1]' };
    if (val >= 50) return { text: 'text-[#A45A00]', bg: 'bg-[#A45A00]', track: 'bg-[#FEF7EC]' };
    if (val >= 25) return { text: 'text-[#3860BE]', bg: 'bg-[#3860BE]', track: 'bg-[#EEF3FC]' };
    return { text: 'text-[#2E7D5B]', bg: 'bg-[#2E7D5B]', track: 'bg-[#E8F5EE]' };
  };

  const colors = getRiskColor(score);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#555555] tracking-tight">{label}</span>
        <span className={`font-mono font-bold ${colors.text} text-xs`}>
          {Math.round(score)}<span className="text-[#888888] font-normal text-[10px]">/100</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className={`w-full rounded-full bg-[#ECE8E3] overflow-hidden ${size === 'lg' ? 'h-2.5' : size === 'sm' ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`h-full ${colors.bg} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
