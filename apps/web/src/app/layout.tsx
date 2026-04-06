import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'DriftWatch — AI-Powered API Change Monitoring',
    template: '%s | DriftWatch',
  },
  description:
    'Stop finding out about breaking API changes from your error logs. DriftWatch monitors third-party API changelogs, classifies changes with AI, and alerts your team via Slack and email.',
  keywords: [
    'API monitoring',
    'API changelog monitoring',
    'breaking change alerts',
    'API dependency monitoring',
    'API change detection',
    'API drift',
    'developer tools',
  ],
  metadataBase: new URL('https://driftwatch.dev'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DriftWatch',
    title: 'DriftWatch — AI-Powered API Change Monitoring',
    description:
      'Monitor third-party API changelogs, classify breaking changes with AI, and alert your team via Slack and email before anything breaks.',
    url: 'https://driftwatch.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DriftWatch — AI-Powered API Change Monitoring',
    description:
      'AI-classified alerts for third-party API breaking changes. Slack + email. From $49/mo.',
  },
  alternates: { canonical: 'https://driftwatch.dev' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
