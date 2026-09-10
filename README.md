# VOLTERRA

Original full-stack EV and market simulation built with Next.js 16.3.4 App Router, React 19, TypeScript, Tailwind CSS 4, Firebase Authentication, Firestore, Firebase Admin, Recharts, and Lucide. Deployable to Vercel using the Node.js runtime. There is no Express server.

**Every balance, quote, chart, funding request, trade, allocation, and vehicle order is fictional. No real funds, payments, investment returns, or vehicle deliveries are supported.**

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Without Firebase credentials, development mode exposes **Demo user** and **Demo admin** buttons on the login page. The server persists this isolated sandbox in `.local-data/database.json`. It serializes writes and signs HTTP-only sessions. This fallback is forbidden when `NODE_ENV=production` or `VERCEL` is set. It is a development convenience, not a production database or authentication system.

Firebase sign-up, sign-in, and password-reset forms require the Firebase configuration below. The local sandbox never pretends those external services are configured.

## Configure Firebase

1. Create a Firebase project, enable **Authentication → Email/Password**, and create a Firestore database.
2. Copy `.env.example` to `.env.local`. Fill the Firebase web configuration and server service-account values. Keep the private key server-only, with escaped `\n` line breaks if needed.
3. Add `localhost` and the deployed Vercel domain to Authentication authorized domains. Configure the password policy and password reset email template. Enable email-enumeration protection.
4. Deploy `firestore.rules` and `firestore.indexes.json` using the Firebase CLI, authenticated to your own project:

   ```sh
   firebase deploy --only firestore --project YOUR_PROJECT_ID
   ```

5. Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` in `.env.local`, with unique 12+ character passwords. Run `npm run seed` once. The script creates Auth users, profile roles, portfolios, market quotes, plans, vehicles, sample activity, and notifications. Existing records and accounts are preserved, never overwritten. No passwords are written to Firestore or printed.
6. Sign in with the seeded administrator account. Normal registration always creates a `user` role and $10,000 of simulated cash. Admin roles are provisioned only by the trusted seed process; no browser or API action grants roles.

## Vercel deployment

Import this directory as the Vercel project root. Select the Next.js preset and Node.js 24 (Node.js 22 also meets the framework minimum). Build command: `npm run build`. Install command: `npm ci`. No output-directory override is needed.

Add Firebase public and Admin environment variables to Vercel. The public Firebase config identifies the project; the service-account private key and `MARKET_API_KEY` must **never** use the `NEXT_PUBLIC_` prefix. Redeploy after public build-time variables change. Configure the authorized domain and publish Firestore rules before allowing access.

```sh
npm run typecheck
npm test
npm run build
npm start
```

The application builds without secrets. Protected production features fail closed until Firebase is configured. No Firebase project, live credentials, or Vercel account is included. This project targets Vercel/Node, not the Cloudflare Sites runtime; Firebase Admin is not replaced with a different database or identity provider to make it fit another host.

## Architecture

- `app/`: public pages, authenticated dashboard and admin routes, Next.js API endpoints, loading/error/not-found boundaries.
- `components/`: shared primitives, public site, multi-step authentication, dashboard, admin controls, charts, and marketplace.
- `lib/engine.ts`: atomic financial and lifecycle mutation engine shared by Firestore and the local development adapter.
- `lib/store.ts`: Firestore transaction adapter and local serialized file adapter. Reads are completed before buffered Firestore writes commit.
- `lib/auth.ts`: server session verification, revocation checks, fresh profile and role checks.
- `lib/validation.ts`: Zod input allowlists. Unknown profile properties, balances, and roles cannot be smuggled into writes.
- `lib/market-service.ts`: server-only provider boundary. Default quotes are configurable mock data. To add Twelve Data/Finnhub/Alpha Vantage, implement `MarketDataProvider`, normalize symbols, keep credentials server-side, and decide how that feed changes the explicit simulation label. Merely setting an API key does not enable live data.
- `scripts/seed.ts`: idempotent development seed for a configured Firebase project.
- `tests/engine.test.ts`: money, roles, duplicate approval, limit orders, withdrawal reservations, investment lifecycle, vehicle availability, and validation tests.
- `scripts/smoke.mjs`: HTTP route and workflow integration checks against a running **local sandbox**: `node scripts/smoke.mjs`. It creates labeled demo activity and restores cash/holdings through roundtrip operations. It does not delete audit records.

## Security model

Firebase ID tokens are exchanged for eight-hour HTTP-only, SameSite=Lax session cookies; production cookies are Secure. Token exchanges require recent authentication. Every protected render and API access verifies the session with revocation checks and checks the latest profile, disabled state, and server-stored role. Disabled users cannot enter the application or mutate records, even with an existing session. Restricted accounts may view their records but cannot submit new financial activity.

All browser writes to Firestore are denied, including administrator writes. Next.js validates origins on mutations, allowlists input, checks ownership/admin roles, applies shared Firestore-backed rate limits, and executes changes inside Firestore transactions. Financial mutations require an idempotency key. Administrative changes generate append-only application audit records. The Admin SDK credential must be restricted to the deployment and never shipped to the browser.

Money is integer USD cents; quantities have at most six decimal places. No margin, shorting, real payments, or automatic profits are implemented. Limit buys reserve cash; limit sells remove quantity from available holdings and retain its basis until completion/cancellation. Admins can fill eligible limit orders against server quotes; no background matching service is implied. Withdrawals reserve cash immediately. Rejection releases it, approval deducts it once. Plan completion/cancellation returns principal only. Vehicle orders reserve catalog availability and do not debit the wallet.

All records use UTC ISO `createdAt`/`updatedAt` timestamps consistently. Database collections: `users`, `portfolios`, `transactions`, `deposits`, `withdrawals`, `investments`, `investmentPlans`, `orders`, `vehicles`, `notifications`, `platformSettings`, `marketData`, `content`, `rateLimits`, `idempotency`, `auditLogs`.

## Demonstration boundaries and launch review

- Recharts curves and percentage quote movements are clearly labeled illustrative; they are not historical account performance. Holdings value and unrealized P/L use actual demo holdings and server quotes. Currency is a preference only; balances stay denominated in USD.
- Funding methods are request placeholders. Do not collect actual card details, account numbers, private keys, or real cryptocurrency deposits.
- Transaction tables have search, filters, and pagination over up to 500 loaded records per collection. For large deployments, replace this bounded demo snapshot with indexed cursor pagination and aggregate counters before increasing account volumes.
- No external email is sent by contact or notification forms; contact submissions enter the admin content inbox. Firebase password reset is the only email integration.
- Seed history is explicitly illustrative opening activity, not a complete financial ledger. This is not financial accounting software.
- Policies, testimonials, and vehicle prices/specifications are demo copy, not jurisdiction-reviewed legal documents or genuine customer testimonials.
- Vehicle thumbnails are external Tesla CDN assets verified on official product pages, credited as courtesy of Tesla, Inc. External availability is outside this app’s control. Reuse rights have not been established for commercial publication. Replace with owned/licensed images via vehicle admin before a commercial launch. The app is not affiliated with Tesla. Image sources: https://www.tesla.com/models and https://www.tesla.com/tesla-gallery .
- Before an operational public launch: verify the real Firebase/Vercel configuration, exercise Auth flows in the deployed domain, run Firestore emulator rules tests and concurrency tests against your project, review retention/backup/monitoring, add a deployment-specific CSP, and review third-party imagery. Local tests cannot establish that a remote Firebase project is configured correctly.

## Route inventory

Public: `/`, `/about`, `/why-us`, `/services`, `/for-traders`, `/contact`, `/faq`, `/terms`, `/privacy`, `/risk-warning`, `/safety-of-funds`, `/trading-conditions`, `/cars`, `/cars/[id]`.

Auth: `/login`, `/register`, `/forgot-password`.

User: `/dashboard`, and `/dashboard/{markets,trade,portfolio,investments,wallet,deposit,withdraw,transactions,vehicles,orders,notifications,profile,settings}`, plus `/dashboard/markets/[symbol]`, `/dashboard/vehicles/[id]`, `/dashboard/orders/[id]`.

Admin: `/admin`, and `/admin/{users,transactions,deposits,withdrawals,investments,investment-plans,markets,vehicles,vehicle-orders,notifications,content,settings}`, plus `/admin/users/[id]`.

Unknown routes and unknown record IDs render the Next.js not-found boundary. Unauthenticated protected pages redirect to login; unauthorized admin APIs return 403. When the loading boundary has already begun streaming, Next.js may deliver a not-found or redirect instruction inside an HTTP 200 stream; the smoke suite verifies these framework boundaries and that no protected workspace is rendered.

## Wallet-method and zero-account update

New Firebase registrations are initialized by `lib/registration.ts` in the same Firestore transaction as their profile. Identity, role (`user`), status (`active`), and currency (`USD`) live in `users/{uid}`; zero financial fields and canonical integer-cent cash/reservations live in `portfolios/{uid}`. Registration creates no financial activity and never resets existing accounts. Explicit development seed accounts remain illustrative fixtures.

`/admin/wallet-methods` uses server-verified administrator actions. Enabled records appear on `/dashboard/deposit`. Wallet deposits snapshot the configured address/network/name and supplied reference so later address edits do not rewrite historical requests. New requests use `pending`, then `approved` or `rejected`; existing title-case records remain reviewable. Only approval creates a deposit transaction and credits simulated cash. Repeated and concurrent review is protected by the Firestore transaction and pending-state check.

Uploads use a private Vercel Blob store through `@vercel/blob`. In Vercel, open the project's Storage tab, create a Blob store with Private access, and connect it to the project; Vercel then provides `BLOB_READ_WRITE_TOKEN` (or its OIDC equivalent) automatically. Firebase Storage is no longer required for uploads. Browser writes remain denied.

Images are limited to 3 MB and PNG/JPEG/WEBP signatures. `uploads` stores metadata; wallet/deposit records store `/api/uploads/{id}` URLs. These URLs fetch private Vercel Blob objects through session-protected routes, so proof screenshots are not publicly shared. QR files are administrator-uploaded and visible to signed-in users. The local development fallback stores upload files under ignored `.local-data/uploads`; production requires the connected Blob store.

Checks: `npm test` includes registration, zero balances, role restrictions, address editing, proof ownership, deposit states, and duplicate-credit prevention. `TEST_ORIGIN=http://127.0.0.1:3004 node scripts/wallet-smoke.mjs` tests upload/download and concurrent approval against a local development server on port 3004. It uses development demo logins and must not be run against production. Existing `scripts/smoke.mjs` checks the full route set and financial round trips. Live Firebase signup/Storage verification requires a configured Admin service account and enabled bucket.
