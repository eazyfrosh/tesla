'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { PlatformSettings } from '@/lib/types';

const BrandContext = createContext<PlatformSettings | null>(null);
export function BrandProvider({
  settings,
  children,
}: {
  settings: PlatformSettings;
  children: React.ReactNode;
}) {
  const [brand, setBrand] = useState(settings);

  useEffect(() => setBrand(settings), [settings]);
  useEffect(() => {
    function receivePreview(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'volterra-brand-preview')
        return;
      const next = event.data.settings as Partial<PlatformSettings> | undefined;
      if (!next) return;
      setBrand((current) => ({
        ...current,
        ...(typeof next.name === 'string' ? { name: next.name.slice(0, 60) } : {}),
        ...(typeof next.supportPhone === 'string'
          ? { supportPhone: next.supportPhone.slice(0, 40) }
          : {}),
        ...(typeof next.emailContent === 'string'
          ? { emailContent: next.emailContent.slice(0, 500) }
          : {}),
        ...(typeof next.whatsappEnabled === 'boolean'
          ? { whatsappEnabled: next.whatsappEnabled }
          : {}),
        ...(typeof next.whatsappNumber === 'string'
          ? { whatsappNumber: next.whatsappNumber.slice(0, 24) }
          : {}),
        ...(typeof next.telegramEnabled === 'boolean'
          ? { telegramEnabled: next.telegramEnabled }
          : {}),
        ...(typeof next.telegramUrl === 'string'
          ? { telegramUrl: next.telegramUrl.slice(0, 200) }
          : {}),
        ...(typeof next.liveChatEnabled === 'boolean'
          ? { liveChatEnabled: next.liveChatEnabled }
          : {}),
        ...(typeof next.liveChatEmbedCode === 'string'
          ? { liveChatEmbedCode: next.liveChatEmbedCode.slice(0, 12000) }
          : {}),
        ...(typeof next.logoUrl === 'string' &&
        (next.logoUrl === '' || /^\/api\/brand-logo\/[a-zA-Z0-9-]+$/.test(next.logoUrl))
          ? { logoUrl: next.logoUrl }
          : {}),
      }));
    }
    window.addEventListener('message', receivePreview);
    return () => window.removeEventListener('message', receivePreview);
  }, []);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}
export function useBrand() {
  return useContext(BrandContext);
}
