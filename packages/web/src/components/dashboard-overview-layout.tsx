'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { JetBrains_Mono } from 'next/font/google';
import { authDisplay, authUi } from '@/components/auth-premium-shell';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { cn } from '@/lib/utils';

/** Local instance avoids import-order / partial-module issues with re-exported `authMono`. */
const overviewMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-auth-mono',
  display: 'swap',
});

const rootFonts = `${authUi.className} ${overviewMono.variable} antialiased`;

const panelClass = 'rounded-2xl border border-zinc-200/70 bg-white shadow-sm';

const labelClass =
  'font-authMono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500';

type Accent = 'teal' | 'indigo' | 'emerald' | 'violet';

const accentRing: Record<Accent, string> = {
  teal: 'bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-900/10 group-hover:bg-teal-800 group-hover:text-white group-hover:ring-teal-900/20',
  indigo:
    'bg-indigo-50 text-indigo-900 ring-1 ring-inset ring-indigo-900/10 group-hover:bg-indigo-700 group-hover:text-white group-hover:ring-indigo-900/20',
  emerald:
    'bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-900/10 group-hover:bg-emerald-700 group-hover:text-white group-hover:ring-emerald-900/20',
  violet:
    'bg-violet-50 text-violet-900 ring-1 ring-inset ring-violet-900/10 group-hover:bg-violet-700 group-hover:text-white group-hover:ring-violet-900/20',
};

export function DashboardOverviewChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(rootFonts, 'flex min-h-0 w-full min-w-0 shrink-0 flex-col')}>{children}</div>
  );
}

export function DashboardHero({
  title,
  subtitle,
  compact,
}: {
  title: string;
  subtitle: string;
  /** Tighter header for fitting KPIs + charts above the fold */
  compact?: boolean;
}) {
  return (
    <header className={cn(compact ? 'space-y-1' : 'space-y-3', dashboardMotion.heroEnter)}>
      <p className={cn(labelClass, compact && 'text-[0.6rem] tracking-[0.16em]')}>Operations overview</p>
      <h1
        className={cn(
          authDisplay.className,
          compact
            ? 'text-2xl font-semibold tracking-[-0.02em] text-zinc-950 sm:text-3xl sm:leading-tight'
            : 'text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-[2.65rem] sm:leading-[1.05]',
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          'text-zinc-600',
          compact ? 'max-w-3xl text-xs leading-snug sm:text-sm' : 'max-w-2xl text-sm leading-relaxed sm:text-[0.9375rem]',
        )}
      >
        {subtitle}
      </p>
    </header>
  );
}

export function PremiumKpiLink({
  href,
  icon: Icon,
  label,
  value,
  hint,
  accent,
  compact,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  accent: Accent;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        panelClass,
        compact ? 'group block p-3 sm:p-4' : 'group block p-5 sm:p-6',
        'transition-all duration-200 ease-out',
        'hover:z-10 hover:border-teal-300/90 hover:shadow-xl',
        'motion-safe:hover:-translate-y-1 motion-reduce:hover:translate-y-0',
        'active:translate-y-0 active:scale-[0.99] active:shadow-md motion-reduce:active:scale-100',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800/40',
        'focus-visible:border-teal-400 focus-visible:shadow-lg',
      )}
    >
      <div className={cn('flex items-start', compact ? 'gap-3' : 'gap-4')}>
        <div
          className={cn(
            'shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out flex',
            compact ? 'h-9 w-9' : 'h-12 w-12',
            accentRing[accent],
          )}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              labelClass,
              'text-zinc-500',
              compact ? 'text-[0.6rem] tracking-[0.12em]' : 'tracking-[0.14em]',
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'font-semibold tabular-nums tracking-tight text-zinc-950',
              compact ? 'mt-1 text-xl sm:text-2xl' : 'mt-2 text-3xl sm:text-[2rem]',
            )}
          >
            {value}
          </p>
          {hint ? <p className={cn('text-xs leading-snug text-zinc-500', compact ? 'mt-1' : 'mt-2')}>{hint}</p> : null}
        </div>
      </div>
    </Link>
  );
}

/** Static KPI (non-link) */
export function PremiumKpiStatSimple({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  accent: Accent;
  compact?: boolean;
}) {
  const iconBg: Record<Accent, string> = {
    teal: 'bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-900/10',
    indigo: 'bg-indigo-50 text-indigo-900 ring-1 ring-inset ring-indigo-900/10',
    emerald: 'bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-900/10',
    violet: 'bg-violet-50 text-violet-900 ring-1 ring-inset ring-violet-900/10',
  };
  return (
    <div
      className={cn(
        panelClass,
        compact ? 'p-3 sm:p-4' : 'p-5 sm:p-6',
        'transition-all duration-200',
        'hover:border-zinc-300 hover:shadow-lg',
        'motion-safe:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
      )}
    >
      <div className={cn('flex items-start', compact ? 'gap-3' : 'gap-4')}>
        <div
          className={cn(
            'shrink-0 items-center justify-center rounded-xl transition-colors flex',
            compact ? 'h-9 w-9' : 'h-12 w-12',
            iconBg[accent],
          )}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              labelClass,
              'text-zinc-500',
              compact ? 'text-[0.6rem] tracking-[0.12em]' : 'tracking-[0.14em]',
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'font-semibold tabular-nums tracking-tight text-zinc-950',
              compact ? 'mt-1 text-xl sm:text-2xl' : 'mt-2 text-3xl sm:text-[2rem]',
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className={cn('text-xs leading-snug text-zinc-500', compact ? 'mt-1 line-clamp-2' : 'mt-2')}>{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PremiumSection({
  eyebrow,
  title,
  icon: Icon,
  children,
  action,
  className,
  compact,
}: {
  eyebrow?: string;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        panelClass,
        'overflow-hidden p-0 transition-all duration-200',
        '[@media(hover:hover)]:hover:border-zinc-300 [@media(hover:hover)]:hover:shadow-md',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-start justify-between gap-3',
          compact ? 'px-4 py-3 sm:px-5 sm:py-3.5' : 'gap-4 px-5 py-4 sm:px-6 sm:py-5',
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          {Icon ? (
            <span
              className={cn(
                'mt-0.5 flex shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-teal-800',
                compact ? 'h-8 w-8' : 'h-9 w-9',
              )}
            >
              <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.75} aria-hidden />
            </span>
          ) : null}
          <div>
            {eyebrow ? (
              <p className={cn(labelClass, 'text-zinc-400', compact && 'text-[0.6rem]')}>{eyebrow}</p>
            ) : null}
            <h2
              className={cn(
                'font-semibold tracking-tight text-zinc-900',
                compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl',
              )}
            >
              {title}
            </h2>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}

export function PremiumChartCard({
  title,
  icon: Icon,
  legend,
  footer,
  children,
  empty,
  compact,
}: {
  title: string;
  icon: LucideIcon;
  legend?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  empty?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        panelClass,
        'flex flex-col transition-all duration-200',
        'hover:border-teal-200/80 hover:shadow-lg',
        'motion-safe:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
        compact ? 'p-4 sm:p-4' : 'p-5 sm:p-6',
      )}
    >
      <div className={cn('flex flex-wrap items-center justify-between gap-2', compact ? 'mb-2' : 'mb-4')}>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
          <span
            className={cn(
              'flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700',
              compact ? 'h-7 w-7' : 'h-8 w-8',
            )}
          >
            <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.75} aria-hidden />
          </span>
          {title}
        </h3>
        {legend ? (
          <span
            className={cn(
              'font-authMono uppercase tracking-[0.16em] text-zinc-400',
              compact ? 'text-[0.55rem]' : 'text-[0.6rem]',
            )}
          >
            {legend}
          </span>
        ) : null}
      </div>
      {empty ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-xl bg-zinc-50/60 px-4 text-center',
            compact ? 'min-h-[9rem]' : 'min-h-[14rem]',
          )}
        >
          <p className="text-sm font-medium text-zinc-600">No activity yet</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            Daily bars appear once orders or payments are recorded.
          </p>
        </div>
      ) : (
        <div className="min-h-0 w-full">{children ?? null}</div>
      )}
      {footer ? <div className={cn('text-center', compact ? 'mt-2' : 'mt-3')}>{footer}</div> : null}
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <DashboardOverviewChrome>
      <div
        className={cn(
          'max-w-7xl mx-auto space-y-10 motion-safe:animate-pulse motion-reduce:animate-none',
          dashboardMotion.skeletonShell,
        )}
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-2.5 w-28 rounded-md bg-zinc-200/90 motion-reduce:bg-zinc-200/80" />
            <div className="h-8 w-48 max-w-full rounded-md bg-zinc-200/90 motion-reduce:bg-zinc-200/80" />
            <div className="h-3 w-full max-w-lg rounded-md bg-zinc-100/90 motion-reduce:bg-zinc-100" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  panelClass,
                  'h-24 bg-gradient-to-br from-zinc-100/80 to-zinc-50/40 motion-reduce:from-zinc-100 motion-reduce:to-zinc-100',
                )}
              />
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div
              className={cn(
                panelClass,
                'h-64 bg-gradient-to-br from-zinc-100/80 to-zinc-50/40 lg:col-span-2 motion-reduce:from-zinc-100 motion-reduce:to-zinc-100',
              )}
            />
            <div
              className={cn(
                panelClass,
                'h-64 bg-gradient-to-br from-zinc-100/80 to-zinc-50/40 motion-reduce:from-zinc-100 motion-reduce:to-zinc-100',
              )}
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div
            className={cn(
              panelClass,
              'h-72 bg-gradient-to-br from-zinc-100/80 to-zinc-50/40 motion-reduce:from-zinc-100 motion-reduce:to-zinc-100',
            )}
          />
          <div
            className={cn(
              panelClass,
              'h-72 bg-gradient-to-br from-zinc-100/80 to-zinc-50/40 motion-reduce:from-zinc-100 motion-reduce:to-zinc-100',
            )}
          />
        </div>
        <span className="sr-only">Loading dashboard data…</span>
      </div>
    </DashboardOverviewChrome>
  );
}
