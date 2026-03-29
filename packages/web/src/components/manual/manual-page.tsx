'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronUp, ExternalLink } from 'lucide-react';
import { ManualBackButton } from '@/components/manual/manual-back-button';
import { ManualHeader } from '@/components/manual/manual-header';
import { ManualMedia, ManualOl, ManualProse, ManualSection } from '@/components/manual/manual-section-blocks';
import { ManualPageChrome } from '@/components/manual/manual-shell';
import { manualPageGutterXClass, manualPageWidthClass } from '@/components/manual/manual-ui';
import { EndToEndFlowchart, ResultPipelineFlowchart, SampleLifecycleFlowchart } from '@/components/manual/manual-flowcharts';
import { cn } from '@/lib/utils';

export function ManualPage() {
  const [readPct, setReadPct] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const sh = el.scrollHeight - el.clientHeight;
      setReadPct(sh > 0 ? Math.min(100, Math.max(0, (el.scrollTop / sh) * 100)) : 0);
      setShowBackTop(el.scrollTop > 360);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, []);

  return (
    <ManualPageChrome>
      <ManualHeader readPct={readPct} />

      {/* manual:body — scrolls under sticky header; z below header chrome */}
      <main aria-label="LabCore user manual" className="relative z-[1]">
        <div
          className={cn(
            manualPageWidthClass,
            manualPageGutterXClass,
            'pb-[calc(4rem+env(safe-area-inset-bottom,0px))] pt-6 sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pt-8 md:pt-10',
          )}
        >
          {/* manual:intro */}
          <header className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100">
            <p className="max-w-full text-pretty text-sm leading-relaxed text-slate-600 sm:max-w-2xl sm:text-base md:max-w-3xl">
              Step-by-step guidance for day-to-day use: registration through reporting. Scroll to browse sections. The
              dashboard UI can be switched to Malayalam; this guide is in English.
            </p>
            <p className="mt-3 text-xs text-slate-500 sm:hidden">Version 1.0 · Last updated February 2026</p>
          </header>

          <article
            id="manual-article"
            className="mt-8 min-w-0 space-y-8 sm:mt-10 sm:space-y-10 lg:mt-12 lg:space-y-12"
          >
                <ManualSection id="getting-started" title="Getting started" kicker="Section 1">
                  <ManualProse>
                    <h3 className="!mt-0 text-base font-semibold tracking-tight text-slate-900">Signing in</h3>
                    <ManualOl
                      items={[
                        'Open LabCore in your browser (your lab URL or local dev).',
                        'Enter your email or mobile number and password.',
                        'Choose Sign in. You are taken to the Dashboard.',
                      ]}
                    />
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Demo environment</h3>
                    <p>
                      To explore a populated demo lab, use any of the accounts below. Need an account for your own lab? Use{' '}
                      <Link
                        href="/register"
                        className="font-medium text-violet-600 underline decoration-violet-300/60 underline-offset-4 hover:text-violet-700"
                      >
                        Register a lab
                      </Link>{' '}
                      or ask your administrator.
                    </p>
                  </ManualProse>
                  <ManualMedia className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/40">
                    <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
                      <caption className="sr-only">Demo lab sign-in accounts by role</caption>
                      <thead>
                        <tr className="border-b border-slate-200/90 bg-white/90">
                          <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                            Role
                          </th>
                          <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                            Email
                          </th>
                          <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                            Mobile
                          </th>
                          <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                            Dashboard focus
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 text-slate-600">
                        {[
                          ['Admin', 'admin@demolab.com', '9847100001', 'Full access, revenue, settings'],
                          ['Pathologist', 'pathologist@demolab.com', '9847100002', 'Results awaiting authorisation'],
                          ['Senior technician', 'srtech@demolab.com', '9847100003', 'Samples → result entry'],
                          ['Technician / phlebotomist', 'tech@demolab.com', '9847100004', 'Orders awaiting collection'],
                          ['Front desk', 'frontdesk@demolab.com', '9847100005', 'Registration & lookup'],
                        ].map(([role, email, mobile, note]) => (
                          <tr key={role} className="bg-white/60 transition-colors hover:bg-white/95">
                            <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">
                              {role}
                            </th>
                            <td className="px-4 py-2.5 font-mono text-[0.7rem] sm:text-xs">{email}</td>
                            <td className="px-4 py-2.5 font-mono text-[0.7rem] sm:text-xs">{mobile}</td>
                            <td className="px-4 py-2.5">{note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ManualMedia>
                  <p className="mt-3 text-center text-xs font-medium text-slate-500">Password for all demo users: demo123</p>
                  <ManualProse className="!mt-8">
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Navigation</h3>
                    <p>
                      After sign-in, the left sidebar lists Patients, Orders, Samples, Results, Reports, and more. Admins also see Rate Cards and Settings. The header shows your name, lab, and the language control (English / Malayalam).
                    </p>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Signing out</h3>
                    <p>Use Logout at the bottom of the sidebar to end your session and return to the sign-in page.</p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="dashboard" title="Dashboard" kicker="Section 2">
                  <ManualProse>
                    <p>
                      The dashboard summarizes today&apos;s work: patients registered, tests ordered, reports generated and delivered, pending authorisation, pending samples, average turnaround time, revenue (today / week / month), and payment-mode breakdown. Click a metric card when the app links it to a detail view.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="patients" title="Patient registration" kicker="Section 3">
                  <ManualProse>
                    <h3 className="!mt-0 text-base font-semibold tracking-tight text-slate-900">New patient</h3>
                    <ManualOl
                      items={[
                        'Open Patients → + New Patient.',
                        'Enter name (required), age or date of birth, gender (required), mobile (required), and optional email / address.',
                        'Save. A patient ID is assigned (format LC-YYYYMMDD-NNNN).',
                      ]}
                    />
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Lookup & edit</h3>
                    <p>
                      Search by name, mobile, or patient ID from the Patients list. Open a row to view the profile, edit fields, and save, or start a new order from there.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="orders" title="Order entry" kicker="Section 4">
                  <ManualProse>
                    <h3 className="!mt-0 text-base font-semibold tracking-tight text-slate-900">Create an order</h3>
                    <ManualOl
                      items={[
                        'Orders → + New Order. Select or create a patient (pre-filled when opened from a profile).',
                        'Add tests via the searchable list; panels add multiple tests; remove lines with ×.',
                        'Set priority (routine / urgent / STAT), optional discount, optional referring doctor.',
                        'Submit. An invoice is created, samples are planned from tube types, and you land on the order detail page.',
                      ]}
                    />
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Order list</h3>
                    <p>
                      The list shows order code, patient, date, test count, priority, and status. Open any row for samples, results, and billing.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="samples" title="Sample management" kicker="Section 5">
                  <ManualProse>
                    <p>
                      Under Samples, work is grouped by status. Use the row action to advance Ordered → Collected → Received → In Process. Each change records user and time. To reject, choose Rejected and pick a reason (hemolyzed, QNS, wrong tube, etc.) plus an optional note.
                    </p>
                  </ManualProse>
                  <div className="mt-6 grid min-w-0 gap-6 sm:mt-8 sm:gap-8 md:grid-cols-2 md:items-start">
                    <ManualMedia>
                      <SampleLifecycleFlowchart />
                    </ManualMedia>
                    <div className="flex min-w-0 max-w-[42rem] flex-col justify-center lg:max-w-none">
                      <ManualProse>
                        <h3 className="!mt-0 text-base font-semibold tracking-tight text-slate-900">Status reference</h3>
                        <ul className="list-disc space-y-1.5 pl-5 marker:text-teal-600">
                          {[
                            'Ordered — requested, not collected',
                            'Collected — drawn from patient',
                            'Received — at the laboratory',
                            'In process — testing underway',
                            'Completed — results entered',
                            'Rejected — unsuitable; reason stored',
                          ].map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </ManualProse>
                    </div>
                  </div>
                </ManualSection>

                <ManualSection id="results" title="Result entry" kicker="Section 6">
                  <div className="grid min-w-0 gap-6 sm:gap-8 md:grid-cols-2 md:items-start">
                    <ManualProse>
                      <p>
                        Results lists your worklist with filters: Pending, Entered, Reviewed, Authorised. Open Enter / View on a line to fill parameters, see reference ranges and auto flags (L/H/C), use dropdowns for qualitative tests, or the editor for narrative reports. Save moves the row to Entered.
                      </p>
                      <p>You may edit while status is Entered or Reviewed. Authorised results are locked except through formal amendment.</p>
                    </ManualProse>
                    <ManualMedia>
                      <ResultPipelineFlowchart />
                    </ManualMedia>
                  </div>
                </ManualSection>

                <ManualSection id="authorisation" title="Result authorisation" kicker="Section 7">
                  <ManualProse>
                    <p>
                      Pathologists filter to Entered or Reviewed, open a result, verify values and flags, add interpretive comments if needed, then Authorise. That locks the result, generates the PDF report, and records who signed off. Use Reject with a required comment to send work back to the bench.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="reports" title="Reports" kicker="Section 8">
                  <ManualProse>
                    <p>
                      Reports lists generated PDFs with codes, versions, patient, order, and date. Download a single PDF, share via WhatsApp (prefilled message and link; link lifetime and audit logging depend on your deployment), or select multiple rows and download selected. Patient PDFs include letterhead, demographics, results, comments, signature, and verification QR when configured.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="invoices" title="Invoices & billing" kicker="Section 9">
                  <ManualProse>
                    <p>
                      Invoices & Billing shows patient, order, dates, totals, due balance, and status (paid / partial / pending). Open details for line items, GST, discounts, payment history, and recording split payments by mode (cash, UPI, card, etc.). Print or download PDF when available.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="settings" title="Settings (admin only)" kicker="Section 10">
                  <ManualProse>
                    <p>
                      <strong className="font-semibold text-slate-800">Users</strong> — add staff, roles (admin, pathologist, senior technician, technician, front desk), passwords, deactivate accounts.
                    </p>
                    <p>
                      <strong className="font-semibold text-slate-800">Lab profile</strong> — lab identity, GST, logo, pathologist names and signatures, NABL fields.
                    </p>
                    <p>
                      <strong className="font-semibold text-slate-800">Test master</strong> — catalogue, custom tests, reference ranges by age/gender, pricing, deactivate tests.
                    </p>
                    <p>
                      <strong className="font-semibold text-slate-800">Rate cards</strong> — default and alternate price lists for channels or categories.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="language" title="Language & preferences" kicker="Section 11">
                  <ManualProse>
                    <p>
                      Use the language control in the dashboard header to switch English and Malayalam. The choice persists for your next visit.
                    </p>
                  </ManualProse>
                </ManualSection>

                <ManualSection id="workflows" title="Quick reference" kicker="Section 12">
                  <div className="grid min-w-0 gap-6 sm:gap-8 md:grid-cols-2 md:items-start lg:gap-10">
                    <ManualMedia>
                      <EndToEndFlowchart />
                    </ManualMedia>
                    <div className="min-w-0 space-y-6">
                      <div className="max-w-[42rem] rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-6 lg:max-w-none">
                        <h3 className="text-base font-semibold tracking-tight text-slate-900">Roles at a glance</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                          {[
                            ['Front desk', 'Registration, orders, samples, payments, sharing reports'],
                            ['Technician', 'Collect/receive samples, enter results'],
                            ['Senior technician', 'Technician duties plus result review'],
                            ['Pathologist', 'Review, authorise, amend, interpretive comments'],
                            ['Admin', 'All of the above plus users, master data, rate cards, lab profile'],
                          ].map(([role, body]) => (
                            <li key={role}>
                              <span className="font-semibold text-slate-800">{role}</span> — {body}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="max-w-[42rem] text-xs leading-relaxed text-slate-500 lg:max-w-none">
                        Administrator and deployment topics live in the project docs under{' '}
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.7rem]">docs/post-completion/</code>{' '}
                        if you have repository access.
                      </p>
                    </div>
                  </div>
                </ManualSection>

                <footer className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 px-4 py-5 text-center text-sm text-slate-500 sm:px-5 sm:py-6">
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                    <ManualBackButton variant="footer" className="manual-print-hide" />
                    <span className="hidden text-slate-300 sm:inline" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/dashboard"
                      className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-violet-600 underline decoration-violet-300/60 underline-offset-4 hover:text-violet-700"
                    >
                      Open dashboard
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    </Link>
                    <span className="hidden text-slate-300 sm:inline" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/login"
                      className="inline-flex min-h-[44px] items-center font-medium text-violet-600 underline decoration-violet-300/60 underline-offset-4 hover:text-violet-700"
                    >
                      Sign in
                    </Link>
                  </div>
                </footer>
          </article>
        </div>
      </main>

      {/* manual:floating — below header z-50; clear safe areas */}
      <button
        type="button"
        onClick={scrollTop}
        className={cn(
          'manual-print-hide fixed z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-lg backdrop-blur-sm transition-[opacity,transform,visibility] duration-200 hover:bg-slate-50 motion-reduce:transition-none',
          'bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))]',
          showBackTop ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        aria-label="Back to top"
      >
        <ChevronUp className="h-6 w-6" aria-hidden />
      </button>
    </ManualPageChrome>
  );
}
