export type Role = 'user' | 'admin';
export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface UserProfile extends BaseRecord {
  uid: string;
  email: string;
  fullName: string;
  username: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  currency: string;
  role: Role;
  disabled: boolean;
  accountStatus: string;
  image: string;
  notifications: boolean;
}
export interface Holding {
  symbol: string;
  quantity: number;
  costCents: number;
}
export interface Portfolio extends BaseRecord {
  uid: string;
  cashCents: number;
  reservedCents: number;
  holdings: Holding[];
}
export interface Market extends BaseRecord {
  symbol: string;
  name: string;
  price: number;
  change: number;
  category: string;
  color: string;
}
export interface Plan extends BaseRecord {
  name: string;
  min: number;
  max: number;
  duration: number;
  description: string;
  benefits: string[];
  risk: string;
  active: boolean;
}
export interface Vehicle extends BaseRecord {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  range: number;
  condition: string;
  availability: string;
  images: string[];
  battery: string;
  performance: string;
  description: string;
  features: string[];
}
export interface Activity extends BaseRecord {
  uid: string;
  type: string;
  amountCents: number;
  status: string;
  reference: string;
  details: string;
  symbol?: string;
  quantity?: number;
  side?: string;
  orderType?: string;
  limitPrice?: number;
  planId?: string;
  vehicleId?: string;
  method?: string;
  destination?: string;
  duration?: number;
  timeline?: { status: string; at: string }[];
}
export interface Notice extends BaseRecord {
  uid: string;
  title: string;
  message: string;
  read: boolean;
}
export interface PlatformSettings extends BaseRecord {
  methods: string[];
  name: string;
  supportEmail: string;
  announcement: string;
}
export type Collection =
  | 'users'
  | 'portfolios'
  | 'marketData'
  | 'investmentPlans'
  | 'vehicles'
  | 'transactions'
  | 'deposits'
  | 'withdrawals'
  | 'investments'
  | 'orders'
  | 'notifications'
  | 'platformSettings'
  | 'rateLimits'
  | 'idempotency'
  | 'auditLogs'
  | 'content';
export interface Snapshot {
  user: UserProfile;
  portfolio: Portfolio;
  markets: Market[];
  plans: Plan[];
  vehicles: Vehicle[];
  transactions: Activity[];
  deposits: Activity[];
  withdrawals: Activity[];
  investments: Activity[];
  orders: Activity[];
  notifications: Notice[];
  settings: PlatformSettings;
  users?: UserProfile[];
  portfolios?: Portfolio[];
  content?: { id: string; title: string; body: string }[];
}
