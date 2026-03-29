'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { authUi } from '@/components/auth-premium-shell';
import { DashboardOverviewChrome } from '@/components/dashboard-overview-layout';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { cn } from '@/lib/utils';

/** Shared dashboard list/detail styling — align with `/dashboard/patients`. */
export const dashboardPremium = {
  labelClass:
    'font-authMono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500',
  panelClass: 'rounded-2xl border border-zinc-200/70 bg-white shadow-sm',
  formLabelClass: 'mb-2 block text-sm font-medium text-zinc-700',
  inputClass:
    'min-h-[48px] w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 focus:border-teal-500/50 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.12)] sm:min-h-[44px]',
  textareaClass:
    'min-h-[5.5rem] w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 focus:border-teal-500/50 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.12)]',
  selectClass:
    'min-h-[48px] w-full cursor-pointer rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] duration-200 focus:border-teal-500/50 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.12)] sm:min-h-[44px]',
  ghostBtn:
    'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800/30 sm:min-h-0 sm:py-2',
  primaryBtn:
    'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(13,148,136,0.45)] transition-all duration-200 hover:from-teal-500 hover:to-teal-600 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-900/40 disabled:pointer-events-none disabled:opacity-45',
  dangerBtn:
    'inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-500 hover:to-rose-600 disabled:opacity-45',
  mutedBtn:
    'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50',
  inlineLink:
    'font-medium text-zinc-900 underline decoration-zinc-300/70 underline-offset-4 transition-colors hover:text-teal-800 hover:decoration-teal-400/60',
  backLink:
    'text-sm font-medium text-zinc-600 underline decoration-zinc-300/60 underline-offset-4 transition-colors hover:text-teal-800 hover:decoration-teal-400/50',
  tableHead:
    'px-4 py-3.5 text-left font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5',
  tableRowHover:
    'transition-colors duration-150 hover:bg-teal-50/40 [@media(hover:hover)]:hover:bg-teal-50/50',
  checkbox:
    'rounded border-zinc-300 text-teal-600 focus:ring-teal-500/40',
  filterChipActive: 'border-teal-300 bg-teal-50 text-teal-900 shadow-sm ring-2 ring-teal-400/30',
  filterChipIdle:
    'border-zinc-200/90 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50/80',
} as const;

export function dashboardTableHeadCell(className?: string) {
  return cn(dashboardPremium.tableHead, className);
}

export function DashboardPageScaffold({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DashboardOverviewChrome>
      <div
        className={cn(
          'flex shrink-0 flex-col gap-6 overflow-x-hidden pb-8 text-zinc-900 [&>*:not(form)]:shrink-0',
          dashboardMotion.pageEnter,
          className,
        )}
      >
        {children}
      </div>
    </DashboardOverviewChrome>
  );
}

/** Tighter vertical rhythm for dense operational pages (order detail, etc.). */
export function DashboardPageScaffoldCompact({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DashboardOverviewChrome>
      <div
        className={cn(
          'flex shrink-0 flex-col gap-4 overflow-x-hidden pb-8 text-zinc-900 [&>*:not(form)]:shrink-0',
          dashboardMotion.pageEnter,
          className,
        )}
      >
        {children}
      </div>
    </DashboardOverviewChrome>
  );
}

export function DashboardPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  compact,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={cn('space-y-2', dashboardMotion.heroEnter)}>
      <p className={dashboardPremium.labelClass}>{eyebrow}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1
            className={cn(
              authUi.className,
              'tabular-nums antialiased',
              compact
                ? 'text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl'
                : 'text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[2.25rem] sm:leading-tight',
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 self-start sm:self-auto">{action}</div> : null}
      </div>
    </header>
  );
}

export function DashboardToolbarPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(dashboardPremium.panelClass, 'p-4 sm:p-5', className)}>{children}</div>;
}

export function DashboardErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
      role="alert"
    >
      {children}
    </div>
  );
}

export function DashboardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={cn(dashboardPremium.panelClass, 'divide-y divide-zinc-100 overflow-hidden')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse px-4 py-4 sm:px-6">
          <div className="h-4 w-32 rounded bg-zinc-200" />
          <div className="mt-3 h-3 w-full max-w-md rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export function DashboardBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={dashboardPremium.backLink}>
      {children}
    </Link>
  );
}

export function DashboardInfoCallout({ children, tone = 'teal' }: { children: ReactNode; tone?: 'teal' | 'violet' }) {
  const tones = {
    teal: 'border-teal-200/80 bg-teal-50/90 text-teal-950 dark:border-teal-800/50 dark:bg-teal-950/35 dark:text-teal-50',
    violet: 'border-violet-200/80 bg-violet-50/90 text-violet-950 dark:border-violet-800/50 dark:bg-violet-950/35 dark:text-violet-100',
  };
  return (
    <div className={cn('rounded-2xl border p-4 text-sm leading-relaxed', tones[tone])}>{children}</div>
  );
}
