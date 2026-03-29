/** Browser console diagnostics for auth fetch issues. Enabled in development or when NEXT_PUBLIC_DEBUG_AUTH=1 */
export function isAuthDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_AUTH === '1'
  );
}

export function authDebug(event: string, data?: Record<string, unknown>): void {
  if (!isAuthDebugEnabled()) return;
  console.info(`[LabCore auth] ${event}`, data ?? {});
}

/** Maps browser fetch failures to an actionable UI message (console still gets the raw error). */
export function friendlyAuthFetchError(message: string, apiUrl: string): string {
  if (message !== 'Failed to fetch' && message !== 'Load failed' && message !== 'NetworkError when attempting to fetch resource.') {
    return message;
  }
  return `Cannot reach the LabCore API at ${apiUrl}. From the repo root run "pnpm dev" (starts web + API) or in a second terminal run "pnpm dev:api". If the API uses another URL, set NEXT_PUBLIC_API_URL in .env and restart the web app.`;
}
