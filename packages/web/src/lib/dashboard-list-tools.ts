import { useEffect, useState } from 'react';

/** Debounced trim — matches `/dashboard/patients` search behaviour. */
export function useDebouncedValue(value: string, delayMs = 280): string {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value.trim()), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
