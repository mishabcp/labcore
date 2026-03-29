'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AuthPasswordInput,
  AuthPremiumShell,
  AuthPremiumSubmitButton,
  AUTH_ERROR_CLASS,
  AUTH_HINT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PAGE_TITLE_CLASS,
} from '@/components/auth-premium-shell';
import { authDebug, friendlyAuthFetchError, isAuthDebugEnabled } from '@/lib/auth-debug';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function RegisterLabPage() {
  const router = useRouter();
  const [labName, setLabName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const registerUrl = `${API_URL}/auth/register-lab`;
    try {
      authDebug('register:request', {
        apiUrl: API_URL,
        registerUrl,
        pageOrigin: typeof window !== 'undefined' ? window.location.origin : '(ssr)',
        envNextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? '(unset, using fallback)',
      });
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      const res = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labName,
          adminName,
          adminMobile,
          adminEmail,
          password,
        }),
      });
      const elapsedMs =
        typeof performance !== 'undefined' ? Math.round(performance.now() - t0) : undefined;
      const raw = await res.text();
      authDebug('register:response', {
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
          console.error('[LabCore auth] register: JSON parse failed', parseErr);
        }
        throw new Error(`Registration: server returned non-JSON (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data.message ?? 'Registration failed');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (isAuthDebugEnabled()) {
        console.error('[LabCore auth] register:error', {
          message,
          name: err instanceof Error ? err.name : typeof err,
          registerUrl,
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
    <AuthPremiumShell mainAriaLabel="Register lab" regionAriaLabel="Lab registration form" wide>
      <header className="pb-2 text-center sm:pb-3">
        <h2 className={AUTH_PAGE_TITLE_CLASS}>Register your lab</h2>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className={AUTH_LINK_CLASS}>
            Sign in
          </Link>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 sm:mt-8 sm:space-y-3.5 md:space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0">
            <label htmlFor="labName" className={AUTH_LABEL_CLASS}>
              Lab name
            </label>
            <input
              id="labName"
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className={AUTH_INPUT_CLASS}
              autoComplete="organization"
              required
              aria-required="true"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="adminName" className={AUTH_LABEL_CLASS}>
              Your name
            </label>
            <input
              id="adminName"
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className={AUTH_INPUT_CLASS}
              autoComplete="name"
              required
              aria-required="true"
            />
          </div>
        </div>
        <div>
          <label htmlFor="adminMobile" className={AUTH_LABEL_CLASS}>
            Mobile number
          </label>
          <input
            id="adminMobile"
            type="text"
            inputMode="numeric"
            value={adminMobile}
            onChange={(e) => setAdminMobile(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="e.g. 9876543210"
            autoComplete="tel"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="adminEmail" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
            autoComplete="email"
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
            autoComplete="new-password"
            minLength={6}
            placeholder="Create a password"
            required
          />
          <p className={AUTH_HINT_CLASS}>Minimum 6 characters</p>
        </div>
        {error && (
          <p className={`${AUTH_ERROR_CLASS} text-pretty break-words`} role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <AuthPremiumSubmitButton loading={loading} loadingLabel="Creating…">
          Create lab & account
        </AuthPremiumSubmitButton>
      </form>

    </AuthPremiumShell>
  );
}
