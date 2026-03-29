import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/useTranslation';

export const metadata: Metadata = {
  title: 'LabCore LIMS',
  description: 'Affordable LIMS for small diagnostic and pathology labs',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <LanguageProvider>
          <div id="main-content">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
