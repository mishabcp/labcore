'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowDownAZ, Copy, Download, FileJson, Search } from 'lucide-react';
import { copyToClipboard, downloadTextFile, rowsToCsv } from '@/lib/export-dataset';
import { dashboardPremium } from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

export function DashboardListSearchField({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(dashboardPremium.inputClass, 'pl-11')}
        autoComplete="off"
        autoFocus={autoFocus}
      />
    </div>
  );
}

export function DashboardListSortControl<K extends string>({
  id,
  value,
  options,
  onChange,
  sortDir,
  onToggleDir,
  className,
  labeledByParent,
}: {
  id: string;
  value: K;
  options: { value: K; label: string }[];
  onChange: (k: K) => void;
  sortDir: 'asc' | 'desc';
  onToggleDir: () => void;
  /** Merged onto the control row wrapper. */
  className?: string;
  /** When true, skip the built-in sr-only label (use a visible `<label htmlFor={id}>` outside). */
  labeledByParent?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:items-center',
        className,
      )}
    >
      {labeledByParent ? null : (
        <label htmlFor={id} className="sr-only">
          Sort by
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as K)}
        className={cn(dashboardPremium.selectClass, 'min-w-0 flex-1 py-2 sm:w-auto sm:min-w-[10.5rem] sm:flex-none')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleDir}
        className={cn(dashboardPremium.ghostBtn, 'aspect-square min-w-[44px] px-0 sm:min-w-0 sm:px-3')}
        title={sortDir === 'asc' ? 'Ascending — click for descending' : 'Descending — click for ascending'}
      >
        <ArrowDownAZ
          className={cn('h-4 w-4', sortDir === 'desc' && 'rotate-180 transition-transform duration-200')}
          aria-hidden
        />
        <span className="sr-only">Toggle sort direction</span>
      </button>
    </div>
  );
}

export function DashboardDatasetExportActions({
  filePrefix,
  columns,
  rows,
  className,
}: {
  filePrefix: string;
  columns: { key: string; header: string }[];
  rows: Record<string, string | number | null | undefined>[];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const stamp = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const disabled = rows.length === 0;

  const onExportCsv = useCallback(() => {
    const csv = rowsToCsv(columns, rows);
    downloadTextFile(`${filePrefix}-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
  }, [columns, rows, filePrefix, stamp]);

  const onExportJson = useCallback(() => {
    const json = JSON.stringify(rows, null, 2);
    downloadTextFile(`${filePrefix}-${stamp}.json`, json, 'application/json;charset=utf-8');
  }, [rows, filePrefix, stamp]);

  const onCopyJson = useCallback(async () => {
    const json = JSON.stringify(rows, null, 2);
    const ok = await copyToClipboard(json);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [rows]);

  return (
    <div
      className={cn(
        'flex min-w-0 flex-row flex-wrap items-center gap-2',
        className,
      )}
    >
      <button
        type="button"
        className={cn(dashboardPremium.ghostBtn, 'shrink-0 justify-center')}
        onClick={onExportCsv}
        disabled={disabled}
      >
        <Download className="h-4 w-4 text-teal-700" aria-hidden />
        CSV
      </button>
      <button
        type="button"
        className={cn(dashboardPremium.ghostBtn, 'shrink-0 justify-center')}
        onClick={onExportJson}
        disabled={disabled}
      >
        <FileJson className="h-4 w-4 text-violet-700" aria-hidden />
        JSON
      </button>
      <button
        type="button"
        className={cn(dashboardPremium.ghostBtn, 'shrink-0 justify-center')}
        onClick={onCopyJson}
        disabled={disabled}
      >
        <Copy className="h-4 w-4 text-zinc-600" aria-hidden />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
