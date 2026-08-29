// ============================================================
// ControlPlane.ai — Global Toast System
// Fixed top-right stack with semantic status treatments.
// ============================================================

'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastStatus = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  status: ToastStatus;
  message: string;
  caseId?: string;
}

interface ToastContextValue {
  toast: (status: ToastStatus, message: string, caseId?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STATUS_CONFIG: Record<ToastStatus, {
  containerClass: string;
  iconClass: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  success: {
    containerClass: 'bg-[#E8F5EE] border-[#A3D9C0] text-[#1A5C3C]',
    iconClass: 'text-[#2E7D5B]',
    Icon: CheckCircle2,
    label: 'Success',
  },
  error: {
    containerClass: 'bg-[#FDF2F1] border-[#F8A8A1] text-[#7A1A12]',
    iconClass: 'text-[#B42318]',
    Icon: XCircle,
    label: 'Error',
  },
  warning: {
    containerClass: 'bg-[#FEF7EC] border-[#F7D29E] text-[#6B3900]',
    iconClass: 'text-[#A45A00]',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    containerClass: 'bg-[#EEF3FC] border-[#B5CEF7] text-[#1D3564]',
    iconClass: 'text-[#3860BE]',
    Icon: Info,
    label: 'Info',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((status: ToastStatus, message: string, caseId?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-4), { id, status, message, caseId }]);
    const duration = status === 'error' || status === 'warning' ? 6000 : 4000;
    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast stack — fixed top-right, above everything */}
      <div
        aria-live="assertive"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none"
      >
        {toasts.map(t => {
          const { containerClass, iconClass, Icon, label } = STATUS_CONFIG[t.status];
          return (
            <div
              key={t.id}
              role={t.status === 'error' ? 'alert' : 'status'}
              aria-label={label}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_8px_24px_rgba(20,20,19,0.12)] animate-in slide-in-from-right-4 fade-in duration-200 ${containerClass}`}
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconClass}`} aria-hidden />
              <div className="flex-1 min-w-0">
                {t.caseId && (
                  <span className="block text-[10px] font-mono opacity-70 mb-0.5 truncate">
                    {t.caseId}
                  </span>
                )}
                <p className="text-xs font-semibold leading-snug">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
