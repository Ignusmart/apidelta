import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DriftWatch — AI-Powered API Change Monitoring',
    template: '%s | DriftWatch',
  },
  description:
    'Stop finding out about breaking API changes from your error logs. DriftWatch monitors third-party API changelogs, classifies changes with AI, and alerts your team via Slack and email.',
  keywords: [
    'API monitoring',
    'breaking changes',
    'API changelog',
    'dependency monitoring',
    'API drift',
    'developer tools',
  ],
  metadataBase: new URL('https://driftwatch.dev'),
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
