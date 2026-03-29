'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

/** Lucide-accurate lemniscate, scaled for 24×24 */
const INFINITY_D =
  'M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8';

/**
 * LabCore wordmark glyph — infinity with violet→teal gradient, soft pad, and depth stroke.
 */
export function LabCoreLogoGlyph({ className }: Props) {
  const uid = useId().replace(/:/g, '');
  const gradId = `lcinf-grad-${uid}`;

  return (
    <svg
      className={cn(
        'h-10 w-10 shrink-0 sm:h-11 sm:w-11',
        'drop-shadow-[0_2px_10px_rgba(124,58,237,0.18)]',
        className,
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="3" y1="9" x2="21" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d28d9" />
          <stop offset="0.42" stopColor="#7c3aed" />
          <stop offset="0.58" stopColor="#0d9488" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" className="fill-violet-100/50" />
      <path
        d={INFINITY_D}
        className="stroke-white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d={INFINITY_D}
        stroke={`url(#${gradId})`}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
