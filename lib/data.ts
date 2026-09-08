import type { Market, Plan, Vehicle, UserProfile, Portfolio, PlatformSettings } from './types';
export const stamp = {
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};
export const markets: Market[] = [
  ['TSLA', 'Tesla Inc.', 248.5, 2.34, 'Stocks', '#e9434b'],
  ['AAPL', 'Apple Inc.', 224.31, 1.12, 'Stocks', '#cbd5e1'],
  ['NVDA', 'NVIDIA', 138.85, 3.67, 'Stocks', '#92d35b'],
  ['AMZN', 'Amazon', 192.53, -0.42, 'Stocks', '#fbbf24'],
  ['MSFT', 'Microsoft', 428.76, 0.85, 'Stocks', '#60a5fa'],
  ['GOOGL', 'Alphabet', 174.22, 1.32, 'Stocks', '#818cf8'],
  ['BTC-USD', 'Bitcoin', 67482.1, 2.15, 'Crypto', '#f5a623'],
  ['ETH-USD', 'Ethereum', 3521.76, -1.24, 'Crypto', '#9c9cff'],
  ['EUR-USD', 'Euro / US dollar', 1.0845, 0.12, 'Forex', '#38bdf8'],
  ['GBP-USD', 'Pound / US dollar', 1.2742, -0.08, 'Forex', '#a78bfa'],
  ['XAU-USD', 'Gold', 2348.6, 0.62, 'Commodities', '#e9c46a'],
  ['NASDAQ', 'Nasdaq Composite', 17892.16, 1.48, 'Indices', '#56b6f7'],
  ['SPX', 'S&P 500', 5487.03, 0.74, 'Indices', '#5ed2bb'],
].map(([symbol, name, price, change, category, color]) => ({
  ...stamp,
  id: String(symbol),
  symbol: String(symbol),
  name: String(name),
  price: Number(price),
  change: Number(change),
  category: String(category),
  color: String(color),
}));
export const plans: Plan[] = ['Starter', 'Growth', 'Premium', 'Elite'].map((name, i) => ({
  ...stamp,
  id: name.toLowerCase(),
  name,
  min: [100, 1000, 5000, 20000][i],
  max: [999, 4999, 19999, 100000][i],
  duration: [7, 30, 60, 90][i],
  description: [
    'Start with a small simulated allocation and learn the fundamentals.',
    'Explore a broader allocation with a longer practice horizon.',
    'Practice a concentrated strategy and understand volatility.',
    'Model an advanced allocation across a longer demo cycle.',
  ][i],
  benefits: ['Simulated allocation', 'Transparent lifecycle', 'No guaranteed returns'],
  risk: ['Moderate', 'Moderate', 'High', 'High'][i],
  active: true,
}));
const imageNames = [
  'Mega-Menu-Vehicles-Model-S-New-NA-TW-KR.png',
  'Mega-Menu-Vehicles-Model-3-Performance-LHD.png',
  'Mega-Menu-Vehicles-Model-X-New.png',
  'Mega-Menu-Vehicles-Model-Y-2-v3.jpg',
  'Mega-Menu-Vehicles-Cybertruck-1x.png',
];
export const vehicles: Vehicle[] = ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'].map(
  (model, i) => ({
    ...stamp,
    id: ['model-s', 'model-3', 'model-x', 'model-y', 'cybertruck'][i],
    make: 'Tesla',
    model,
    year: 2025,
    price: [74990, 38990, 79990, 44990, 79990][i],
    mileage: [1200, 0, 3400, 0, 500][i],
    range: [402, 363, 335, 337, 325][i],
    condition: i % 2 ? 'New' : 'Pre-owned',
    availability: 'Available',
    images: [],
    battery: ['100 kWh', '82 kWh', '100 kWh', '75 kWh', '123 kWh'][i],
    performance: ['3.1', '4.2', '3.8', '4.8', '4.1'][i] + ' sec · 0–60 mph',
    description:
      'An all-electric perspective on everyday driving. This fictional listing is provided for product demonstration; specifications and prices are illustrative, and no vehicle is offered for sale.',
    features: [
      'All-electric powertrain',
      'Panoramic cabin',
      'Premium interior',
      'Navigation',
      'Fast charging',
    ],
  }),
);
vehicles.forEach((v, i) => {
  v.images = [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto,w_220,c_scale/dpr_2.0/' +
      imageNames[i],
  ];
});
export function demoUser(id = 'demo-user', role: 'user' | 'admin' = 'user'): UserProfile {
  return {
    ...stamp,
    id,
    uid: id,
    email: role === 'admin' ? 'admin@volterra.example' : 'alex@volterra.example',
    fullName: role === 'admin' ? 'Demo Administrator' : 'Alex Morgan',
    username: role === 'admin' ? 'administrator' : 'alexm',
    phone: '',
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    currency: 'USD',
    role,
    disabled: false,
    accountStatus: 'Active',
    image: '',
    theme: 'dark',
    notifications: true,
  };
}
export function initialPortfolio(uid: string, seeded = false): Portfolio {
  return {
    ...stamp,
    id: uid,
    uid,
    cashCents: seeded ? 2450000 : 1000000,
    reservedCents: 0,
    holdings: seeded
      ? [
          { symbol: 'TSLA', quantity: 24, costCents: 528000 },
          { symbol: 'AAPL', quantity: 30, costCents: 624000 },
          { symbol: 'BTC-USD', quantity: 0.12, costCents: 744000 },
          { symbol: 'NVDA', quantity: 40, costCents: 480000 },
        ]
      : [],
  };
}
export const settings: PlatformSettings = {
  ...stamp,
  id: 'main',
  methods: ['Bank Transfer', 'Crypto', 'Card Placeholder'],
  name: 'VOLTERRA',
  supportEmail: 'support@volterra.example',
  announcement: 'Every balance, trade, and order on Volterra is simulated. No real funds.',
};
export const publicPages: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  about: {
    title: 'A clearer way to explore what’s next.',
    intro:
      'Volterra brings market simulation and electric mobility into one considered experience.',
    sections: [
      [
        'Our purpose',
        'Learn how trading, portfolio allocation, and vehicle reservations work in a fictional environment. No money changes hands.',
      ],
      [
        'Independently imagined',
        'Volterra is an original demo platform. We are not affiliated with Tesla or any listed manufacturer, exchange, or financial institution.',
      ],
    ],
  },
  'why-us': {
    title: 'Confidence starts with clarity.',
    intro: 'A practice space built around transparent information and deliberate decisions.',
    sections: [
      [
        'One connected workspace',
        'Explore markets, a simulated wallet, allocation plans, and an illustrative EV catalog.',
      ],
      [
        'Visible by design',
        'Every account and activity record is marked as a demo. There are no guaranteed returns or real payment confirmations.',
      ],
    ],
  },
  services: {
    title: 'Your next move, connected.',
    intro: 'Explore four complementary ways to practice.',
    sections: [
      [
        'Market simulation',
        'Place simulated market and limit orders across an illustrative multi-asset universe.',
      ],
      ['Portfolio practice', 'Review holdings, allocation, and cost basis.'],
      ['Demo wallet', 'Submit funding and withdrawal requests for administrator review.'],
      [
        'Electric vehicle discovery',
        'Compare fictional EV listings and track a simulated reservation.',
      ],
    ],
  },
  'for-traders': {
    title: 'Make room for a better strategy.',
    intro: 'Study the mechanics before taking a position.',
    sections: [
      [
        'A simulated market',
        'All quotes are illustrative by default. Charts do not represent real historical performance.',
      ],
      [
        'Orders that teach',
        'Market orders execute against the demo quote. Limit orders reserve cash or holdings and remain pending until reviewed for an eligible fill.',
      ],
    ],
  },
  terms: {
    title: 'Demo terms of use',
    intro: 'This service is a fictional software demonstration, not a financial service.',
    sections: [
      [
        'No financial relationship',
        'Using Volterra does not open a brokerage, investment, custody, or bank account. Demo units have no monetary value.',
      ],
      [
        'No real orders',
        'Trades, funding requests, investments, and vehicle reservations are simulated and create no right to funds, returns, or delivery.',
      ],
      [
        'Acceptable use',
        'Use fictional destination details. Do not submit real bank account details, private keys, card numbers, or sensitive identity documents.',
      ],
      [
        'Availability',
        'Demo records may be reset. This illustrative policy must be reviewed and adapted before any public operational launch.',
      ],
    ],
  },
  privacy: {
    title: 'Privacy, with intention.',
    intro: 'Only provide the information you need to use this demo.',
    sections: [
      [
        'Data collected',
        'Firebase Authentication handles sign-in credentials. Profiles and simulated activity are stored in Firestore when configured. Passwords are never stored in profile documents.',
      ],
      [
        'Session storage',
        'An HTTP-only session cookie protects signed-in access. Local preferences may be saved in your browser.',
      ],
      [
        'Your choices',
        'Edit profile details in your account. Request account removal through the platform operator; the contact form stores your request for review.',
      ],
      [
        'Deployment responsibility',
        'The operator must configure retention, deletion procedures, and jurisdiction-specific privacy notices before a public launch.',
      ],
    ],
  },
  'risk-warning': {
    title: 'Understand the risk. Always.',
    intro: 'Volterra is a simulation. Nothing here is investment advice.',
    sections: [
      [
        'Illustrative data',
        'Quotes, charts, examples, testimonials, and inventory are fictional. Simulated results do not predict real performance.',
      ],
      [
        'Real investing carries risk',
        'Stocks, digital assets, foreign exchange, and commodities can lose value. You can lose the capital you invest.',
      ],
      [
        'No guarantees',
        'Plans describe practice duration and risk, never promised yields. Volterra accepts no deposits of real money.',
      ],
    ],
  },
  'safety-of-funds': {
    title: 'No real funds. No ambiguity.',
    intro: 'There are no real funds held by this demo.',
    sections: [
      [
        'Simulated wallet',
        'Balances are fictional units controlled by server-side application logic. They cannot be redeemed.',
      ],
      [
        'Demo payment methods',
        'Payment options are workflow demonstrations. Never transfer cryptocurrency or send a real payment to use this app.',
      ],
      [
        'Protected records',
        'Server-verified sessions, role checks, atomic balance changes, and restricted database rules protect demo account integrity.',
      ],
    ],
  },
  'trading-conditions': {
    title: 'Know the mechanics.',
    intro: 'Simple, explicit conditions for a simulated environment.',
    sections: [
      [
        'Execution',
        'Market orders use the current server-side demo quote. No exchange is contacted. Limit orders stay pending until an administrator processes an eligible fill.',
      ],
      [
        'Precision',
        'Money is stored in integer USD cents. Asset quantities support up to six decimal places. The wallet is denominated in USD; currency preference does not convert balances.',
      ],
      [
        'Settlement',
        'Simulated market trades settle immediately. Withdrawals reserve available cash until approved or rejected. Investment allocations lock principal until completed or cancelled.',
      ],
      [
        'Fees and performance',
        'The demo charges no fees, models no slippage, and does not accrue investment returns. Illustrative chart history is not a statement of account.',
      ],
    ],
  },
};
export const faqs = [
  [
    'Is this real investing?',
    'No. Volterra is a fictional demonstration. All balances, trades, funding requests, and reservations are simulated.',
  ],
  [
    'Do I need to deposit money?',
    'Never send money. Your account starts with practice funds, and additional demo funding can be requested inside the wallet.',
  ],
  ['Are market prices live?', 'No. By default, every quote and chart is illustrative.'],
  [
    'Can I buy a vehicle here?',
    'You can create a simulated reservation and follow its demo timeline. No real vehicle purchase is made.',
  ],
  [
    'Do investment plans guarantee a return?',
    'No. Plans simulate allocations and lifecycles. No interest or investment return is promised or paid.',
  ],
  [
    'How is my account protected?',
    'Configured deployments use Firebase Authentication and server-verified sessions. Sensitive changes are performed on the server.',
  ],
];
