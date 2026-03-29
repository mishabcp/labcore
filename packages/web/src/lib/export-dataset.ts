/** Client-side tabular export helpers (CSV / JSON download, clipboard). */

export function escapeCsvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(
  columns: { key: string; header: string }[],
  rows: Record<string, string | number | null | undefined>[],
): string {
  const headers = columns.map((c) => c.header);
  const keys = columns.map((c) => c.key);
  const line = (cells: (string | number | null | undefined)[]) => cells.map(escapeCsvCell).join(',');
  const head = line(headers);
  const body = rows.map((row) => line(keys.map((k) => row[k]))).join('\r\n');
  return `${head}\r\n${body}`;
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
