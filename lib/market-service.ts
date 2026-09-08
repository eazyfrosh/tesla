// Server-only adapter boundary. Provider keys never enter client bundles.
import 'server-only';
import { get } from './store';
import type { Market } from './types';
export interface MarketDataProvider {
  quote(symbol: string): Promise<Market | undefined>;
}
class DemoProvider implements MarketDataProvider {
  quote(symbol: string) {
    return get<Market>('marketData', symbol);
  }
}
export function marketProvider(): MarketDataProvider {
  const provider = process.env.MARKET_PROVIDER ?? 'demo';
  if (provider !== 'demo')
    throw new Error('Live provider adapter is not configured. Set MARKET_PROVIDER=demo.');
  return new DemoProvider();
}
