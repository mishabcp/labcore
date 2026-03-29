'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Header: bordered pill. Footer: text-style to match other links. */
  variant: 'header' | 'footer';
};

export function ManualBackButton({ className, variant }: Props) {
  const router = useRouter();

  function handleBack() {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/login');
    }
  }

  const base =
    variant === 'header'
      ? 'inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-slate-50 hover:shadow active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100'
      : 'inline-flex min-h-[44px] items-center gap-1.5 font-medium text-violet-600 underline decoration-violet-300/60 underline-offset-4 hover:text-violet-700';

  return (
    <button type="button" onClick={handleBack} className={cn(base, className)}>
      <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      Back
    </button>
  );
}
