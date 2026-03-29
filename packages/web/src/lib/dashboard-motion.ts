/**
 * Dashboard overview entrance motion (tailwindcss-animate).
 *
 * When it runs: only after `loading === false` in `app/dashboard/page.tsx` — the data
 * tree mounts once; skeleton has its own lighter `skeletonShell`. No per-navigation replay
 * unless the page remounts.
 *
 * Direction: horizontal slide-from-left / slide-from-right (alternating on KPIs, chart pair,
 * workload tiles; main trends column from left, pipeline from right; bottom row L/R).
 *
 * Timing: ~400–450ms, ease-out, staggered delays (short, readable).
 *
 * Reduced motion: `motion-safe:*` gates slide+fade keyframes; `motion-reduce:animate-none`
 * + full opacity so layout appears instantly without translation.
 *
 * Charts: wrappers keep fixed pixel height in `dashboard-detailed-trend-charts` — only the
 * card shell animates; no height animation.
 *
 * Mobile: parent uses `overflow-x-hidden` so off-screen translate does not cause horizontal scroll.
 */

export const dashboardMotion = {
  /** Full overview region — subtle fade + slight slide-in from left */
  pageEnter:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-400 motion-safe:ease-out motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100',

  heroEnter:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-5 motion-safe:duration-400 motion-safe:ease-out motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100',

  /** KPI row: odd cards from left, even from right; staggered delay */
  kpiStaggerGrid:
    '[&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in [&>*]:motion-safe:duration-400 [&>*]:motion-safe:ease-out [&>*]:motion-safe:fill-mode-both motion-reduce:[&>*]:animate-none [&>*:nth-child(1)]:motion-safe:slide-in-from-left-5 [&>*:nth-child(1)]:motion-safe:delay-0 [&>*:nth-child(2)]:motion-safe:slide-in-from-right-5 [&>*:nth-child(2)]:motion-safe:delay-75 [&>*:nth-child(3)]:motion-safe:slide-in-from-left-5 [&>*:nth-child(3)]:motion-safe:delay-150 [&>*:nth-child(4)]:motion-safe:slide-in-from-right-5 [&>*:nth-child(4)]:motion-safe:delay-225',

  /** Trends + charts column (lg:col-span-2) */
  trendsMainEnter:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 motion-safe:duration-400 motion-safe:delay-100 motion-safe:ease-out motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:delay-0',

  /** Pipeline / orders-by-status column */
  trendsSideEnter:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-6 motion-safe:duration-400 motion-safe:delay-150 motion-safe:ease-out motion-safe:fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:delay-0',

  /** Orders chart from left, revenue chart from right */
  chartPairStagger:
    '[&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in [&>*]:motion-safe:duration-400 [&>*]:motion-safe:ease-out [&>*]:motion-safe:fill-mode-both motion-reduce:[&>*]:animate-none [&>*:nth-child(1)]:motion-safe:slide-in-from-left-4 [&>*:nth-child(1)]:motion-safe:delay-0 [&>*:nth-child(2)]:motion-safe:slide-in-from-right-4 [&>*:nth-child(2)]:motion-safe:delay-100',

  /** Queue vs Finance sections */
  bottomRowEnter:
    '[&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in [&>*]:motion-safe:duration-450 [&>*]:motion-safe:ease-out [&>*]:motion-safe:fill-mode-both motion-reduce:[&>*]:animate-none [&>*:nth-child(1)]:motion-safe:slide-in-from-left-5 [&>*:nth-child(1)]:motion-safe:delay-0 [&>*:nth-child(2)]:motion-safe:slide-in-from-right-5 [&>*:nth-child(2)]:motion-safe:delay-100',

  /** Workload tiles: alternating L/R */
  workloadTileGrid:
    '[&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in [&>*]:motion-safe:duration-400 [&>*]:motion-safe:ease-out [&>*]:motion-safe:fill-mode-both motion-reduce:[&>*]:animate-none [&>*:nth-child(1)]:motion-safe:slide-in-from-left-4 [&>*:nth-child(1)]:motion-safe:delay-0 [&>*:nth-child(2)]:motion-safe:slide-in-from-right-4 [&>*:nth-child(2)]:motion-safe:delay-75 [&>*:nth-child(3)]:motion-safe:slide-in-from-left-4 [&>*:nth-child(3)]:motion-safe:delay-150 [&>*:nth-child(4)]:motion-safe:slide-in-from-right-4 [&>*:nth-child(4)]:motion-safe:delay-225',

  skeletonShell:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none motion-reduce:opacity-100',
} as const;
