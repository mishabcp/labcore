'use client';

import { useState } from 'react';
import { Beaker, ClipboardList, Eye, EyeOff, Shield } from 'lucide-react';
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { LabCoreLogoGlyph } from '@/components/lab-core-logo-variants';

export const authDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const authUi = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const authMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-auth-mono',
  display: 'swap',
});

export const AUTH_LABEL_CLASS =
  'mb-2 block text-left text-xs font-medium text-slate-500';

export const AUTH_INPUT_CLASS =
  'block min-h-[48px] w-full rounded-xl border border-slate-200/90 bg-sky-50/50 px-4 py-3 text-base font-normal leading-normal text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus:border-teal-500/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,184,166,0.12)] focus:ring-0 sm:min-h-[46px] sm:text-[0.9375rem]';

export const AUTH_ERROR_CLASS =
  'rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-left text-sm font-normal leading-relaxed text-red-800';

export const AUTH_LINK_CLASS =
  'font-semibold text-violet-600 underline decoration-violet-300/60 underline-offset-4 transition-colors hover:text-violet-700 hover:decoration-violet-500/50';

export const AUTH_HINT_CLASS = 'mt-2 text-left text-xs font-normal leading-relaxed text-slate-500';

export const AUTH_SECONDARY_LINK_CLASS =
  'font-medium text-violet-600 underline decoration-violet-300/50 underline-offset-4 transition-colors hover:text-violet-700';

export const AUTH_PAGE_TITLE_CLASS =
  'text-balance text-[1.65rem] font-bold tracking-tight text-slate-900 sm:text-[1.75rem]';

export const AUTH_PAGE_SUBTITLE_CLASS = 'mt-2 text-sm leading-relaxed text-slate-500 sm:mt-2.5';

const PRIMARY_BUTTON_CLASS =
  'mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-[0.9375rem] font-semibold tracking-wide text-white shadow-[0_12px_32px_-10px_rgba(5,150,105,0.45)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-emerald-500 hover:shadow-[0_16px_40px_-12px_rgba(5,150,105,0.5)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 sm:min-h-[48px]';

const formPanelClass =
  'rounded-[1.75rem] border border-white/80 bg-white/95 p-7 shadow-[0_32px_64px_-28px_rgba(15,23,42,0.14),0_12px_28px_-16px_rgba(124,58,237,0.07)] backdrop-blur-sm sm:rounded-[2rem] sm:p-9 lg:p-10';

export function AuthMeshBackground({ className }: { className?: string } = {}) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0 bg-[#f8f7fc]" />
      <div className="absolute -left-[25%] -top-[20%] h-[min(70vh,520px)] w-[min(90vw,520px)] rounded-full bg-teal-200/45 blur-[100px]" />
      <div className="absolute -right-[15%] top-[5%] h-[min(65vh,480px)] w-[min(85vw,480px)] rounded-full bg-violet-200/40 blur-[110px]" />
      <div className="absolute bottom-[-25%] left-[15%] h-[min(75vh,560px)] w-[min(95vw,560px)] rounded-full bg-emerald-100/50 blur-[105px]" />
      <div className="absolute left-1/2 top-1/2 h-[min(50vh,400px)] w-[min(80vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-[80px]" />
    </div>
  );
}

export type AuthLogoMarkProps = {
  className?: string;
  glyphClassName?: string;
  wordmarkClassName?: string;
};

/** Same mark as auth pages — use in dashboard shell, emails, etc. */
export function AuthLogoMark({ className, glyphClassName, wordmarkClassName }: AuthLogoMarkProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 sm:gap-3.5 lg:justify-start', className)}>
      <LabCoreLogoGlyph className={glyphClassName} />
      <span
        className={cn('text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.35rem]', wordmarkClassName)}
      >
        LabCore
      </span>
    </div>
  );
}

const features = [
  {
    icon: Beaker,
    title: 'Structured workflows',
    body: 'Accession through reporting—consistent steps for every sample.',
  },
  {
    icon: ClipboardList,
    title: 'Operational clarity',
    body: 'Dashboards and queues that keep the bench and admin aligned.',
  },
  {
    icon: Shield,
    title: 'Built for compliance',
    body: 'Audit-friendly trails designed for diagnostic environments.',
  },
] as const;

/** Left column: brand + tagline, then headline and feature list */
export function AuthBrandAside() {
  return (
    <div className="flex w-full max-w-[24rem] flex-col lg:max-w-[26rem]">
      <div className="mb-8 flex flex-col items-center sm:mb-9 lg:mb-10 lg:items-start lg:text-left">
        <AuthLogoMark />
        <p className="mt-3 max-w-[20rem] text-pretty text-sm leading-relaxed text-slate-500">
          Calibrated workflows for diagnostic laboratories.
        </p>
      </div>

      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <h1 className="text-balance text-[1.65rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-3xl sm:leading-tight">
          Precision for every{' '}
          <span className="bg-gradient-to-r from-violet-700 to-teal-600 bg-clip-text text-transparent">diagnostic</span>{' '}
          lab.
        </h1>
        <ul className="mt-8 w-full max-w-[22rem] space-y-5 sm:mt-10 lg:max-w-none">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5 text-left">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"
                aria-hidden
              >
                <Icon className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type AuthPasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
};

/** Password field with visibility toggle (SaaS-style) */
export function AuthPasswordInput({
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  minLength,
  placeholder = 'Password',
  disabled,
}: AuthPasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        disabled={disabled}
        className={`${AUTH_INPUT_CLASS} pr-12`}
        aria-required={required}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        aria-controls={id}
      >
        {show ? <EyeOff className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} /> : <Eye className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />}
      </button>
    </div>
  );
}

type AuthPremiumShellProps = {
  children: React.ReactNode;
  mainAriaLabel: string;
  regionAriaLabel: string;
  wide?: boolean;
  aside?: React.ReactNode;
};

export function AuthPremiumShell({
  children,
  mainAriaLabel,
  regionAriaLabel,
  wide,
  aside = <AuthBrandAside />,
}: AuthPremiumShellProps) {
  const formColClass = wide ? 'w-full max-w-[480px]' : 'w-full max-w-[400px]';
  const clusterMax = wide ? 'max-w-[68rem]' : 'max-w-[52rem]';

  return (
    <main
      className={`auth-shell ${authUi.className} relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-4 py-10 text-slate-900 antialiased sm:px-6 sm:py-12 lg:min-h-screen lg:py-16`}
      aria-label={mainAriaLabel}
    >
      <AuthMeshBackground />
      <div
        className={`animate-in fade-in slide-in-from-bottom-2 relative z-[1] flex w-full flex-col items-center gap-9 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] duration-500 sm:gap-10 lg:flex-row lg:items-stretch lg:justify-center lg:gap-5 xl:gap-7 ${clusterMax}`}
      >
        <aside className="relative z-[1] flex w-full shrink-0 justify-center lg:w-auto lg:max-w-none lg:flex-1 lg:items-center lg:justify-end lg:pr-1 xl:pr-2">
          {aside}
        </aside>

        <div className={`relative z-[1] w-full shrink-0 lg:flex-1 lg:max-w-none ${formColClass}`}>
          <div className={formPanelClass} role="region" aria-label={regionAriaLabel}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

type AuthPremiumSubmitButtonProps = {
  disabled?: boolean;
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
};

export function AuthPremiumSubmitButton({ disabled, loading, loadingLabel, children }: AuthPremiumSubmitButtonProps) {
  return (
    <button type="submit" disabled={disabled || loading} className={PRIMARY_BUTTON_CLASS}>
      {loading ? loadingLabel : children}
    </button>
  );
}
