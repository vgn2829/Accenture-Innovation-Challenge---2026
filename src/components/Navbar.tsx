// ============================================================
// ControlPlane.ai — Floating Navigation Pill
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, RotateCcw, Check, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/' },
    { label: 'Simulator', href: '/simulate', badge: 'HERO DEMO' },
    { label: 'Decisions', href: '/decisions' },
    { label: 'Control Desk', href: '/controldesk' },
    { label: 'Evaluation', href: '/evaluation' },
  ];

  const handleResetDemo = async () => {
    if (resetting) return;
    try {
      setResetting(true);
      setResetError(false);
      const res = await fetch('/api/demo/reset', { method: 'POST', headers: { 'x-demo-token': process.env.NEXT_PUBLIC_DEMO_RESET_TOKEN || '' } });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          router.refresh();
        }, 1500);
      } else setResetError(true);
    } catch (err) {
      console.error('Demo reset failed:', err);
      setResetError(true);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="sticky top-5 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Floating White Pill Container */}
      <header className="rounded-full bg-white/95 backdrop-blur-md border border-[#E5E0DA] px-5 py-3 shadow-[0_8px_30px_rgba(20,20,19,0.06)] transition-all flex items-center justify-between">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141413] text-[#F3F0EE] group-hover:scale-105 transition-transform shadow-sm">
            <Shield className="h-4 w-4 fill-current text-[#F3F0EE]" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-[#141413] text-sm sm:text-base">
              CONTROLPLANE<span className="text-[#C84A12]">.AI</span>
            </span>
          </div>
        </Link>

        {/* Center Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? 'bg-[#141413] text-[#F3F0EE] font-semibold shadow-sm'
                    : 'text-[#555555] hover:text-[#141413] hover:bg-[#F3F0EE]/80'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isActive ? 'bg-[#C84A12] text-white' : 'bg-[#FEF7EC] text-[#C84A12] border border-[#F7D29E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls & Reset Pill */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Reset Pill Button */}
          <button
            onClick={handleResetDemo}
            title="Reset demo data to initial clean state"
            className="flex items-center gap-1.5 rounded-full border border-[#E5E0DA] bg-[#FCFBFA] hover:bg-[#F3F0EE] px-3 py-1.5 text-xs text-[#555555] hover:text-[#141413] transition-all font-medium"
          >
            {resetSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#2E7D5B]" />
                <span className="text-[#2E7D5B] font-semibold text-[11px]">Clean</span>
              </>
            ) : resetError ? (
              <>
                <X className="h-3 w-3 text-[#B42318]" />
                <span className="hidden sm:inline text-[11px] text-[#B42318]">Failed</span>
              </>
            ) : (
              <>
                <RotateCcw className={`h-3 w-3 ${resetting ? 'animate-spin text-[#C84A12]' : ''}`} />
                <span className="hidden sm:inline text-[11px]">Reset</span>
              </>
            )}
          </button>

          {/* Active Status Satellite Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#E8F5EE] border border-[#A3D9C0] px-2.5 py-1 text-[11px] font-medium text-[#2E7D5B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B] animate-pulse" />
            <span className="font-mono text-[10px]">OVERSIGHT LIVE</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F0EE] text-[#141413]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-3xl bg-white border border-[#E5E0DA] p-4 shadow-xl space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive ? 'bg-[#141413] text-[#F3F0EE]' : 'text-[#555555] hover:bg-[#F3F0EE]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF7EC] text-[#C84A12]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
