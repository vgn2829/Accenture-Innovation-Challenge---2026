// ============================================================
// ControlPlane.ai — Floating Navigation Pill
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/' },
    { label: 'Simulator', href: '/simulate' },
    { label: 'Decisions', href: '/decisions' },
    { label: 'Control Desk', href: '/controldesk' },
    { label: 'Evaluation', href: '/evaluation' },
  ];

  return (
    <div className="sticky top-5 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Floating White Pill Container */}
      <header className="rounded-full bg-white/95 backdrop-blur-md border border-[#E5E0DA] px-5 py-3 shadow-[0_8px_30px_rgba(20,20,19,0.06)] transition-all flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141413] text-[#F3F0EE] group-hover:scale-105 transition-transform shadow-sm">
            <Shield className="h-4 w-4 fill-current text-[#F3F0EE]" />
          </div>
          <span className="font-extrabold tracking-tight text-[#141413] text-sm sm:text-base whitespace-nowrap">
            CONTROLPLANE<span className="text-[#C84A12]">.AI</span>
          </span>
        </Link>

        {/* Center Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-1 justify-center">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap flex items-center px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? 'bg-[#141413] text-[#F3F0EE] font-semibold shadow-sm'
                    : 'text-[#555555] hover:text-[#141413] hover:bg-[#F3F0EE]/80'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Mobile Toggle */}
        <div className="flex items-center shrink-0">
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
