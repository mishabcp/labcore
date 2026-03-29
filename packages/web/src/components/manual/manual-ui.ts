/**
 * Manual page layout tokens. `scrollMtSection` aligns in-page anchors with the sticky header;
 * keep in sync with `ManualHeader` vertical padding + 2px progress bar.
 */
export const manualLayout = {
  scrollMtSection: 'scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))]',
} as const;

/**
 * Centered width: full-bleed below `lg`, then **80% of viewport** (`w-4/5`). Pair with `manualPageGutterXClass`.
 */
export const manualPageWidthClass = 'mx-auto w-full min-w-0 max-w-full lg:w-4/5';

/** Responsive horizontal padding; safe-area insets on X for notched devices. */
export const manualPageGutterXClass =
  'pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:pl-4 sm:pr-4 md:pl-6 md:pr-6 lg:pl-6 lg:pr-6 xl:pl-8 xl:pr-8';
