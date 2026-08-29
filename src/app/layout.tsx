import type { Metadata } from 'next';
import { Sofia_Sans, Inter } from 'next/font/google';
import './globals.css';

const sofia = Sofia_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sofia',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ControlPlane.ai — Enterprise AI Decision Layer',
  description:
    'Risk-Adaptive runtime AI governance. Intercepts, evaluates, and decides whether to RELEASE, EDIT, BLOCK, or ESCALATE AI responses in real time.',
  keywords: ['AI governance', 'AI runtime control', 'risk management', 'enterprise AI safety'],
};

import { ToastProvider } from '@/components/Toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sofia.variable} ${inter.variable}`}>
      <body className="antialiased bg-[#F3F0EE] text-[#141413] min-h-screen selection:bg-[#C84A12]/15 selection:text-[#141413]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
