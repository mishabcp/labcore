'use client';

import { AuthMeshBackground, authUi } from '@/components/auth-premium-shell';
import { cn } from '@/lib/utils';

/** Root: print class, auth focus ring, mesh, skip link — wraps header + main + floating UI */
export function ManualPageChrome({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'manual-print-root auth-shell relative min-h-[100dvh] overflow-x-hidden text-slate-900 antialiased',
        authUi.className,
        className,
      )}
    >
      <AuthMeshBackground className="manual-print-hide" />
      <a href="#manual-article" className="skip-link focus:z-[200]">
        Skip to manual content
      </a>
      {children}
    </div>
  );
}
