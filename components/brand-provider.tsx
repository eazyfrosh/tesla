'use client';
import { createContext, useContext } from 'react';
import type { PlatformSettings } from '@/lib/types';

const BrandContext = createContext<PlatformSettings | null>(null);
export function BrandProvider({
  settings,
  children,
}: {
  settings: PlatformSettings;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={settings}>{children}</BrandContext.Provider>;
}
export function useBrand() {
  return useContext(BrandContext);
}
