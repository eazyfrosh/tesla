import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Volterra — Think ahead. Move electric.', template: '%s | Volterra Demo' },
  description:
    'Explore simulated markets, practice portfolio strategies, and discover electric vehicles. A fictional platform. No real funds.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
