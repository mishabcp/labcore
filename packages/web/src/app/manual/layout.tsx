import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Manual — LabCore LIMS',
  description:
    'LabCore LIMS user guide: patients, orders, samples, results, reports, billing, and settings.',
};

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return children;
}
