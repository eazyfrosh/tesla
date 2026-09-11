import type { Metadata } from 'next';
import './globals.css';
import { BrandProvider } from '@/components/brand-provider';
import { get } from '@/lib/store';
import { settings as defaultSettings } from '@/lib/data';
import type { PlatformSettings } from '@/lib/types';
export const metadata: Metadata = {
  title: { default: 'Volterra — Think ahead. Move electric.', template: '%s | Volterra' },
  description:
    'Explore simulated markets, portfolio strategies, and discover electric vehicles. A platform. No real funds.',
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
