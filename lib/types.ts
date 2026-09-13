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
  theme: string;
  notifications: boolean;
  eazytoolsOwner?: boolean;
}
export interface Holding {
  symbol: string;
  quantity: number;
  costCents: number;
}
export interface Portfolio extends BaseRecord {
  uid: string;
  balance?: number;
  availableBalance?: number;
  pendingBalance?: number;
  portfolioValue?: number;
  totalInvested?: number;
  totalProfit?: number;
  totalLoss?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  currency?: string;
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
export interface WalletMethod extends BaseRecord {
  assetName: string;
  symbol: string;
  network: string;
  walletAddress: string;
  qrImage: string;
  instructions: string;
  status: 'enabled' | 'disabled';
  displayOrder: number;
}
export interface UploadRecord extends BaseRecord {
  uid: string;
  purpose: 'qr' | 'proof' | 'brand';
  path: string;
  contentType: string;
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
  walletMethodId?: string;
  network?: string;
  walletAddress?: string;
  externalReference?: string;
  proofImage?: string;
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
  logoUrl: string;
  supportPhone: string;
  emailContent: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  telegramEnabled: boolean;
  telegramUrl: string;
  liveChatEnabled: boolean;
  liveChatEmbedCode: string;
}
export type Collection =
  | 'walletMethods'
  | 'uploads'
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
  walletMethods: WalletMethod[];
  users?: UserProfile[];
  portfolios?: Portfolio[];
  content?: { id: string; title: string; body: string }[];
}
