'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { authUi } from '@/components/auth-premium-shell';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardErrorBanner,
  DashboardInfoCallout,
  DashboardPageScaffold,
} from '@/components/dashboard-premium-shell';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const GENDERS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
  { value: 'other' as const, label: 'Other' },
];

function parseApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return 'Failed to create patient';
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        dashboardPremium.panelClass,
        'overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_48px_-28px_rgba(15,23,42,0.12)]',
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-zinc-100/90 bg-gradient-to-br from-zinc-50/80 via-white to-teal-50/30 px-5 py-4 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_0_0_1px_rgba(228,228,231,0.9),0_4px_14px_-6px_rgba(13,148,136,0.25)]">
          <Icon className="h-5 w-5 text-teal-700" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-5 p-5 sm:space-y-6 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={cn(dashboardPremium.formLabelClass, 'mb-0 flex flex-wrap items-baseline gap-x-1.5')}>
        <span>{label}</span>
        {required ? (
          <span className="text-xs font-normal normal-case tracking-normal text-rose-600">Required</span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export default function NewPatientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get('name') || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [mobile, setMobile] = useState(searchParams.get('mobile') || '');
  const [email, setEmail] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requiredComplete = Boolean(name.trim() && mobile.trim());
  const checklist = useMemo(
    () => [
      { id: 'name', label: 'Full name entered', done: Boolean(name.trim()) },
      { id: 'mobile', label: 'Mobile number added', done: Boolean(mobile.trim()) },
      { id: 'gender', label: 'Gender selected', done: true },
    ],
    [name, mobile],
  );
  const doneCount = checklist.filter((c) => c.done).length;
  const progressPct = Math.round((doneCount / checklist.length) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    try {
      const data = await api.post('/patients', {
        name,
        gender,
        mobile,
        email: email || undefined,
        ageYears: ageYears ? parseInt(ageYears, 10) : undefined,
        address: address || undefined,
      });
      const id = (data as { id?: string })?.id;
      if (!id) throw new Error('Invalid response');
      router.push(`/dashboard/patients/${id}`);
      router.refresh();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPageScaffold className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <DashboardBackLink href="/dashboard/patients">← Back to patients</DashboardBackLink>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white via-white to-teal-50/40 p-5 shadow-sm sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-teal-400/20 to-violet-400/15 blur-2xl"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-[0_12px_32px_-14px_rgba(13,148,136,0.65)]">
                <UserPlus className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className={dashboardPremium.labelClass}>Registration</p>
                <h1
                  className={cn(
                    authUi.className,
                    'text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums antialiased sm:text-3xl',
                  )}
                >
                  New patient
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
                  Create a patient record for lab orders, reports, and follow-up. Only name, gender, and mobile are
                  required; everything else helps your team later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
          {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

          <SectionCard
            icon={User}
            title="Identity"
            description="Legal or chart name and gender for reports and labels."
          >
            <Field id="name" label="Full name" required>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={dashboardPremium.inputClass}
                placeholder="e.g. Ananya Krishnan"
                autoComplete="name"
                required
              />
            </Field>
            <div className="space-y-2">
              <span className={dashboardPremium.formLabelClass}>Gender</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Gender">
                {GENDERS.map((g) => {
                  const selected = gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      aria-pressed={selected}
                      className={cn(
                        'min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800/35',
                        selected
                          ? 'border-teal-400/70 bg-teal-50 text-teal-950 shadow-sm ring-2 ring-teal-400/25'
                          : 'border-zinc-200/90 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50/80',
                      )}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Phone}
            title="Contact"
            description="Reach the patient for collections, results, and billing questions."
          >
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <Field id="mobile" label="Mobile" hint="Include country code if applicable." required>
                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={dashboardPremium.inputClass}
                  placeholder="+91 …"
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field id="email" label="Email" hint="Optional. Used for digital reports when available.">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={dashboardPremium.inputClass}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={MapPin}
            title="Additional details"
            description="Optional fields — add them now or update the profile later."
          >
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <Field id="ageYears" label="Age (years)" hint="Approximate age is fine if exact DOB is unknown.">
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    id="ageYears"
                    type="number"
                    min={0}
                    max={150}
                    value={ageYears}
                    onChange={(e) => setAgeYears(e.target.value)}
                    className={cn(dashboardPremium.inputClass, 'pl-11')}
                    placeholder="—"
                  />
                </div>
              </Field>
              <div className="hidden sm:block" aria-hidden />
            </div>
            <Field id="address" label="Address">
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={dashboardPremium.textareaClass}
                placeholder="Street, area, city…"
              />
            </Field>
          </SectionCard>

          <div className="flex flex-col-reverse gap-3 border-t border-zinc-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard/patients"
              className={cn(
                dashboardPremium.ghostBtn,
                'w-full justify-center sm:w-auto',
              )}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !requiredComplete}
              className={cn(dashboardPremium.primaryBtn, 'w-full min-h-[48px] justify-center sm:w-auto sm:min-w-[12rem]')}
            >
              {loading ? 'Creating patient…' : 'Create patient'}
            </button>
          </div>
        </form>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-4">
          <div
            className={cn(
              dashboardPremium.panelClass,
              'overflow-hidden p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-6',
            )}
          >
            <p className={dashboardPremium.labelClass}>Readiness</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold tabular-nums text-zinc-950">{progressPct}%</p>
              <p className="text-right text-xs text-zinc-500">Required fields</p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Required fields completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" strokeWidth={2} aria-hidden />
                  )}
                  <span className={cn('leading-snug', item.done ? 'text-zinc-800' : 'text-zinc-500')}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <DashboardInfoCallout tone="violet">
            <span className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              <span>
                After saving, you can open the patient profile to add identifiers, city, pincode, or link them to an
                order from the Orders screen.
              </span>
            </span>
          </DashboardInfoCallout>
        </aside>
      </div>
    </DashboardPageScaffold>
  );
}
