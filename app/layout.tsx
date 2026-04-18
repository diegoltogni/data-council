import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Data Council',
  description:
    '5 AI analysts debate any topic in real-time with charts, data, and strong opinions.',
  openGraph: {
    title: 'The Data Council',
    description:
      '5 AI analysts. 1 topic. Real charts. No mercy. Watch AI analysts debate in a WhatsApp-style group chat.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Data Council',
    description:
      '5 AI analysts debate any topic in real-time with charts and strong opinions.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b141a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
