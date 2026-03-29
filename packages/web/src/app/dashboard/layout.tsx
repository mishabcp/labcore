'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AuthLogoMark, authUi } from '@/components/auth-premium-shell';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Single hop (adjacent items): ~300ms */
const PILL_DURATION_SINGLE_CLASS = 'motion-safe:duration-300';
/** Multi-hop chain: must fit within `HOP_INTERVAL_MS` so each leg finishes before the next target */
const PILL_DURATION_HOP_CLASS = 'motion-safe:duration-[160ms]';
/** Material-standard-ish easing */
const PILL_EASE_CLASS = 'motion-safe:ease-[cubic-bezier(0.2,0,0,1)]';
/** Time between applying each intermediate index (ms); slightly > hop duration so motion settles per row */
const HOP_INTERVAL_MS = 175;

function navItemIsActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  const h = href.replace(/\/$/, '') || '/';
  if (h === '/dashboard') return p === '/dashboard';
  return p === h || p.startsWith(`${h}/`);
}

type NavItem = { href: string; label: string };

function readActiveIndex(path: string, list: NavItem[]): number {
  return list.findIndex((item) => navItemIsActive(path, item.href));
}

const pillBaseClass = cn(
  'pointer-events-none absolute left-0 right-0 top-0 z-0 rounded-xl',
  'bg-gradient-to-br from-white/95 via-teal-50/55 to-violet-50/40',
  'shadow-[0_0_0_1px_rgba(167,243,208,0.55),0_10px_36px_-18px_rgba(124,58,237,0.28),0_6px_20px_-12px_rgba(13,148,136,0.14)]',
  'ring-1 ring-inset ring-white/70 backdrop-blur-[3px]',
  'motion-safe:transition-[transform,height,opacity] motion-reduce:transition-none',
  PILL_EASE_CLASS,
);

function linkSurfaceClass(active: boolean) {
  return cn(
    'relative z-10 flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-medium outline-none',
    'transition-[color,transform] duration-200 ease-out motion-reduce:transition-none',
    active
      ? 'font-semibold text-slate-900'
      : 'text-slate-600 hover:bg-slate-50/70 hover:text-slate-900 active:scale-[0.99] motion-reduce:active:scale-100',
  );
}

/**
 * Highlight morphs along the list. Skipping rows (Dashboard → Orders) runs a timed chain so the pill
 * visibly passes through each intermediate item—same idea as stepped shared-element / container motion.
 */
function SlidingNavTrack({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const settledPathRef = useRef<string | null>(null);
  const sequentialRunningRef = useRef(false);
  const hopGenRef = useRef(0);

  const [pill, setPill] = useState({ top: 0, height: 0, opacity: 0 });
  const [enableTransition, setEnableTransition] = useState(false);
  const [useHopDuration, setUseHopDuration] = useState(false);

  const setLinkRef = useCallback((href: string, el: HTMLAnchorElement | null) => {
    if (el) linkRefs.current[href] = el;
    else delete linkRefs.current[href];
  }, []);

  const applyIndex = useCallback((index: number) => {
    const it = items[index];
    if (!it) return;
    const el = linkRefs.current[it.href];
    if (!el) return;
    setPill({ top: el.offsetTop, height: el.offsetHeight, opacity: 1 });
  }, [items]);

  const syncPillToPathname = useCallback(() => {
    const active = items.find((item) => navItemIsActive(pathname, item.href));
    if (!active) {
      setPill((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const el = linkRefs.current[active.href];
    if (!el) return;
    setPill({ top: el.offsetTop, height: el.offsetHeight, opacity: 1 });
  }, [items, pathname]);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const newIdx = readActiveIndex(pathname, items);

    const fromPath = settledPathRef.current;
    if (fromPath === null) {
      settledPathRef.current = pathname;
      setUseHopDuration(false);
      syncPillToPathname();
      setEnableTransition(false);
      hopGenRef.current += 1;
      requestAnimationFrame(() => setEnableTransition(true));
      return;
    }

    const oldIdx = readActiveIndex(fromPath, items);

    const finishDirect = () => {
      settledPathRef.current = pathname;
      setUseHopDuration(false);
      syncPillToPathname();
      setEnableTransition(false);
      hopGenRef.current += 1;
      requestAnimationFrame(() => setEnableTransition(true));
    };

    if (prefersReduced || newIdx < 0 || oldIdx < 0 || oldIdx === newIdx) {
      finishDirect();
      return;
    }

    const gap = Math.abs(newIdx - oldIdx);
    if (gap <= 1) {
      finishDirect();
      return;
    }

    const pathIndices: number[] = [];
    if (newIdx > oldIdx) {
      for (let i = oldIdx + 1; i <= newIdx; i++) pathIndices.push(i);
    } else {
      for (let i = oldIdx - 1; i >= newIdx; i--) pathIndices.push(i);
    }

    const gen = ++hopGenRef.current;
    sequentialRunningRef.current = true;
    setUseHopDuration(true);

    applyIndex(oldIdx);
    setEnableTransition(false);

    let outerRaf = 0;
    let innerRaf = 0;
    const pendingTimeout: { id?: ReturnType<typeof setTimeout> } = {};

    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (hopGenRef.current !== gen) return;
        setEnableTransition(true);
        let step = 0;
        const tick = () => {
          if (hopGenRef.current !== gen) return;
          applyIndex(pathIndices[step]);
          step += 1;
          if (step < pathIndices.length) {
            pendingTimeout.id = setTimeout(tick, HOP_INTERVAL_MS);
          } else {
            sequentialRunningRef.current = false;
            settledPathRef.current = pathname;
            setUseHopDuration(false);
          }
        };
        tick();
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      if (pendingTimeout.id !== undefined) clearTimeout(pendingTimeout.id);
      hopGenRef.current += 1;
      sequentialRunningRef.current = false;
    };
  }, [pathname, items, applyIndex, syncPillToPathname]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onResize = () => {
      if (sequentialRunningRef.current) return;
      syncPillToPathname();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(track);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [syncPillToPathname]);

  const activeHref = items.find((item) => navItemIsActive(pathname, item.href))?.href;

  return (
    <div ref={trackRef} className="relative flex flex-col space-y-1">
      <div
        aria-hidden
        className={cn(
          pillBaseClass,
          useHopDuration ? PILL_DURATION_HOP_CLASS : PILL_DURATION_SINGLE_CLASS,
          !enableTransition && 'transition-none',
        )}
        style={{
          transform: `translate3d(0,${pill.top}px,0)`,
          height: Math.max(pill.height, 0),
          opacity: pill.opacity,
        }}
      />
      {items.map(({ href, label }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            ref={(el) => setLinkRef(href, el)}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={linkSurfaceClass(active)}
            onClick={onNavigate}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

type SidebarUser = { name: string; labName: string; role: string } | null;

function DashboardSidebarNav({
  pathname,
  user,
  t,
  onNavigate,
}: {
  pathname: string;
  user: SidebarUser;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const primaryItems: NavItem[] = useMemo(() => {
    const list: NavItem[] = [
      { href: '/dashboard', label: t('nav.dashboard') },
      { href: '/dashboard/patients', label: t('nav.patients') },
      { href: '/dashboard/orders', label: t('nav.orders') },
      { href: '/dashboard/samples', label: t('nav.samples') },
      { href: '/dashboard/results', label: t('nav.results') },
      { href: '/dashboard/reports', label: t('nav.reports') },
    ];
    if (user?.role === 'admin') {
      list.push({ href: '/dashboard/rate-cards', label: 'Rate Cards' });
    }
    return list;
  }, [t, user?.role]);

  const settingsItems: NavItem[] = useMemo(
    () => [
      { href: '/dashboard/settings/users', label: t('settings.users') },
      { href: '/dashboard/settings/lab-profile', label: t('settings.labProfile') },
      { href: '/dashboard/settings/tests', label: 'Test Master' },
    ],
    [t],
  );

  return (
    <nav className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" aria-label="Dashboard navigation">
      <SlidingNavTrack items={primaryItems} pathname={pathname} onNavigate={onNavigate} />

      {user?.role === 'admin' && (
        <div className="mt-4 border-t border-slate-200/80 pt-4">
          <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">{t('nav.settings')}</p>
          <div className="mt-2">
            <SlidingNavTrack items={settingsItems} pathname={pathname} onNavigate={onNavigate} />
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">Help & Support</p>
        <Link
          href="/manual"
          className={cn(
            'mt-2 flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-medium text-violet-700 transition-[background-color,color,transform] duration-200 hover:bg-violet-50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
          )}
          onClick={onNavigate}
        >
          User Manual
        </Link>
      </div>
    </nav>
  );
}

const sidebarShellClass =
  'flex h-full flex-col border-r border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/40 shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)]';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useTranslation();
  const [user, setUser] = useState<{ name: string; labName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.replace('/login');
      });
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const closeIfDesktop = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', closeIfDesktop);
    return () => mq.removeEventListener('change', closeIfDesktop);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const id = requestAnimationFrame(() => mobileCloseRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [sidebarOpen]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setSidebarOpen(false);
    router.replace('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  const closeMobile = () => setSidebarOpen(false);

  const logoutClass = cn(
    'mt-4 block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition-[background-color,color,border-color,transform] duration-200 hover:border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-800 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
  );

  return (
    <div
      className={cn(
        'flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-slate-50/50',
        authUi.className,
      )}
    >
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close navigation menu"
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden motion-reduce:transition-none',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        tabIndex={-1}
        onClick={closeMobile}
      />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          sidebarShellClass,
          'hidden min-h-0 w-64 shrink-0 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-500 motion-reduce:animate-none lg:flex',
        )}
        aria-label="Main navigation"
      >
        <div className="px-0.5">
          <AuthLogoMark
            className="justify-start gap-2.5"
            glyphClassName="!h-9 !w-9 sm:!h-9 sm:!w-9"
            wordmarkClassName="!text-lg sm:!text-lg"
          />
        </div>
        <DashboardSidebarNav pathname={pathname} user={user} t={t} />
        <button type="button" onClick={handleLogout} className={logoutClass}>
          {t('common.logout')}
        </button>
      </aside>

      {/* Mobile drawer */}
      <aside
        id="dashboard-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
        className={cn(
          sidebarShellClass,
          'fixed inset-y-0 left-0 z-50 w-[min(18.5rem,calc(100vw-1.25rem))] max-w-[100vw] p-4 shadow-[8px_0_32px_-12px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden',
          sidebarOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100/90 pb-3">
          <AuthLogoMark
            className="min-w-0 flex-1 justify-start gap-2.5"
            glyphClassName="!h-9 !w-9 sm:!h-9 sm:!w-9"
            wordmarkClassName="!text-lg sm:!text-lg truncate"
          />
          <button
            ref={mobileCloseRef}
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            aria-label="Close navigation menu"
            onClick={closeMobile}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <DashboardSidebarNav pathname={pathname} user={user} t={t} onNavigate={closeMobile} />
        <button type="button" onClick={handleLogout} className={logoutClass}>
          {t('common.logout')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col" role="region" aria-label="Dashboard content">
        <header
          className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4"
          role="banner"
        >
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-slate-50 hover:shadow active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 lg:hidden"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-mobile-nav"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open navigation menu</span>
          </button>
          {user ? (
            <p className="min-w-0 flex-1 truncate text-sm text-slate-600">
              {user.name} · {user.labName}
            </p>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="language-select" className="hidden text-sm text-slate-500 sm:inline">
              {t('settings.language')}:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ml')}
              className="max-w-[7.5rem] rounded-lg border border-slate-200/90 bg-white py-2 pl-2 pr-7 text-sm text-slate-800 shadow-sm transition-[border-color,box-shadow] duration-200 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:max-w-none"
              aria-label="Select language"
            >
              <option value="en">{t('settings.english')}</option>
              <option value="ml">{t('settings.malayalam')}</option>
            </select>
          </div>
        </header>
        <main
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          aria-label="Page content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
