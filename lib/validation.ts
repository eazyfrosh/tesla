import { z } from 'zod';
const text = z
  .string()
  .trim()
  .max(200)
  .refine((s) => !/[<>\u0000-\u001f]/.test(s), 'Use plain text without markup');
const id = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/)
  .refine((s) => !['constructor', 'prototype'].includes(s), 'Invalid identifier');
const money = z.coerce.number().finite().positive().max(1000000);
export const profileSchema = z.object({
  fullName: text.min(2),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,30}$/),
  phone: text,
  country: text,
  region: text.optional().default(''),
  city: text,
  currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']).default('USD'),
  image: z.union([z.literal(''), z.url().refine((s) => s.startsWith('https://'))]).default(''),
});
export const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('trade'),
    symbol: id,
    side: z.enum(['Buy', 'Sell']),
    orderType: z.enum(['Market', 'Limit']),
    quantity: z.coerce
      .number()
      .positive()
      .max(1000000)
      .refine((v) => Math.abs(v * 1e6 - Math.round(v * 1e6)) < 0.001, 'Maximum six decimal places'),
    limitPrice: money.optional(),
  }),
  z.object({
    action: z.literal('deposit'),
    amount: money,
    method: text.min(1),
    walletMethodId: id.optional(),
    network: text.optional(),
    externalReference: text.min(1).optional(),
    proofImage: z
      .string()
      .regex(/^\/api\/uploads\/[a-zA-Z0-9-]+$/)
      .optional(),
  }),
  z.object({
    action: z.literal('withdraw'),
    amount: money,
    method: text.min(1),
    destination: text.min(4),
  }),
  z.object({ action: z.literal('invest'), amount: money, planId: id }),
  z.object({ action: z.literal('order'), vehicleId: id }),
  z.object({
    action: z.literal('review'),
    collection: z.enum(['deposits', 'withdrawals', 'transactions', 'investments', 'orders']),
    id,
    status: z.enum([
      'Approved',
      'Rejected',
      'Completed',
      'Cancelled',
      'Processing',
      'Confirmed',
      'Preparing',
      'Shipped',
      'Delivered',
    ]),
  }),
  z.object({ action: z.literal('cancelTrade'), id }),
  z.object({ action: z.literal('profile'), profile: profileSchema }),
  z.object({
    action: z.literal('preferences'),
    currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']),
    theme: z.enum(['dark', 'light', 'system']).transform(() => 'dark' as const),
    notifications: z.boolean(),
  }),
  z.object({ action: z.literal('readNotification'), id }),
  z.object({
    action: z.literal('userStatus'),
    id,
    disabled: z.boolean(),
    accountStatus: z.enum(['Active', 'Under review', 'Restricted']),
  }),
  z
    .object({
      action: z.literal('savePlan'),
      id: id.optional(),
      name: text.min(2),
      min: money,
      max: money,
      duration: z.coerce.number().int().min(1).max(365),
      description: text.min(10),
      benefits: z.array(text).max(10),
      risk: z.enum(['Low', 'Moderate', 'High']),
      active: z.boolean(),
    })
    .refine((v) => v.max >= v.min, 'Maximum must be at least minimum'),
  z.object({
    action: z.literal('saveVehicle'),
    id: id.optional(),
    make: text.min(1),
    model: text.min(1),
    year: z.coerce.number().int().min(2000).max(2035),
    price: money,
    mileage: z.coerce.number().min(0).max(1000000),
    range: z.coerce.number().min(1).max(1000),
    condition: z.enum(['New', 'Pre-owned']),
    availability: z.enum(['Available', 'Reserved', 'Unavailable']),
    images: z.array(z.url().refine((s) => s.startsWith('https://'))).max(8),
    battery: text,
    performance: text,
    description: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .refine((s) => !/[<>]/.test(s)),
    features: z.array(text).max(20),
  }),
  z.object({
    action: z.literal('saveWalletMethod'),
    id: id.optional(),
    assetName: text.min(1),
    symbol: text.min(1),
    network: text.min(1),
    walletAddress: text.min(1),
    qrImage: z.union([z.literal(''), z.string().regex(/^\/api\/uploads\/[a-zA-Z0-9-]+$/)]),
    instructions: z
      .string()
      .trim()
      .max(2000)
      .refine((s) => !/[<>\u0000]/.test(s)),
    status: z.enum(['enabled', 'disabled']),
    displayOrder: z.coerce.number().int().min(0).max(10000),
  }),
  z.object({ action: z.literal('deleteVehicle'), id }),
  z.object({
    action: z.literal('settings'),
    methods: z.array(z.enum(['Bank Transfer', 'Crypto', 'Card Placeholder'])),
    name: text.min(2),
    supportEmail: z.email(),
    announcement: text,
  }),
  z.object({
    action: z.literal('saveMarket'),
    id,
    price: money,
    change: z.coerce.number().min(-99).max(1000),
  }),
  z.object({
    action: z.literal('saveContent'),
    id,
    title: text.min(2),
    body: z
      .string()
      .trim()
      .min(10)
      .max(10000)
      .refine((s) => !/[<>]/.test(s)),
  }),
  z.object({ action: z.literal('notify'), uid: id, title: text.min(2), message: text.min(2) }),
]);
export type Action = z.infer<typeof actionSchema>;
