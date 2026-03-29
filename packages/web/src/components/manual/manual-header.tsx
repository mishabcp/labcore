'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ManualBackButton } from '@/components/manual/manual-back-button';
import { AuthLogoMark } from '@/components/auth-premium-shell';
import { manualPageGutterXClass, manualPageWidthClass } from '@/components/manual/manual-ui';
import { cn } from '@/lib/utils';

type Props = {
  readPct: number;
  className?: string;
};

/**
 * Sticky site chrome: brand, title, Sign in. Progress bar sits on the bottom edge of this header
 * (pointer-events none) — height must stay aligned with `manualLayout` sticky offset.
 */
export function ManualHeader({ readPct, className }: Props) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-reduce:animate-none',
        className,
      )}
    >
      <div
        className="manual-print-progress pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-slate-100 manual-print-hide"
        aria-hidden
      >
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-teal-500 to-emerald-500 transition-[width] duration-150 ease-out motion-reduce:transition-none"
          style={{ width: `${readPct}%` }}
        />
      </div>
      <div
        className={cn(
          manualPageWidthClass,
          manualPageGutterXClass,
          'flex flex-wrap items-center justify-between gap-3 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top,0px))]',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          <h1 className="sr-only">LabCore LIMS — User manual</h1>
          <ManualBackButton variant="header" className="manual-print-hide" />
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:items-center md:gap-4">
            <AuthLogoMark glyphClassName="h-8 w-8 sm:h-9 sm:w-9" />
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">User manual</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span className="hidden rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-500 lg:inline">
            v1.0 · Feb 2026
          </span>
          <Link
            href="/login"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-slate-50 hover:shadow active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <ArrowLeft className="h-4 w-4 opacity-70" aria-hidden />
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
