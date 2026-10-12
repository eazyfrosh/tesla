import type { Metadata } from 'next';
import './globals.css';
import { BrandProvider } from '@/components/brand-provider';
import { get } from '@/lib/store';
import { settings as defaultSettings } from '@/lib/data';
import type { PlatformSettings } from '@/lib/types';
export const metadata: Metadata = {
  title: { default: 'Volterra — Think ahead. Move electric.', template: '%s | Volterra' },
  description:
    'Explore illustrative markets, portfolio strategies, and discover electric vehicles. A platform. No real funds.',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=20261012', type: 'image/png', sizes: '32x32' },
      { url: '/icon.svg?v=20261012', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon-32.png?v=20261012',
    apple: [{ url: '/apple-touch-icon.png?v=20261012', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest?v=20261012',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let brand = defaultSettings;
  try {
    brand = {
      ...defaultSettings,
      ...((await get<PlatformSettings>('platformSettings', 'main')) ?? {}),
    };
  } catch {}
  return (
    <html lang="en" data-theme="dark">
      <body>
        <BrandProvider settings={brand}>{children}</BrandProvider>
      </body>
    </html>
  );
}
