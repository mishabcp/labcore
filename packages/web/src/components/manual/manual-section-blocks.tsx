'use client';

import { useCallback, useState } from 'react';
import { Link2 } from 'lucide-react';
import { manualLayout } from '@/components/manual/manual-ui';
import { cn } from '@/lib/utils';

export function ManualProse({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'max-w-[42rem] space-y-3 text-sm leading-relaxed text-slate-600 sm:space-y-4 sm:text-[0.9375rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Full-width block inside a section (tables, figures) — not constrained by prose max-width */
export function ManualMedia({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('w-full min-w-0', className)}>{children}</div>;
}

function CopySectionLink({ id, heading }: { id: string; heading: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      const url = `${window.location.origin}/manual#${id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [id]);

  return (
    <div className="manual-print-hide flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-500 shadow-sm transition-[background-color,color,border-color,transform] duration-200 hover:border-violet-200 hover:text-violet-700 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        aria-label={`Copy link to section: ${heading}`}
      >
        <Link2 className="h-4 w-4" aria-hidden />
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Section link copied to clipboard' : ''}
      </span>
    </div>
  );
}

export function ManualSection({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        'manual-print-section rounded-2xl border border-slate-200/80 border-l-[3px] border-l-teal-500/45 bg-white/92 p-4 shadow-[0_24px_56px_-28px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-[6px] sm:rounded-[1.75rem] sm:p-6 md:p-8',
        manualLayout.scrollMtSection,
      )}
    >
      {kicker && (
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-violet-600/90">{kicker}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
        <h2 className="text-balance text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <CopySectionLink id={id} heading={title} />
      </div>
      <div className="mt-4 min-w-0 sm:mt-5">{children}</div>
    </section>
  );
}

export function ManualOl({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-2.5 pl-5 marker:font-medium marker:text-teal-600">
      {items.map((t) => (
        <li key={t} className="pl-1 text-slate-600">
          {t}
        </li>
      ))}
    </ol>
  );
}
