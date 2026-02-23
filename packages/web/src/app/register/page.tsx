'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    try {
      const res = await fetch(`${API_URL}/auth/register-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labName,
          adminName,
          adminMobile,
          adminEmail: adminEmail || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Registration failed');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Register your lab</h1>
        <p className="mt-1 text-sm text-gray-600">Create your lab and admin account</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="labName" className="block text-sm font-medium text-gray-700">
              Lab name
            </label>
            <input
              id="labName"
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
              Your name
            </label>
            <input
              id="adminName"
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="adminMobile" className="block text-sm font-medium text-gray-700">
              Mobile number
            </label>
            <input
              id="adminMobile"
              type="text"
              value={adminMobile}
              onChange={(e) => setAdminMobile(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. 9876543210"
              required
            />
          </div>
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
              Email (optional)
            </label>
            <input
              id="adminEmail"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create lab & account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>.
        </p>
      </div>
    </main>
  );
}
