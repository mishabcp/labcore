'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AuthPasswordInput,
  AuthPremiumShell,
  AuthPremiumSubmitButton,
  AUTH_ERROR_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PAGE_SUBTITLE_CLASS,
  AUTH_PAGE_TITLE_CLASS,
  AUTH_SECONDARY_LINK_CLASS,
} from '@/components/auth-premium-shell';
import { authDebug, friendlyAuthFetchError, isAuthDebugEnabled } from '@/lib/auth-debug';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const loginUrl = `${API_URL}/auth/login`;
    const payload = identifier.includes('@')
      ? { email: identifier, password }
      : { mobile: identifier, password };
    try {
      authDebug('login:request', {
        apiUrl: API_URL,
        loginUrl,
        pageOrigin: typeof window !== 'undefined' ? window.location.origin : '(ssr)',
        identifierKind: 'email' in payload ? 'email' : 'mobile',
        envNextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? '(unset, using fallback)',
      });
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const elapsedMs =
        typeof performance !== 'undefined' ? Math.round(performance.now() - t0) : undefined;
      const raw = await res.text();
      authDebug('login:response', {
        status: res.status,
        ok: res.ok,
        elapsedMs,
        contentType: res.headers.get('content-type'),
        bodyLength: raw.length,
        bodyPreview: raw.slice(0, 280),
      });
      let data: { message?: string; accessToken?: string; refreshToken?: string; user?: unknown };
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch (parseErr) {
        if (isAuthDebugEnabled()) {
          console.error('[LabCore auth] login: JSON parse failed', parseErr);
        }
        throw new Error(`Login: server returned non-JSON (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data.message ?? 'Login failed');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (isAuthDebugEnabled()) {
        console.error('[LabCore auth] login:error', {
          message,
          name: err instanceof Error ? err.name : typeof err,
          loginUrl,
          hint:
            message === 'Failed to fetch'
              ? 'Network/CORS/mixed-content or API not listening on apiUrl; check DevTools Network tab.'
              : undefined,
        });
      }
      setError(friendlyAuthFetchError(message, API_URL));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPremiumShell mainAriaLabel="Login" regionAriaLabel="Sign in form">
      <header className="pb-2 text-center sm:pb-3">
        <h2 className={AUTH_PAGE_TITLE_CLASS}>Sign in</h2>
        <p className={`${AUTH_PAGE_SUBTITLE_CLASS} mx-auto max-w-[22rem] text-pretty`}>
          Use the credentials issued by your lab administrator.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3 sm:mt-9 sm:space-y-3.5">
        <div>
          <label htmlFor="identifier" className={AUTH_LABEL_CLASS}>
            Email or mobile
          </label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="you@lab.com"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            Password
          </label>
          <AuthPasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Password"
            required
          />
        </div>
        {error && (
          <p className={`${AUTH_ERROR_CLASS} text-pretty break-words`} role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <AuthPremiumSubmitButton loading={loading} loadingLabel="Signing in…">
          Sign in
        </AuthPremiumSubmitButton>
      </form>

      <footer className="mt-8 border-t border-slate-200/70 pt-6 text-center text-xs text-slate-500 sm:mt-9 sm:text-sm">
        <p className="leading-snug">
          <Link href="/register" className={AUTH_LINK_CLASS}>
            Register a lab
          </Link>
        </p>
        <p className="mt-2.5 leading-snug sm:mt-2">
          Need help?{' '}
          <Link href="/manual" className={`${AUTH_SECONDARY_LINK_CLASS} whitespace-nowrap`}>
            User manual
          </Link>
        </p>
      </footer>
    </AuthPremiumShell>
  );
}
