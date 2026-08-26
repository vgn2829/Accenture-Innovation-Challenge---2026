// ============================================================
// ControlPlane.ai — Editorial Decision Badge
// ============================================================

import React from 'react';
import { CheckCircle2, Edit3, XCircle, AlertTriangle } from 'lucide-react';
import type { Decision } from '@/types';

interface DecisionBadgeProps {
  decision: Decision;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function DecisionBadge({
  decision,
  size = 'md',
  showLabel = true,
}: DecisionBadgeProps) {
  const configs = {
    RELEASE: {
      label: 'RELEASE',
      sublabel: 'Verified',
      icon: CheckCircle2,
      style: 'bg-[#E8F5EE] text-[#2E7D5B] border-[#A3D9C0]',
      dot: 'bg-[#2E7D5B]',
    },
    EDIT: {
      label: 'EDIT',
      sublabel: 'Safe Repair',
      icon: Edit3,
      style: 'bg-[#EEF3FC] text-[#3860BE] border-[#B5CEF7]',
      dot: 'bg-[#3860BE]',
    },
    BLOCK: {
      label: 'BLOCK',
      sublabel: 'Blocked Risk',
      icon: XCircle,
      style: 'bg-[#FDF2F1] text-[#B42318] border-[#F8A8A1]',
      dot: 'bg-[#B42318]',
    },
    ESCALATE: {
      label: 'ESCALATE',
      sublabel: 'Human Review',
      icon: AlertTriangle,
      style: 'bg-[#FEF7EC] text-[#A45A00] border-[#F7D29E]',
      dot: 'bg-[#A45A00]',
    },
  };

  const config = configs[decision] || configs.RELEASE;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] gap-1.5 font-bold',
    md: 'px-3.5 py-1 text-xs gap-2 font-bold',
    lg: 'px-4.5 py-1.5 text-sm gap-2.5 font-extrabold',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all shadow-xs ${config.style} ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSizes[size]} shrink-0`} />
      {showLabel && <span className="tracking-wider uppercase">{config.label}</span>}
    </span>
  );
}
